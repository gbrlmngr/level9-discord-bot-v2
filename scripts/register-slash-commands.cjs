const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { REST, Routes } = require('discord.js');
const signale = require('signale');

const { DISCORD_CLIENT_ID, DISCORD_CLIENT_TOKEN } = process.env;

const commandsSet = new Set();
const commandsDir = join(__dirname, '..', 'dist', 'commands');
const commandFiles = readdirSync(commandsDir).filter((file) =>
  file.endsWith('command.js')
);

for (const file of commandFiles) {
  const { metadata } = require(join(commandsDir, file));
  commandsSet.add(metadata.toJSON());
}

const discordRESTClient = new REST({ version: '10' }).setToken(
  DISCORD_CLIENT_TOKEN
);

(async () => {
  try {
    signale.await('Started the slash commands registration process...');

    const commandsReloaded = await discordRESTClient.put(
      Routes.applicationCommands(DISCORD_CLIENT_ID),
      { body: Array.from(commandsSet) }
    );

    signale.success('Finished the slash commands registration process!');
    signale.complete(
      `${commandsReloaded.length} slash commands were reloaded.`
    );
  } catch (error) {
    signale.error(
      'Unable to register the slash commands due to:',
      error.message
    );
  }
})();
