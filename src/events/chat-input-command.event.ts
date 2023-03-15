import { randomUUID } from 'node:crypto';
import { Events, Interaction } from 'discord.js';
import * as signale from 'signale';
import { clientCommands } from '../main';
import {
  RateLimitedException,
  RateLimiter,
  RateLimitType,
} from '../utilities/rate-limiter';

const limiter = new RateLimiter(RateLimitType.Global, 2000, 'second');

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
      `[${commandExecutionId}] User ${user.username}#${user.discriminator} (${user.id}) ran command: ${commandName}`
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
        `[${commandExecutionId}] ${(error as Error).name}: ${
          (error as Error).message
        }`
      );

      await interaction.reply({
        content: `:flushed: We hit a brick wall and could not fulfill your request. You can either try again a bit later or ask someone from the moderation team to help you out. **Request ID: ${commandExecutionId}**.`,
        ephemeral: true,
      });
    }
  }
};
