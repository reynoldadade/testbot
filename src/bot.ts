// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, ConversationState, TurnContext } from 'botbuilder';
import {LuisRecognizer, QnAMaker, QnAMakerResult} from 'botbuilder-ai';
import { ChoicePrompt, DialogSet, PromptOptions , WaterfallDialog, WaterfallStepContext} from 'botbuilder-dialogs';
import {createCarousel, createHeroCard} from './cards';
import {getTime} from './dialogs';
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
        this.addDialogs();
    }
    public async onTurn(turnContext: TurnContext) {
        //  catch dialog giving to bot
        const dc = await this.dialogs.createContext(turnContext);
        // wait till dialog is done and continue dialog so that dialog does not begin again
        await dc.continueDialog();
        if (turnContext.activity.text != null && turnContext.activity.text === 'help') {
            await dc.beginDialog('help');
        }
        if (turnContext.activity.type === ActivityTypes.Message) {
            // console.log('turn context',turnContext)
            // fixed
            const qnaResult: QnAMakerResult[] = await this.qnaMaker.getAnswers(turnContext);
            console.log('qnaResults', qnaResult);
            if (qnaResult.length > 0) {
                await turnContext.sendActivity(qnaResult[0].answer);
                console.log('still giving results for qna');
            } else {
                await this.luisRecognizer.recognize(turnContext).then((res) => {
                    const top = LuisRecognizer.topIntent(res);
                    const data: ISpeakerSession[] = getData(res.entities);
                    if (top === 'Time') {
                        dc.beginDialog('time', data)
                            .then( (dialogTurnResults) => console.log('time results', dialogTurnResults),
                                (reason) => console.log('time errors', reason));
                        //
                    } else if (data.length > 1) {
                        turnContext.sendActivity(createCarousel(data, top)).then((success) => {
                            console.log('create carousel success', success);
                        }, (rejected) => console.log('create carousel rejected', rejected));
                    } else if (data.length === 1) {
                        turnContext.sendActivity({attachments: [createHeroCard(data[0], top)]}).then((success) => {
                            console.log('create hero success' , success);
                        }, (rejected) => console.log('create hero rejected', rejected));
                    }

                });

            }
        } else {
            // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
        await this.conversationState.saveChanges(turnContext);

    }

    private addDialogs(): void {
        this.dialogs.add(new WaterfallDialog('help', [
            async (step: WaterfallStepContext) => {
                const choices = ['I want to know about a topic'
                    , 'I want to know about a speaker'
                    , 'I want to know about a venue'];
                const options: PromptOptions = {
                    choices,
                    prompt: 'What would you like to know?',

                };
                return await step.prompt('choicePrompt', options);
            },
            async (step: WaterfallStepContext) => {
                switch (step.result.index) {
                    case 0:
                        await step.context.sendActivity(`You can ask:
                            * _Is there a chatbot presentation?_
                            * _What is Michael Szul speaking about?_
                            * _Are there any Xamarin talks?_`);
                        break;
                    case 1:
                        await step.context.sendActivity(`You can ask:
                            * _Who is speaking about bots?_
                            * _Where is giving the Bot Framework talk?_
                            * _Who is speaking Rehearsal A?_`);
                        break;
                    case 2:
                        await step.context.sendActivity(`You can ask:
                            * _Where is Michael Szul talking?_
                            * _Where is the Bot Framework talk?_
                            * _What time is the Bot Framework talk?_`);
                        break;
                    default:
                        break;
                }
                return await step.endDialog();
            },
        ]));
        this.dialogs.add(new ChoicePrompt('choicePrompt'));

        this.dialogs.add(new WaterfallDialog('time', [
            async (step: WaterfallStepContext) => {
                await step.context.sendActivities(getTime(step.activeDialog.state.options));
                return await step.endDialog();
            },
        ]));
    }
}
