import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandMetadata } from '../utilities/commands';
import { RateLimiter, RateLimitType } from '../utilities/rate-limiter';

const limiter = new RateLimiter(RateLimitType.Local, 1, 'second');

export const metadata = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check if the bot is alive or not.');

export const handler =
  (metadata: CommandMetadata) =>
  async (interaction: ChatInputCommandInteraction) => {
    limiter.addConsumer(interaction.user.id);
    await limiter.consume(interaction.user.id);

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
