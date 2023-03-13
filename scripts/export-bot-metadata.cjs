const { join } = require('node:path');
const { writeFile } = require('node:fs/promises');
const signale = require('signale');
const pkg = require('../package.json');

(async () => {
  try {
    signale.await('Exporting bot metadata...');

    const metadataFile = join(__dirname, '..', 'src', 'metadata.json');
    await writeFile(metadataFile, JSON.stringify({
      version: pkg.version,
    }));

    signale.success('Bot metadata has been exported!');
  } catch (error) {
    signale.error('Unable to export bot metadata due to the following exception:', error.message);
  }
})();
