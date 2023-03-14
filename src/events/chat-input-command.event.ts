import { Events, Interaction } from 'discord.js';
import * as signale from 'signale';
import { clientCommands } from '../main';
import {
  RateLimitedException,
  RateLimiter,
  RateLimitType,
} from '../utilities/rate-limiter';

const limiter = new RateLimiter(RateLimitType.Server, 5000);

export const name = Events.InteractionCreate;
export const handler = async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = clientCommands.get(interaction.commandName);

  if (!command) return;

  try {
    const { user, commandName } = interaction;

    await limiter.consume();
    await command(interaction);

    signale.debug(
      `User ${user.username}#${user.discriminator} (${user.id}) ran command: ${commandName}`
    );
  } catch (error: unknown) {
    if (error instanceof RateLimitedException) {
      await interaction.reply({
        content: error.message,
        ephemeral: true,
      });
    } else {
      signale.error('Tripped by a bad interaction:', (error as Error).message);
    }
  }
};
