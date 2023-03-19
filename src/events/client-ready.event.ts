import { Client, Events, ActivityType } from 'discord.js';
import * as signale from 'signale';
import * as botMetadata from '../bot-metadata.json';

export const name = Events.ClientReady;
export const handler = async (eventClient: Client) => {
  try {
    const { user } = eventClient;

    user?.setActivity({
      type: ActivityType.Watching,
      name: `Level9.GG (bot version: ${botMetadata.version})`,
    });

    signale.success(
      `Discord bot is locked and loaded! Logged in as: ${user?.tag} (${user?.id})`
    );
  } catch (error: unknown) {
    signale.error(
      'Got a stinky situation on the ready event:',
      (error as Error).message
    );
  }
};
