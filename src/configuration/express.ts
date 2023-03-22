import { get } from 'env-var';

export const EXPRESS_PORT = get('EXPRESS_PORT').required().asPortNumber();

export const AMBASSADORS_EXPIRATION_CRON_TRIGGER_SECRET_KEY = get(
  'AMBASSADORS_EXPIRATION_CRON_TRIGGER_SECRET_KEY'
)
  .required()
  .asString();
