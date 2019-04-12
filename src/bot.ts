// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, ConversationState, TurnContext } from 'botbuilder';
import {LuisRecognizer, QnAMaker, QnAMakerResult} from 'botbuilder-ai';
import { ChoicePrompt, DialogSet, PromptOptions , WaterfallDialog, WaterfallStepContext} from 'botbuilder-dialogs';
import {createCarousel, createHeroCard} from './cards';
import {getData} from './parser';
import {ISpeakerSession} from './types';

export class MyBot {
    private qnaMaker: QnAMaker;
    private luisRecognizer: LuisRecognizer;
    private dialogs: DialogSet;
    private conversationState: ConversationState;

    constructor(qnaMaker: QnAMaker, luisRecognizer: LuisRecognizer, dialogs: DialogSet, conversationState: ConversationState) {
        this.qnaMaker = qnaMaker;
        this.luisRecognizer = luisRecognizer;
        this.dialogs = dialogs;
        this.conversationState = conversationState;
    }
    public async onTurn(turnContext: TurnContext) {
        //  catch dialog giving to bot
        const dc = await this.dialogs.createContext(turnContext);
        // wait till dialog is done and continue dialog so that dialog does not begin again
        await dc.continueDialog();
        if (turnContext.activity.text != null && turnContext.activity.text === 'help') {
        }
        if (turnContext.activity.type === ActivityTypes.Message) {
            // console.log('turn context',turnContext)
            // fixed
            const qnaResult: QnAMakerResult[] = await this.qnaMaker.getAnswers(turnContext);
            // console.log('qnaResults', qnaResult);
            if (qnaResult.length <= 0) {
                await this.luisRecognizer.recognize(turnContext).then((res) => {
                    const top = LuisRecognizer.topIntent(res);
                    const data: ISpeakerSession[] = getData(res.entities);
                    if (top === 'Time') {
                        //
                    } else if (data.length > 1) {
                        turnContext.sendActivity(createCarousel(data, top)).then((success) => {
                            console.log(success);
                        }, (rejected) => console.log(rejected));
                    } else if (data.length === 1) {
                        turnContext.sendActivity({attachments: [createHeroCard(data[0], top)]}).then((success) => {
                            console.log(success);
                        }, (rejected) => console.log(rejected));
                    }

                });

            } else {
                await turnContext.sendActivity(qnaResult[0].answer);
            }
        } else {
            // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
        await this.conversationState.saveChanges(turnContext);

    }
}
