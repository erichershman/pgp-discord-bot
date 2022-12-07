'use strict';

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { appId, token } = require('./config.json');

const commands = [
  {
    name: 'encrypt',
    description: 'PGP Encrypts Message using Redlight PGP Key',
    options: [
      {
        name: 'text',
        description: 'Unencrypted Text',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'decrypt',
    description: 'Decrypts PGP Message',
    options: [
      {
        name: 'text',
        description: 'Decrypted Clear Text',
        type: 3,
        required: true,
      },
    ],

  },

];

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(appId), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
