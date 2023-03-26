import {
  EmbedBuilder,
  inlineCode,
  italic,
  roleMention,
} from '@discordjs/builders';
import { stripIndents } from 'common-tags';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import {
  APIEmbed,
  ChatInputCommandInteraction,
  Colors,
  GuildMember,
} from 'discord.js';
import { AMBASSADOR_ROLE_ID } from '../configuration/discord';

export function toStatusEmoji(status: boolean): string {
  return status ? '✅' : '⚠️';
}

export function toReferralCode(string: string): string {
  return encodeURIComponent(
    string
      ?.split(/\s+/)
      .map((part) => part.replaceAll(/[^a-z0-9_-]+/gi, ''))
      .filter(Boolean)
      .join('-')
      .toLowerCase()
  );
}

export function parseInviteURL(url: string) {
  return url
    .replace('https://discord.gg/', '')
    .replace('https://discord.com/invite/', '');
}

export function extractReferralCodes(
  interaction: ChatInputCommandInteraction
): string[] {
  const pieces = [interaction.user.username, interaction.user.tag];

  if (
    interaction.user.username !==
    (interaction.member as GuildMember).displayName
  ) {
    pieces.unshift((interaction.member as GuildMember).displayName);
  }

  return pieces.map(toReferralCode);
}

export function computeEligibilityStatus(
  interaction: ChatInputCommandInteraction,
  {
    daysSinceCreated,
    daysSinceJoined,
    potentialReferralCodes,
    unavailableReferralCodes,
  }: {
    daysSinceCreated: number;
    daysSinceJoined: number;
    potentialReferralCodes: string[];
    unavailableReferralCodes: string[];
  }
): {
  eligible: boolean;
  values: {
    createdAt: boolean;
    joinedAt: boolean;
    referralCodes: string[];
  };
} {
  const memberCreatedAt = interaction.user.createdAt;
  const memberJoinedAt = (interaction.member as GuildMember).joinedAt;
  const isEligibleByCreatedAt =
    differenceInDays(new Date(), memberCreatedAt) >= daysSinceCreated;
  const isEligibleByJoinedAt =
    differenceInDays(new Date(), memberJoinedAt ?? new Date()) >=
    daysSinceJoined;

  const availableReferralCodes = potentialReferralCodes.filter(
    (code) => !unavailableReferralCodes.includes(code)
  );
  const isEligibleByReferralCodes = availableReferralCodes.length > 0;

  const isEligible = [
    isEligibleByCreatedAt,
    isEligibleByJoinedAt,
    isEligibleByReferralCodes,
  ].every(Boolean);

  return {
    eligible: isEligible,
    values: {
      createdAt: isEligibleByCreatedAt,
      joinedAt: isEligibleByJoinedAt,
      referralCodes: availableReferralCodes,
    },
  };
}

export function buildPositiveAmbassadorStatusEmbed(
  headline: string,
  referralCode: string,
  registrationDate: Date,
  hits?: number,
  lastHit?: Date | null
): APIEmbed {
  return new EmbedBuilder()
    .setColor(Colors.DarkOrange)
    .setTitle('Level9.GG Ambassadors')
    .setDescription(
      stripIndents`
        ${headline}
        
        If you are having trouble accessing your benefits (e.g. role not being assigned), please contact the Moderation team.
        If you want to cancel your Ambassador role, please use ${inlineCode(
          '/ambassador cancel'
        )}.
      `
    )
    .setFields([
      {
        name: 'Referral code',
        value: `**[/r/${referralCode}](https://level9.gg/r/${referralCode})**`,
        inline: true,
      },
      {
        name: 'Registered on',
        value: format(registrationDate, 'yyyy/MM/dd HH:mm'),
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: true,
      },
      {
        name: 'Hits',
        value: String(hits),
        inline: true,
      },
      {
        name: 'Last hit on',
        value: lastHit
          ? format(lastHit, 'yyyy/MM/dd HH:mm')
          : `${italic('Never')}`,
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: true,
      },
    ])
    .toJSON();
}

export function buildNegativeAmbassadorStatusEmbed(): APIEmbed {
  return new EmbedBuilder()
    .setColor(Colors.DarkOrange)
    .setTitle('Level9.GG Ambassadors')
    .setDescription(
      stripIndents`      
        You are not yet a **Level9.GG Ambassador**, but nothing stops you to become one!

        To see if you are eligible, use ${inlineCode('/ambassador eligible')}.
        If you **know** you are eligible, use ${inlineCode(
          '/ambassador apply'
        )}.
      `
    )
    .toJSON();
}

