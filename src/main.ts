import { Client, Events, GatewayIntentBits, Interaction } from 'discord.js';
import * as signale from 'signale';
import { DISCORD_CLIENT_TOKEN } from './configuration/discord';

import * as pingCommand from './commands/ping.command';

export const clientCommands = new Map();

async function logIn(token: string): Promise<Client | void> {
  try {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    await client.login(token);

    return client;
  } catch (error) {
    signale.error(
      `Unable to log in! Is the Discord client token still avalable?`
    );
  }
}

async function registerClientEvents(client: Client): Promise<void> {
  client.on(Events.ClientReady, async (eventClient: Client) => {
    const { user } = eventClient;

    signale.success(
      `Discord bot is locked and loaded! Logged in as: ${user?.username}#${user?.discriminator} (${user?.id})`
    );
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = clientCommands.get(interaction.commandName);

    if (!command) return;

    try {
      signale.debug(
        `User "${interaction.user.id}" ran command: ${interaction.commandName}`
      );
      await command(interaction);
    } catch (error: unknown) {
      signale.error('Tripped by a bad interaction:', (error as Error).message);
    }
  });
}

async function registerClientCommands(client: Client): Promise<void> {
  clientCommands.set(pingCommand.metadata.name, pingCommand.handler);
}

async function main() {
  try {
    const client = await logIn(DISCORD_CLIENT_TOKEN);
    await registerClientEvents(client!);
    await registerClientCommands(client!);
  } catch (error: unknown) {
    signale.fatal(
      'Stopped to a halt due to the following exception:',
      (error as Error).message
    );
  }
}

main();
