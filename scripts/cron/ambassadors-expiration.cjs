const { schedule } = require('node-cron');
const { sign } = require('tweetnacl');
const { default: axios } = require('axios');
const signale = require('signale');

if (!process.env.AMBASSADORS_CRON_PATTERN) {
  signale.fatal('"AMBASSADORS_CRON_PATTERN" environment variable not set!');
  process.exit(1);
}

schedule(process.env.AMBASSADORS_CRON_PATTERN, async () => {
  signale.info(`"Ambassadors expiration" cron task started with the cron pattern: ${process.env.AMBASSADORS_CRON_PATTERN}`);

  try {
    if (!process.env.AMBASSADORS_EXPIRATION_CRON_TRIGGER_SECRET_KEY) {
      signale.fatal('"AMBASSADORS_EXPIRATION_CRON_TRIGGER_SECRET_KEY" environment variable not set!');
      return;
    }

    if (!process.env.AMBASSADORS_EXPIRATION_URL) {
      signale.fatal('"AMBASSADORS_EXPIRATION_URL" environment variable not set!');
      return;
    }

    const signingKeyPair = sign.keyPair.fromSecretKey(
      Buffer.from(process.env.AMBASSADORS_EXPIRATION_CRON_TRIGGER_SECRET_KEY, 'hex')
    );

    if (!signingKeyPair.secretKey) {
      signale.fatal('Signing secret key is missing or invalid!');
      return;
    }

    const timestamp = Date.now();
    const signature = sign.detached(
      Buffer.from(timestamp.toString()),
      signingKeyPair.secretKey,
    );

    const response = await axios.post(
      process.env.AMBASSADORS_EXPIRATION_URL,
      null,
      {
        headers: {
          'x-level9-signature': Buffer.from(signature).toString('hex'),
          'x-level9-timestamp': timestamp.toString(),
        }
      }
    );

    if (![200, 201, 204].includes(response.status)) {
      signale.error(`Unexpected response status code (${response.status}). Expected one of 200, 201, 204.`);
      return;
    }

    signale.success('Cron task has been processed successfully!');
  } catch (error) {
    signale.fatal('Cron task encountered an exception:', error.message);
  }
});
