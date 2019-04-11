// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { BotFrameworkAdapter} from 'botbuilder';
// Import Botbuilder-ai after installation
import {LuisRecognizer, QnAMaker} from 'botbuilder-ai';
//  Import QnAI service
import {BotConfiguration, ILuisService, IQnAService} from 'botframework-config';
// Import dotenv for config
import {config} from 'dotenv';
import * as restify from 'restify';
// This bot's main dialog.
import { MyBot } from './bot';

config();

const botConfig = BotConfiguration.loadSync('./mytestbot.bot', process.env.botFileSecret);

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: process.env.microsoftAppID,
    appPassword: process.env.microsoftAppPassword,
});

// adding qna maker details and endpoints
const qnaMaker = new QnAMaker({
    endpointKey: (botConfig.findServiceByNameOrId('qnaMakerBot') as IQnAService).endpointKey,
    host: (botConfig.findServiceByNameOrId('qnaMakerBot') as IQnAService).hostname,
    knowledgeBaseId: (botConfig.findServiceByNameOrId('qnaMakerBot') as IQnAService).kbId,
});

// connecting to luis with your recognizer
const luisRecognizer = new LuisRecognizer({
    applicationId: (botConfig.findServiceByNameOrId('luisBot') as ILuisService).appId,
    endpoint: (botConfig.findServiceByNameOrId('luisBot') as ILuisService).getEndpoint(),
    endpointKey: (botConfig.findServiceByNameOrId('luisBot') as ILuisService).authoringKey,
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong! ${error}`);
};

//  Create the main dialog.
const myBot: MyBot = new MyBot(qnaMaker, luisRecognizer);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.onTurn(context);
    });
});