export function buildEligibilityStatusEmbed(
  isUserEligible: boolean,
  fields: {
    createdAt: {
      eligible: boolean;
      value: Date;
    };
    joinedAt: {
      eligible: boolean;
      value: Date;
    };
    referralCodes: {
      eligible: boolean;
      value: string[];
    };
  },
  conditions: {
    daysSinceCreated: number;
    daysSinceJoined: number;
    referralCodesAttempted: string[];
  }
) {
  return new EmbedBuilder()
    .setColor(Colors.DarkOrange)
    .setTitle('Level9.GG Ambassadors')
    .setDescription(
      stripIndents`
        Thank you for your interest in being a **Level9.GG Ambassador**!
        
        ${
          isUserEligible
            ? stripIndents`
              🥳 It looks like **you are totally eligible** to become an Ambassador!
              You can apply anytime by using ${inlineCode(
                '/ambassador apply'
              )}.`
            : stripIndents`
              😣 Bummer! You're not quite **yet** eligible to become an Ambassador.
              \n**But...**
              You should be eligible as soon as you meet the conditions below.
            `
        }
    `
    )
    .setFields([
      {
        name: 'Discord account age',
        value: stripIndents`
        ${toStatusEmoji(fields.createdAt.eligible)} ${formatDistanceToNow(
          fields.createdAt.value
        )}
        ${
          fields.createdAt.eligible
            ? ''
            : `_Your Discord account must have been created at least ${conditions.daysSinceCreated} days ago._`
        }
      `,
      },
      {
        name: 'Level9.GG membership age',
        value: stripIndents`
        ${toStatusEmoji(fields.joinedAt.eligible)} ${formatDistanceToNow(
          fields.joinedAt.value
        )}
        ${
          fields.joinedAt.eligible
            ? ''
            : `_You must have joined Level9.GG at least ${conditions.daysSinceJoined} days ago._`
        }
      `,
      },
      {
        name: 'Referral code availability',
        value: stripIndents`
        ${toStatusEmoji(fields.referralCodes.eligible)} ${
          fields.referralCodes.eligible
            ? `**/r/${fields.referralCodes.value[0]}** is available`
            : `None available\n_Tried ${conditions.referralCodesAttempted
                .map((code) => `"${code}"`)
                .join(', ')}._`
        }
      `,
      },
    ])
    .toJSON();
}

export function buildNoLongerAnAmbassadorEmbed(): APIEmbed {
  return new EmbedBuilder()
    .setColor(Colors.DarkOrange)
    .setTitle('Level9.GG Ambassadors')
    .setDescription(
      stripIndents`      
        Your **Level9.GG Ambassador** cancellation completed successfully!
        🙏 Thank you for everything you've done as an Ambassador!

        If this is a mistake, you can re-apply by using ${inlineCode(
          '/ambassador apply'
        )}.
      `
    )
    .toJSON();
}

export function buildHelpEmbed(): APIEmbed {
  return new EmbedBuilder()
    .setColor(Colors.DarkOrange)
    .setTitle('Level9.GG Ambassadors')
    .setDescription(
      stripIndents`
        We know for a fact that a strong Community is built on trust and is grown organically. That's a fancy way of saying _I bring in my friends, and you bring in your friends_.
        This is how we built Level9.GG up until this point, but we feel like we can improve the process even more.

        **Level9.GG Ambassadors** is how we do this - a fully automated way of growing the Community!

        Once you apply to become an Ambassador, we will automagically:
        ✨ generate your dedicated referral link (e.g. **/r/[your-discord-username]**)
        ✨ generate a Discord invitation that is automatically linked to your referral link
        ✨ assign you the ${roleMention(AMBASSADOR_ROLE_ID)} role

        **What I get as an Ambassador?**
        🎯 priority on Community requests (e.g. features or access requests)
        🎯 special access on all of our own game servers (where applicable)
        🎯 access to the ${roleMention(
          AMBASSADOR_ROLE_ID
        )} private Discord channels
        🎯 ability to change your Discord nickname
        🎯 ability to create private voice channels with up to 10 members

        **What I'll have to do as an Ambassador?**
        Invite as many friends as you can through your dedicated referral link, post it on social media, stream with it, let others know about our Community.

        **I'm sold! How do I apply?**
        Find out if you are eligible by using ${inlineCode(
          '/ambassador eligible'
        )}.
        If you are eligible, you can apply by simply using ${inlineCode(
          '/ambassador apply'
        )}.

        ⚠️ **The Ambassador benefits expire if more than 30 days have passed since you last invited others using your referral link!**
        This is to ensure that the Ambassador benefits are awarded fairly and sustainably.
      `
    )
    .toJSON();
}
