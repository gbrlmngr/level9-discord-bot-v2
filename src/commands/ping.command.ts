import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandMetadata } from '../utilities/commands';
import { RateLimiter, TimeUnitsInSeconds } from '../utilities/rate-limiter';

const limiter = new RateLimiter(1, TimeUnitsInSeconds.Second);

export const metadata = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check if the bot is alive or not');

export const handler =
  (metadata: CommandMetadata) =>
  async (interaction: ChatInputCommandInteraction) => {
    await limiter.consume(interaction.user.id);

    const initialReply = await interaction.reply({
      content: 'Received your ping! Analyzing...',
      fetchReply: true,
    });

    initialReply.edit(
      `Pong! I am alive and my reaction time was at around **${
        initialReply.createdTimestamp - interaction.createdTimestamp
      }ms** (websocket ping was **${
        interaction.client.ws.ping
      }ms**). You can also check <https://level9.gg/go/status> for a slightly detailed view over most of the Level9.GG services.`
    );
  };
