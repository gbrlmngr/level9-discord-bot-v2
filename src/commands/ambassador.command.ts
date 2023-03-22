import { randomUUID } from 'node:crypto';
import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';

import { client as prismaClient } from '../clients/prisma';
import { CommandMetadata } from '../utilities/commands';
import { RateLimiter, TimeUnitsInSeconds } from '../utilities/rate-limiter';
import {
  buildPositiveAmbassadorStatusEmbed,
  buildEligibilityStatusEmbed,
  computeEligibilityStatus,
  extractReferralCodes,
  buildNegativeAmbassadorStatusEmbed,
  parseInviteURL,
  buildNoLongerAnAmbassadorEmbed,
  buildHelpEmbed,
} from '../utilities/ambassador';
import {
  AMBASSADOR_ROLE_ID,
  WELCOME_CHANNEL_ID,
} from '../configuration/discord';
import { stripIndents } from 'common-tags';

const readLimiter = new RateLimiter(10, TimeUnitsInSeconds.Minute);
const writeLimiter = new RateLimiter(4, TimeUnitsInSeconds.Hour);

const MINIMUM_DAYS_SINCE_ACCOUNT_CREATION = 45;
const MINIMUM_DAYS_SINCE_JOINING_LEVEL9 = 30;

export const metadata = new SlashCommandBuilder()
  .setName('ambassador')
  .setDescription('Commands related to the Level9.GG Ambassadors initiative')
  .addSubcommand((command) =>
    command
      .setName('status')
      .setDescription('Show your Level9.GG Ambassadors membership status')
  )
  .addSubcommand((command) =>
    command
      .setName('eligible')
      .setDescription(
        'Find out if you are eligible to become a Level9.GG Ambassador'
      )
  )
  .addSubcommand((command) =>
    command.setName('apply').setDescription('Become a Level9.GG Ambassador')
  )
  .addSubcommand((command) =>
    command
      .setName('cancel')
      .setDescription('Cancel your Level9.GG Ambassador membership')
  )
  .addSubcommand((command) =>
    command
      .setName('help')
      .setDescription(
        'Show information about the Level9.GG Ambassador initiative'
      )
  );

export const handler =
  (metadata: CommandMetadata) =>
  async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply({ ephemeral: true });

    const subCommand = await interaction.options.getSubcommand(true);

    /* eslint-disable-next-line @typescript-eslint/ban-types */
    const subCommandRouter: Record<string, Function> = {
      status,
      eligible,
      apply,
      cancel,
      help,
    };

    if (typeof subCommandRouter[subCommand] === 'function') {
      await subCommandRouter[subCommand](interaction);
    }

    return;
  };

async function status(interaction: ChatInputCommandInteraction): Promise<void> {
  await readLimiter.consume(interaction.user.id);

  const isAmbassador = await prismaClient.references.findFirst({
    where: { type: 'referral_link', created_by: interaction.user.id },
    select: { slug: true, created_at: true, hits: true, last_hit: true },
  });

  if (isAmbassador) {
    const { slug, created_at, hits, last_hit } = isAmbassador;

    await interaction.editReply({
      embeds: [
        buildPositiveAmbassadorStatusEmbed(
          '👑 You are an **awesome Level9.GG Ambassador**!',
          slug,
          created_at!,
          hits ?? 0,
          last_hit
        ),
      ],
    });
  } else {
    await interaction.editReply({
      embeds: [buildNegativeAmbassadorStatusEmbed()],
    });
  }
}

async function eligible(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await readLimiter.consume(interaction.user.id);

  const isAlreadyAnAmbassador = await prismaClient.references.findFirst({
    where: { type: 'referral_link', created_by: interaction.user.id },
    select: { slug: true, created_at: true, hits: true, last_hit: true },
  });

  if (isAlreadyAnAmbassador) {
    const { slug, created_at, hits, last_hit } = isAlreadyAnAmbassador;

    await interaction.editReply({
      embeds: [
        buildPositiveAmbassadorStatusEmbed(
          '👑 You already are an **awesome Level9.GG Ambassador**!',
          slug,
          created_at!,
          hits ?? 0,
          last_hit
        ),
      ],
    });
  } else {
    const potentialReferralCodes = extractReferralCodes(interaction);
    const unavailableReferralCodes =
      await getExistingReferralCodesFromCodeVariants(potentialReferralCodes);

    const eligibilityStatus = computeEligibilityStatus(interaction, {
      potentialReferralCodes,
      unavailableReferralCodes,
      daysSinceCreated: MINIMUM_DAYS_SINCE_ACCOUNT_CREATION,
      daysSinceJoined: MINIMUM_DAYS_SINCE_JOINING_LEVEL9,
    });

    await interaction.editReply({
      embeds: [
        buildEligibilityStatusEmbed(
          eligibilityStatus.eligible,
          {
            createdAt: {
              eligible: eligibilityStatus.values.createdAt,
              value: interaction.user.createdAt,
            },
            joinedAt: {
              eligible: eligibilityStatus.values.joinedAt,
              value: (interaction.member as GuildMember).joinedAt!,
            },
            referralCodes: {
              eligible: eligibilityStatus.values.referralCodes.length > 0,
              value: eligibilityStatus.values.referralCodes,
            },
          },
          {
            daysSinceCreated: MINIMUM_DAYS_SINCE_ACCOUNT_CREATION,
            daysSinceJoined: MINIMUM_DAYS_SINCE_JOINING_LEVEL9,
            referralCodesAttempted: potentialReferralCodes,
          }
        ),
      ],
    });
  }
}

