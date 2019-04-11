// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, TurnContext } from 'botbuilder';
import {LuisRecognizer, QnAMaker, QnAMakerResult} from 'botbuilder-ai';
import {createCarousel, createHeroCard} from './cards';
import {ISpeakerSession} from './types';
import {getData} from './parser';

export class MyBot {
    private qnaMaker: QnAMaker;
    private luisRecognizer: LuisRecognizer;

    constructor(qnaMaker: QnAMaker, luisRecognizer: LuisRecognizer) {
        this.qnaMaker = qnaMaker;
        this.luisRecognizer = luisRecognizer;
    }
    public async onTurn(turnContext: TurnContext) {
        if (turnContext.activity.type !== ActivityTypes.Message) {
            // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        } else {
            // console.log('turn context',turnContext)
            // fixed
            const qnaResult: QnAMakerResult[] = await this.qnaMaker.getAnswers(turnContext);
            // console.log('qnaResults', qnaResult);
            if (qnaResult.length > 0) {
                await turnContext.sendActivity(qnaResult[0].answer);
            } else {
                await this.luisRecognizer.recognize(turnContext).then((res) => {
                    const top = LuisRecognizer.topIntent(res);
                    let data: ISpeakerSession[];
                    switch (top) {
                        case 'Speaker':
                        case 'Location':
                        case 'Time':
                        case 'Topic':
                            data = getData(res.entities);
                            if (data.length > 1) {
                                console.log(createCarousel(data, top));
                                break;
                            } else if (data.length === 1) {
                                console.log(createHeroCard(data[0], top));
                                break;
                            }
                        default:
                            turnContext.sendActivity(`No way to handle ${top}`).then((response) => console.log(response));
                            break;

                    }
                });

            }
        }

    }
}
