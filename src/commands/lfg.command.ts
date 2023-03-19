import {
  ChatInputCommandInteraction,
  GuildMemberRoleManager,
  SlashCommandBuilder,
  ThreadAutoArchiveDuration,
  inlineCode,
  roleMention,
  userMention,
  channelMention,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import {
  LFG_CHANNEL_ID,
  LFG_NOTIFICATION_ROLE_ID,
  LFG_ROLE_ID,
} from '../configuration/discord';
import { CommandMetadata } from '../utilities/commands';
import { RateLimiter, TimeUnitsInSeconds } from '../utilities/rate-limiter';
import { getRandomGameHintFor, formatHint } from '../utilities/lfg';

const limiter = new RateLimiter(8, TimeUnitsInSeconds.Hour);

export const metadata = new SlashCommandBuilder()
  .setName('lfg')
  .setDescription(
    'Notify the community that you are interested in playing a game or abort a previous group search'
  )
  .addSubcommand((command) =>
    command
      .setName('start')
      .setDescription('Start the search for a group to play a game with')
      .addStringOption((option) =>
        option
          .setName('game')
          .setDescription('What game would you like to play?')
          .setRequired(true)
          .setMaxLength(96)
      )
  )
  .addSubcommand((command) =>
    command
      .setName('stop')
      .setDescription('Abort the active search for a group')
  );

export const handler =
  (metadata: CommandMetadata) =>
  async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    await limiter.consume(interaction.user.id);

    const lfgChannel = interaction.guild?.channels.cache.get(LFG_CHANNEL_ID);

    if (!lfgChannel?.id) {
      throw new Error(
        `"Looking for Group" channel ID could not be found. Please check the "LFG_CHANNEL_ID" variable.`
      );
    }

    if (lfgChannel.id !== interaction.channel?.id) {
      await interaction.reply({
        content: `:no_entry: This command can only be used in the ${channelMention(
          lfgChannel.id
        )} channel!`,
        ephemeral: true,
      });

      return;
    }

    await interaction.deferReply({ fetchReply: true });
    const selectedSubCommand = interaction.options.getSubcommand();

    if (selectedSubCommand === 'start') {
      if (
        !(interaction.member?.roles as GuildMemberRoleManager)?.cache.has(
          LFG_ROLE_ID
        )
      ) {
        const game = interaction.options.getString('game');
        const hint = getRandomGameHintFor(game ?? '');

        await (interaction.member?.roles as GuildMemberRoleManager).add(
          LFG_ROLE_ID
        );

        const reply = await interaction.editReply({
          content: stripIndents(
            `:bell: ${roleMention(LFG_NOTIFICATION_ROLE_ID)}
            ${userMention(
              interaction.user.id
            )} is looking to join a group to play **${game}**!
            You can use the thread below to discuss.${
              hint ? ` \n\n${formatHint(hint)}` : ''
            }`
          ),
          allowedMentions: {
            repliedUser: false,
            roles: [LFG_NOTIFICATION_ROLE_ID],
          },
        });

        await reply.startThread({
          name: `${interaction.user.username}#${interaction.user.discriminator} on playing ${game} (auto-thread)`,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
          reason: 'Looking for Group auto-thread',
        });
      } else {
        await interaction.followUp({
          content: `:stop_sign: ${userMention(
            interaction.user.id
          )}, you are in an active search for a group, already! You can use ${inlineCode(
            '/lfg stop'
          )} to cancel it, and then start a new one.`,
          allowedMentions: { repliedUser: true, users: [interaction.user.id] },
        });
      }
    } else if (selectedSubCommand === 'stop') {
      if (
        (interaction.member?.roles as GuildMemberRoleManager)?.cache.has(
          LFG_ROLE_ID
        )
      ) {
        await (interaction.member?.roles as GuildMemberRoleManager).remove(
          LFG_ROLE_ID
        );

        await interaction.editReply({
          content: `:no_bell: ${userMention(
            interaction.user.id
          )} is no longer looking to join a group.`,
          allowedMentions: { repliedUser: false, users: [] },
        });
      } else {
        await interaction.followUp({
          content: `:stop_sign: ${userMention(
            interaction.user.id
          )}, you are not in an active search for a group. You can use ${inlineCode(
            '/lfg start'
          )} to start a new one.`,
          allowedMentions: { repliedUser: true, users: [interaction.user.id] },
        });
      }
    }
  };
