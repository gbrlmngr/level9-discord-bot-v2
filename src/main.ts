import { Client, Collection, GatewayIntentBits } from 'discord.js';
import * as signale from 'signale';
import EventEmitter from 'eventemitter3';

import { DISCORD_CLIENT_TOKEN } from './configuration/discord';
import { start as startExpressServer } from './http/server';

import * as clientReadyEvent from './events/client-ready.event';
import * as chatInputCommandEvent from './events/chat-input-command.event';

import { CommandHandler } from './utilities/commands';
import * as pingCommand from './commands/ping.command';
import * as lfgCommand from './commands/lfg.command';

const eventEmitterInstance = new EventEmitter();

/* eslint-disable-next-line */
export const clientCommands = new Collection<string, CommandHandler<any>>();

async function logIn(token: string): Promise<Client | void> {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  await client.login(token);

  return client;
}

async function registerClientEvents(client: Client): Promise<void> {
  client.once(clientReadyEvent.name, clientReadyEvent.handler);
  client.on(chatInputCommandEvent.name, chatInputCommandEvent.handler);
}

async function registerClientCommands(): Promise<void> {
  clientCommands.set(pingCommand.metadata.name, pingCommand.handler);
  clientCommands.set(lfgCommand.metadata.name, lfgCommand.handler);
}

async function main() {
  try {
    const client = await logIn(DISCORD_CLIENT_TOKEN);

    if (!client) {
      throw new Error(
        `Discord client not available! Is the Discord client token still valid?`
      );
    }

    await registerClientCommands();
    await registerClientEvents(client);
    startExpressServer(client, eventEmitterInstance);
  } catch (error: unknown) {
    signale.fatal('Stopped to a halt due to:', (error as Error).message);
  }
}

main();

process.on('uncaughtException', (error) => {
  signale.fatal('Stopped to a halt due to:', (error as Error).message);
});
