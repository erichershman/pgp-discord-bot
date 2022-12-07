'use strict';

const createDiscordClient = require('./client');
const createLogger = require('./logger');

createDiscordClient({
  logger: createLogger(),
});
