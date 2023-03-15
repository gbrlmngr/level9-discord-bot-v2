import { randomUUID } from 'node:crypto';
import { Events, Interaction } from 'discord.js';
import * as signale from 'signale';
import { clientCommands } from '../main';
import {
  RateLimitedException,
  RateLimiter,
  RateLimitType,
} from '../utilities/rate-limiter';

const limiter = new RateLimiter(RateLimitType.Global, 2000);

export const name = Events.InteractionCreate;
export const handler = async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = clientCommands.get(interaction.commandName);

  if (!command) return;

  const commandExecutionId = randomUUID();

  try {
    const { user, commandName } = interaction;
    await limiter.consume();

    signale.debug(
      `User ${user.username}#${user.discriminator} (${user.id}) ran command: ${commandName} (${commandExecutionId})`
    );

    await command({ commandExecutionId })(interaction);
  } catch (error: unknown) {
    if (error instanceof RateLimitedException) {
      await interaction.reply({
        content: error.message,
        ephemeral: true,
      });
    } else {
      signale.error(
        `Tripped by a bad interaction (${commandExecutionId}):`,
        (error as Error).message
      );

      await interaction.reply({
        content: `Something went wrong and I couldn't fulfill your request. Try again later!`,
        ephemeral: true,
      });
    }
  }
};
