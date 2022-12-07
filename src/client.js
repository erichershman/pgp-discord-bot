'use strict';

const { Client, Events, GatewayIntentBits } = require('discord.js');
const openpgp = require('openpgp');
const { token, pgpKeyGeneratorParams } = require('../config.json');

module.exports = function createDiscordClient({ logger }) {
  let generatedkey;
  let publicKey;
  let privateKey;
  let privateKeyDecrypted;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once(Events.ClientReady, async () => {
    generatedkey = await openpgp.generateKey(pgpKeyGeneratorParams);

    [publicKey, privateKey] = await Promise.all([
      openpgp.readKey({
        armoredKey: generatedkey.publicKey,
      }),
      openpgp.readPrivateKey({
        armoredKey: generatedkey.privateKey,
      }),
    ]);

    privateKeyDecrypted = await openpgp.decryptKey({
      privateKey,
      passphrase: pgpKeyGeneratorParams.passphrase,
    });

    logger.info('PGP Bot Running...');
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (interaction.commandName === 'encrypt') {
      const replytext = interaction.options.getString('text');

      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({
          text: replytext,
        }),
        encryptionKeys: [publicKey],
        signingKeys: [privateKeyDecrypted],
      });

      try {
        await interaction.reply({
          ephemeral: true,
          content: encrypted.replace('-----END', '\n-----END'),
        }); // message response, needs to take in PGP
      } catch (ex) {
        interaction.reply('Text could not be encrypted.');
        return ex;
      }
    } else if (interaction.commandName === 'decrypt') {
      if (!interaction.member.roles.cache.some(role => role.name === 'super gay')) {
        interaction.reply('You do not have permission to use the decrypt feature.');
        return null;
      }

      const replytext = interaction.options
        .getString('text')
        .replaceAll(' ', '')
        .replace('BEGINPGPMESSAGE', 'BEGIN PGP MESSAGE')
        .replace('ENDPGPMESSAGE', 'END PGP MESSAGE')
        .replace('MESSAGE-----', 'MESSAGE-----\n\n')
        .replace('-----END', '\n\n-----END');

      //  logger.log(replytext);

      let decrypted;
      let signatures;
      try {
        const decryptedMesssage = await openpgp.decrypt({
          decryptionKeys: [privateKeyDecrypted],
          verificationKeys: publicKey.getKeys(),
          message: await openpgp.readMessage({
            armoredMessage: replytext,
          }),
        });

        decrypted = decryptedMesssage.data;
        signatures = decryptedMesssage.signatures;
      } catch (ex) {
        interaction.reply('Invalid Encrypted Text');
        return null;
      }

      try {
        await signatures[0].verified;
        interaction.reply({
          ephemeral: true,
          content: decrypted,
        });
      } catch (e) {
        interaction.reply(`Signature could not be verified: ${e.message}`);
        return null;
      }
    }

    return null;
  });

  client.login(token);

  return client;
};
