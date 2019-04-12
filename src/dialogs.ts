
import {ISpeakerSession, LINGO} from './types';

function getRandom(min, max): number {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
}

export function getTime(data: ISpeakerSession[]): any {
    const messages: any = [];
    data.forEach( (element, index) => {
        let message = ' ';
        if (index !== 0) {
            message += `${LINGO[getRandom(0, LINGO.length - 1)]}, `;
        }
        message += `${data[index].speakers} is speaking about ${data[index].title} at ${data[index].startTime} on ${data[index].date}.`;
        messages.push({type: 'message', text: message});
    });
    return messages;
}
