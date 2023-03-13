import { Events, Interaction } from 'discord.js';
import * as signale from 'signale';
import { clientCommands } from '../main';

export const name = Events.InteractionCreate;
export const handler = async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = clientCommands.get(interaction.commandName);

  if (!command) return;

  try {
    const { user, commandName } = interaction;

    signale.debug(
      `User ${user.username}#${user.discriminator} (${user.id}) ran command: ${commandName}`
    );
    await command(interaction);
  } catch (error: unknown) {
    signale.error('Tripped by a bad interaction:', (error as Error).message);
  }
};
