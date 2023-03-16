import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { default as express } from 'express';
import * as signale from 'signale';
import { DISCORD_CLIENT_TOKEN } from './configuration/discord';
import { EXPRESS_PORT } from './configuration/express';

import * as clientReadyEvent from './events/client-ready.event';
import * as chatInputCommandEvent from './events/chat-input-command.event';

import { CommandHandler } from './utilities/commands';
import * as pingCommand from './commands/ping.command';
import * as lfgCommand from './commands/lfg.command';

/* eslint-disable-next-line */
export const clientCommands = new Collection<string, CommandHandler<any>>();
const expressApp = express();

async function logIn(token: string): Promise<Client | void> {
  try {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    await client.login(token);

    return client;
  } catch (error) {
    signale.error(`Unable to log in! Is the Discord client token still valid?`);
  }
}

async function registerClientEvents(client: Client): Promise<void> {
  client.once(clientReadyEvent.name, clientReadyEvent.handler);
  client.on(chatInputCommandEvent.name, chatInputCommandEvent.handler);
}

async function registerClientCommands(): Promise<void> {
  clientCommands.set(pingCommand.metadata.name, pingCommand.handler);
  clientCommands.set(lfgCommand.metadata.name, lfgCommand.handler);
}

async function startExpressServer() {
  expressApp.get('/healthcheck', (_request, response) => {
    response.json({ ok: true });
  });

  expressApp.listen(EXPRESS_PORT, () => {
    signale.success(`Express server started on port ${EXPRESS_PORT}`);
  });
}

async function main() {
  try {
    await startExpressServer();

    const client = await logIn(DISCORD_CLIENT_TOKEN);
    await registerClientCommands();

    /* eslint-ignore-next-line */
    await registerClientEvents(client!);
  } catch (error: unknown) {
    signale.fatal(
      'Stopped to a halt due to the following exception:',
      (error as Error).message
    );
  }
}

main();

process.on('uncaughtException', (error) => {
  signale.fatal(
    'Stopped to a halt due to the following exception:',
    (error as Error).message
  );
});