async function apply(interaction: ChatInputCommandInteraction): Promise<void> {
  await writeLimiter.consume(interaction.user.id);

  const isAlreadyAnAmbassador = await prismaClient.references.findFirst({
    where: { type: 'referral_link', created_by: interaction.user.id },
    select: { slug: true, created_at: true, hits: true, last_hit: true },
  });

  if (isAlreadyAnAmbassador) {
    const { slug, created_at, hits, last_hit } = isAlreadyAnAmbassador;

    await interaction.editReply({
      embeds: [
        buildPositiveAmbassadorStatusEmbed(
          '👑 You already are an **awesome Level9.GG Ambassador**!',
          slug,
          created_at!,
          hits ?? 0,
          last_hit
        ),
      ],
    });
  } else {
    const potentialReferralCodes = extractReferralCodes(interaction);
    const unavailableReferralCodes =
      await getExistingReferralCodesFromCodeVariants(potentialReferralCodes);

    const eligibilityStatus = computeEligibilityStatus(interaction, {
      potentialReferralCodes,
      unavailableReferralCodes,
      daysSinceCreated: MINIMUM_DAYS_SINCE_ACCOUNT_CREATION,
      daysSinceJoined: MINIMUM_DAYS_SINCE_JOINING_LEVEL9,
    });

    if (eligibilityStatus.eligible) {
      const welcomeChannel = interaction.guild?.channels.cache.get(
        WELCOME_CHANNEL_ID
      ) as TextChannel;
      const invite = await welcomeChannel.createInvite({
        maxAge: 0,
        temporary: false,
        unique: true,
        reason: `Level9.GG Ambassador invite auto-generation for User ${interaction.user.tag}`,
      });

      const { slug, created_at } = await prismaClient.references.create({
        data: {
          id: randomUUID(),
          type: 'referral_link',
          slug: eligibilityStatus.values.referralCodes[0],
          forward_to: invite.url,
          created_by: interaction.user.id,
        },
        select: { slug: true, created_at: true },
      });

      const ambassadorRole =
        interaction.guild?.roles.cache.get(AMBASSADOR_ROLE_ID);
      await (interaction.member as GuildMember).roles.add(ambassadorRole!);

      await interaction.editReply({
        embeds: [
          buildPositiveAmbassadorStatusEmbed(
            stripIndents`
            Your **Level9.GG Ambassador** application completed successfully!
            We are very excited for you and we are looking forward to what's next!
          `,
            slug,
            created_at!,
            0,
            null
          ),
        ],
      });
    } else {
      await interaction.editReply({
        embeds: [
          buildEligibilityStatusEmbed(
            eligibilityStatus.eligible,
            {
              createdAt: {
                eligible: eligibilityStatus.values.createdAt,
                value: interaction.user.createdAt,
              },
              joinedAt: {
                eligible: eligibilityStatus.values.joinedAt,
                value: (interaction.member as GuildMember).joinedAt!,
              },
              referralCodes: {
                eligible: eligibilityStatus.values.referralCodes.length > 0,
                value: eligibilityStatus.values.referralCodes,
              },
            },
            {
              daysSinceCreated: MINIMUM_DAYS_SINCE_ACCOUNT_CREATION,
              daysSinceJoined: MINIMUM_DAYS_SINCE_JOINING_LEVEL9,
              referralCodesAttempted: potentialReferralCodes,
            }
          ),
        ],
      });
    }
  }
}

async function cancel(interaction: ChatInputCommandInteraction): Promise<void> {
  await writeLimiter.consume(interaction.user.id);

  const referralEntry = await prismaClient.references.findFirst({
    where: { type: 'referral_link', created_by: interaction.user.id },
  });

  if (referralEntry) {
    const invite = (await interaction.guild?.invites.fetch())?.get(
      parseInviteURL(referralEntry.forward_to)
    );

    if (invite) {
      await invite.delete(
        `Level9.GG Ambassador role cancellation by User ${interaction.user.tag}`
      );
    }

    await prismaClient.references.delete({
      where: { id: referralEntry.id },
    });

    const ambassadorRole =
      interaction.guild?.roles.cache.get(AMBASSADOR_ROLE_ID);
    await (interaction.member as GuildMember).roles.remove(ambassadorRole!);

    await interaction.editReply({
      embeds: [buildNoLongerAnAmbassadorEmbed()],
    });
  } else {
    await interaction.editReply({
      embeds: [buildNegativeAmbassadorStatusEmbed()],
    });
  }
}

async function help(interaction: ChatInputCommandInteraction): Promise<void> {
  await readLimiter.consume(interaction.user.id);

  await interaction.editReply({
    embeds: [buildHelpEmbed()],
  });
}

async function getExistingReferralCodesFromCodeVariants(variants: string[]) {
  return (
    await prismaClient.references.findMany({
      where: {
        AND: [
          { OR: [{ type: 'go_link' }, { type: 'referral_link' }] },
          { OR: variants.map((variant) => ({ slug: variant })) },
        ],
      },
      select: { slug: true },
    })
  ).map(({ slug }) => slug);
}
