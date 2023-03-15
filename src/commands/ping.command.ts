import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import * as signale from 'signale';
import { CommandMetadata } from '../utilities/commands';
import {
  RateLimitedException,
  RateLimiter,
  RateLimitType,
} from '../utilities/rate-limiter';

const limiter = new RateLimiter(RateLimitType.Local, 1);

export const metadata = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check if the bot is alive or not.');

export const handler =
  (metadata: CommandMetadata) =>
  async (interaction: ChatInputCommandInteraction) => {
    try {
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
    } catch (error: unknown) {
      if (error instanceof RateLimitedException) {
        throw error;
      } else {
        signale.error(
          `Unable to respond to the "ping" command (${metadata.commandExecutionId}) due to the following exception:`,
          (error as Error).message
        );

        await interaction.reply({
          content: `Something went wrong and I couldn't fulfill your request. Try again later!`,
          ephemeral: true,
        });
      }
    }
  };
