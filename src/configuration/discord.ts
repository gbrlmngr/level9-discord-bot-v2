import { get } from 'env-var';

export const DISCORD_CLIENT_ID = get('DISCORD_CLIENT_ID').required().asString();

export const DISCORD_CLIENT_TOKEN = get('DISCORD_CLIENT_TOKEN')
  .required()
  .asString();
