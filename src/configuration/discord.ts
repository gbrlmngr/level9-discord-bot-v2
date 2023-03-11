import { get } from 'env-var';

export const DISCORD_CLIENT_TOKEN = get('DISCORD_CLIENT_TOKEN')
  .required()
  .asString();
