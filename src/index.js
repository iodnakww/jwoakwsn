// EXPRESS SERVER SETUP
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Everything is up!');
});

app.listen(10000, () => {
  console.log('✅ Express server running on http://localhost:10000');
});

// DISCORD SETUP
const { Client, Collection } = require(`discord.js`);
const fs = require('fs');
const config = require('./config');
const { getTimestamp, color } = require('./utils/loggingEffects.js');
const setupLoggers = require('./utils/setupLoggers');

const loadEnvironment = require('./scripts/bootMode');
loadEnvironment();

require('dotenv').config();
setupLoggers();

const currentVersion = `${config.botVersion}`;
const { intents, partials } = require('./utils/intents.js');

let client;
try {
    client = new Client({ 
        intents: [...intents],  
        partials: [...partials],
    }); 
} catch (error) {
    console.error(`${color.red}[${getTimestamp()}]${color.reset} [ERROR] Error while creating the client. \n${color.red}[${getTimestamp()}]${color.reset} [ERROR]`, error);
};

client.logs = require('./utils/logs');
client.config = require('./config');

client.swatch = null;
client.skins = null;
client.skinsTier = null;

const giveawayClient = require('./client/giveawayClientEvent.js');
const auditLogsClient = require('./client/auditLogsClientEvent.js');
const { handleLogs } = require("./events/CommandEvents/handleLogsEvent");
const { checkVersion } = require('./lib/version');

require('./functions/processHandlers')();

client.commands = new Collection();
client.pcommands = new Collection();
client.aliases = new Collection();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const triggerFiles = fs.readdirSync("./src/triggers").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events")
const pcommandFolders = fs.readdirSync('./src/prefix');
const commandFolders = fs.readdirSync("./src/commands");

const token = process.env.token;
if (!token) {
    console.log(`${color.red}[${getTimestamp()}]${color.reset} [TOKEN] No token provided. Please provide a valid token in the .env file. ${config.botName} cannot launch without a token.`);
    return;
}

giveawayClient(client);
auditLogsClient(client);

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleTriggers(triggerFiles, "./src/triggers");
    client.handleCommands(commandFolders, "./src/commands");
    client.prefixCommands(pcommandFolders, './src/prefix');

    client.login(token).then(() => {
        handleLogs(client);
        checkVersion(currentVersion);
    }).catch((error) => {
        console.error(`${color.red}[${getTimestamp()}]${color.reset} [LOGIN] Error while logging into ${config.botName}. \n${color.red}[${getTimestamp()}]${color.reset} [LOGIN]`, error);
    });
})();
