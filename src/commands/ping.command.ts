import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const metadata = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check if the bot is alive or not.');

export const handler = async (interaction: ChatInputCommandInteraction) => {
  await interaction.reply({
    content: `Pong! I am pretty much alive and reacted in around ${interaction.client.ws.ping}ms.`,
    ephemeral: true,
  });
};
