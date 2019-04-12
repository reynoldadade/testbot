export const LINGO: string[] = ['Also', 'In Addition', 'Additionally', 'Likewise'];

export interface ISpeakerImage {
    type: string;
    link: string;
}

export interface ISpeakerSession {
    date: string;
    startTime: string;
    endTime: string;
    title: string;
    description: string;
    speakers: string;
    location: string;
    keywords: string;
    link: string;
    type: string;
    images?: ISpeakerImage[];
}
