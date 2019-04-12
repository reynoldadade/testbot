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
    const images: string[] = [];
    if (data.images != null && data.images.length > 0) {
       data.images.forEach(
           (element) => {
               images.push(element.link);
           },
       );
    }
    let title: string;
    let subtitle: string;
    const text: string = s(data.description).stripHtml().truncateWords(30).toString();
    switch (topIntent) {
        case 'Speaker':
            title = data.speakers;
            subtitle = data.location;
            break;
        case 'Location':
            title = data.location;
            break;
        case 'Topic':
            title = data.title;
            subtitle = data.speakers;
            break;
        default:
            throw new Error(`No way to handle $topIntent`);

    }
    return CardFactory.heroCard(
        title,
        CardFactory.images(images),
        CardFactory.actions([
            {
                title: 'Read More...',
                type: 'Open Url',
                value: data.link,
            },
        ]),
        {
            subtitle,
            text,
        },
    );
}
