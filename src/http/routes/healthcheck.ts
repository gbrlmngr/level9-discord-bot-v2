import { Client } from 'discord.js';
import { Router } from 'express';
import { BAD_GATEWAY, OK } from 'http-status';

export const router = Router();

router.get('/', (req, res) => {
  const ping = (req.app.locals.discordClient as Client)?.ws?.ping;

  if (ping) {
    res.status(OK).send(`OK (${ping})`);
  } else {
    res.status(BAD_GATEWAY).send('NOTOK');
  }
});
