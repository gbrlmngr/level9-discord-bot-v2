import { Client, Events, ActivityType } from 'discord.js';
import * as signale from 'signale';
import * as metadata from '../metadata.json';

export const name = Events.ClientReady;
export const handler = async (eventClient: Client) => {
  try {
    const { user } = eventClient;

    user?.setActivity({
      type: ActivityType.Playing,
      name: `v${metadata.version}`,
    });

    signale.success(
      `Discord bot is locked and loaded! Logged in as: ${user?.username}#${user?.discriminator} (${user?.id})`
    );
  } catch (error: unknown) {
    signale.error(
      'Got a stinky situation on the ready event:',
      (error as Error).message
    );
  }
};
