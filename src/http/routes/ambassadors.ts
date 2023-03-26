import { startOfDay, sub } from 'date-fns';
import { Client } from 'discord.js';
import { Router } from 'express';
import { BAD_GATEWAY, BAD_REQUEST, OK } from 'http-status';
import * as signale from 'signale';
import * as nacl from 'tweetnacl';

import { client as prismaClient } from '../../clients/prisma';
import { AMBASSADOR_ROLE_ID, GUILD_ID } from '../../configuration/discord';
import { AMBASSADORS_EXPIRATION_CRON_TRIGGER_SECRET_KEY } from '../../configuration/express';
import { parseInviteURL } from '../../utilities/ambassador';

export const router = Router();
const TIMESTAMP_TOLERANCE_IN_MS = 1000 * 30;

router.post('/cron', async (req, res) => {
  const discordClient = req.app.locals.discordClient as Client;

  if (!discordClient) {
    res.status(BAD_GATEWAY).send('NOTOK');
    return;
  }

  if (!req.get('x-level9-signature') && !req.get('x-level9-timestamp')) {
    res.status(BAD_REQUEST).send('NOTOK');
    return;
  }

  const secretKey = AMBASSADORS_EXPIRATION_CRON_TRIGGER_SECRET_KEY;
  const keyPair = nacl.sign.keyPair.fromSecretKey(
    Buffer.from(secretKey, 'hex')
  );
  const isRequestSignatureValid = nacl.sign.detached.verify(
    Buffer.from(req.get('x-level9-timestamp')!),
    Buffer.from(req.get('x-level9-signature')!, 'hex'),
    keyPair.publicKey
  );

  if (!isRequestSignatureValid) {
    res.status(BAD_REQUEST).send('NOTOK');
    return;
  }

  if (
    Number(req.get('x-level9-timestamp')) + TIMESTAMP_TOLERANCE_IN_MS <
      Date.now() ||
    Number(req.get('x-level9-timestamp')) >
      Date.now() + TIMESTAMP_TOLERANCE_IN_MS
  ) {
    res.status(BAD_REQUEST).send('NOTOK');
    return;
  }

  try {
    const guild = discordClient.guilds.cache.get(GUILD_ID);

    const inactiveReferrals =
      (
        await prismaClient.references.findMany({
          where: {
            last_hit: { lt: sub(startOfDay(new Date()), { days: 30 }) },
            type: 'referral_link',
          },
          select: { id: true, forward_to: true, created_by: true },
        })
      )?.filter(({ created_by }) => Boolean(created_by)) ?? [];

    if (inactiveReferrals.length > 0) {
      const referralOwners = await guild?.members.fetch({
        user: inactiveReferrals
          .map(({ created_by }) => created_by)
          .filter(Boolean) as string[],
      });

      for (const referral of inactiveReferrals) {
        signale.debug(`Processing inactive referral with ID: ${referral.id}`);

        const member = referralOwners?.get(referral.created_by!);
        await member?.roles.remove(AMBASSADOR_ROLE_ID);

        const invite = await guild?.invites.fetch(
          parseInviteURL(referral.forward_to)
        );

        if (invite?.deletable) {
          await invite.delete();
        }
      }

      await prismaClient.references.deleteMany({
        where: {
          last_hit: { lt: sub(startOfDay(new Date()), { days: 30 }) },
          type: 'referral_link',
        },
      });

      signale.complete(
        `Fully processed the inactive referrals (total: ${inactiveReferrals.length})`
      );
    } else {
      signale.debug(`No inactive referrals to process!`);
    }

    res.status(OK).send(`OK (${inactiveReferrals.length})`);
  } catch (error: unknown) {
    signale.error(
      `Unable to process inactive referrals due to: ${(error as Error).message}`
    );
    res.status(BAD_GATEWAY).send('NOTOK');
  }
});
