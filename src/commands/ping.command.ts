import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const metadata = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check if the bot is alive or not.');

export const handler = async (interaction: ChatInputCommandInteraction) => {
  const initialReply = await interaction.reply({
    content: 'Got the ping! Waiting for the pong...',
    fetchReply: true,
  });

  initialReply.edit(
    `Pong! I am alive and reacted in around ${
      initialReply.createdTimestamp - interaction.createdTimestamp
    }ms`
  );
};
