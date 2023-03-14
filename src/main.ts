import { Client, Collection, GatewayIntentBits } from 'discord.js';
import * as signale from 'signale';
import { DISCORD_CLIENT_TOKEN } from './configuration/discord';

import * as clientReadyEvent from './events/client-ready.event';
import * as chatInputCommandEvent from './events/chat-input-command.event';

import * as pingCommand from './commands/ping.command';

/* eslint-disable-next-line */
export const clientCommands = new Collection<string, Function>();

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
}

async function main() {
  try {
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
