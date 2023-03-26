import { get } from 'env-var';

export const DISCORD_CLIENT_ID = get('DISCORD_CLIENT_ID').required().asString();

export const DISCORD_CLIENT_TOKEN = get('DISCORD_CLIENT_TOKEN')
  .required()
  .asString();

export const GUILD_ID = get('GUILD_ID').required().asString();

export const WELCOME_CHANNEL_ID = get('WELCOME_CHANNEL_ID')
  .required()
  .asString();

export const LFG_ROLE_ID = get('LFG_ROLE_ID').required().asString();

export const LFG_NOTIFICATION_ROLE_ID = get('LFG_NOTIFICATION_ROLE_ID')
  .required()
  .asString();

export const LFG_CHANNEL_ID = get('LFG_CHANNEL_ID').required().asString();

export const AMBASSADOR_ROLE_ID = get('AMBASSADOR_ROLE_ID')
  .required()
  .asString();
