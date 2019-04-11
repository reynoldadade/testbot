import { Activity, Attachment, CardFactory, MessageFactory} from 'botbuilder';
import { s } from 'metronical.proto';
import { ISpeakerSession} from './types';

export function createCarousel(data: ISpeakerSession[], topIntent: string): Partial<Activity> {
 const heroCards = [];
 data.forEach((element) => {
    heroCards.push(createHeroCard(element, topIntent));
 });
 return MessageFactory.carousel(heroCards);
}

export function createHeroCard(data: ISpeakerSession, topIntent: string): Attachment {
    return CardFactory.heroCard(
        '',
        CardFactory.images(['']),
        CardFactory.actions([
            {
                title: 'Read More...',
                type: 'Open Url',
                value: '',
            },
        ]),
    );
}