import { randomUUID } from 'node:crypto';
import { Events, Interaction } from 'discord.js';
import * as signale from 'signale';

import { clientCommands } from '../main';
import {
  RateLimitedException,
  RateLimiter,
  TimeUnitsInSeconds,
} from '../utilities/rate-limiter';

const limiter = new RateLimiter(250, TimeUnitsInSeconds.Second);

export const name = Events.InteractionCreate;
export const handler = async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { user, commandName } = interaction;

  const command = clientCommands.get(interaction.commandName);

  if (!command || typeof command !== 'function') {
    signale.warn(
      `User ${user.tag} tried to run "${commandName}", but the command does not exist!`
    );
    return;
  }

  const commandExecutionId = randomUUID();

  try {
    await limiter.consume();

    signale.debug(
      `[${commandExecutionId}] User ${user.tag} (${user.id}) ran command: ${commandName}`
    );

    await command({ commandExecutionId })(interaction);
  } catch (error: unknown) {
    const replyMethod = interaction.deferred ? 'editReply' : 'reply';

    if (error instanceof RateLimitedException) {
      await interaction[replyMethod]({
        content: error.message,
        ...(interaction.deferred ? {} : { ephemeral: true }),
      });
    } else {
      signale.error(
        `[${commandExecutionId}] ${(error as Error).name}: ${
          (error as Error).message
        }`
      );

      await interaction[replyMethod]({
        content: `:flushed: We hit a brick wall and could not fulfill your request. You can either try again a bit later or ask someone from the moderation team to help you out. **Request ID: ${commandExecutionId}**.`,
        ...(interaction.deferred ? {} : { ephemeral: true }),
      });
    }
  }
};
