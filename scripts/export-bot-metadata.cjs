const { join } = require('node:path');
const { writeFile } = require('node:fs/promises');
const signale = require('signale');
const pkg = require('../package.json');

(async () => {
  try {
    signale.await('Exporting bot metadata...');

    const botMetadataFile = join(__dirname, '..', 'src', 'bot-metadata.json');
    await writeFile(
      botMetadataFile,
      `${JSON.stringify({
        version: pkg.version,
      })}\n`
    );

    signale.success('Bot metadata has been exported!');
  } catch (error) {
    signale.error(
      'Unable to export bot metadata due to:',
      error.message
    );
  }
})();
