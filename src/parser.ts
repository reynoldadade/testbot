import { load as CheerioLoad } from 'cheerio';
import * as fs from 'fs';
import {ISpeakerImage, ISpeakerSession } from './types';

const file: string = fs.readFileSync('./data/edui2018.xml', 'utf-8');
const xml: CheerioStatic = CheerioLoad(file);

export function getData(entities: any): ISpeakerSession[] {
    if (entities != null) {
        const subject = entities.subject;
        const location = entities.location;
        const person = entities.person;
        if (person != null) {
            return getSessionByPerson((person instanceof Array) ? person[0] : person);
        }
        if (subject != null) {
            return getSessionBySubject((subject instanceof Array) ? subject[0] : subject);
        }
        if (location != null) {
            return getSessionByLocation((location instanceof Array) ? location[0] : location);
        }
    }
    return [];
}

export function getExact(t: string): ISpeakerSession {
    const e = writeEvent(getEventNodes('title', t));
    return (e.length > 0) ? e[0] : null;
}

function getSessionBySubject(subject: string): ISpeakerSession[] {
    return writeEvent(getEventNodes('keywords', subject).concat(getEventNodes('title', subject)));
}

function getSessionByLocation(location: string, data?: ISpeakerSession): ISpeakerSession[] {
    return writeEvent(getEventNodes('location', location));
}

function getSessionByPerson(person: string, data?: ISpeakerSession): ISpeakerSession[] {
    return writeEvent(getEventNodes('speakers', person));
}

function getEventNodes(s: string, t: string): CheerioElement[] {
    const events: CheerioElement[] = [];
    xml(s).each((idx: number, elem: CheerioElement) => {
        if (xml(elem).text().toLowerCase().indexOf(t.toLowerCase()) > -1) {
            events.push(elem.parent);
        }
    });
    return events;
}

function writeEvent(events: CheerioElement[]): ISpeakerSession[] {
    const results: ISpeakerSession[] = [];
    for (let i = 0; i < events.length; i++) {
        const elem = xml(events[i]);
        const r: ISpeakerSession = {
              date: elem.parent().attr('date')
            , description: elem.find('description').text()
            , endTime: elem.attr('end-time')
            , keywords: elem.find('keywords').text()
            , link: elem.find('page').text()
            , location: elem.find('location').text()
            , speakers: elem.find('speakers').text()
            , startTime: elem.attr('start-time')
            , title: elem.find('title').text()
            , type: elem.attr('type'),
        };
        const img = elem.find('photo');
        if (img != null) {
            const imgs: ISpeakerImage[] = [];
            img.each((idx: number, el: CheerioElement) => {
                imgs.push({
                    link: xml(el).text(),
                      type: xml(el).attr('type'),
                });
            });
            r.images = imgs;
        }
        results.push(r);
    }
    return results;
}
