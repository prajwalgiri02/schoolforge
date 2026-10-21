import type { SiteData } from './types';

export type CalendarEvent = NonNullable<SiteData['content']['events']>[number];

/** Path of the calendar feed every target serves (subscribe in Google Calendar, Outlook...). */
export const EVENTS_FEED_PATH = '/events.ics';

type Clock = { hour: number; minute: number };

/**
 * Reads the start and end of an event's free-text time ("10:00 AM", "9 am - 1 pm",
 * "14:00–16:30"). Anything else makes the event an all-day event.
 */
export function parseEventTime(value: string | undefined): { start: Clock; end: Clock | null } | null {
    if (!value) {
        return null;
    }

    const parts = value.split(/\s*(?:-|–|—|\bto\b)\s*/i).filter(Boolean);
    const start = parseClock(parts[0]);

    if (!start) {
        return null;
    }

    let end = parts[1] ? parseClock(parts[1]) : null;

    // "9 - 11 am": the meridiem written once applies to both times.
    if (end && !/[ap]\.?m/i.test(parts[0]) && /p\.?m/i.test(parts[1]) && start.hour < 12 && start.hour + 12 <= end.hour) {
        start.hour += 12;
    }

    if (end && end.hour * 60 + end.minute <= start.hour * 60 + start.minute) {
        end = null;
    }

    return { start, end };
}

function parseClock(value: string): Clock | null {
    const match = value.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*(?:m\.?)?$/i);

    if (!match) {
        return null;
    }

    let hour = Number(match[1]);
    const minute = Number(match[2] ?? 0);
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === 'p' && hour < 12) {
        hour += 12;
    } else if (meridiem === 'a' && hour === 12) {
        hour = 0;
    }

    return hour < 24 && minute < 60 ? { hour, minute } : null;
}

const pad = (value: number) => String(value).padStart(2, '0');

function compactDate(value: string): string {
    return value.replaceAll('-', '');
}

function nextDay(value: string): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);

    return date.toISOString().slice(0, 10);
}

function escapeText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/**
 * Splits a content line into 75-byte pieces as RFC 5545 requires, without
 * cutting a multi-byte character (Devanagari is 3 bytes per character).
 */
function fold(line: string): string {
    const encoder = new TextEncoder();
    const pieces: string[] = [];
    let current = '';
    let bytes = 0;

    for (const character of line) {
        const size = encoder.encode(character).length;

        if (bytes + size > (pieces.length === 0 ? 75 : 74)) {
            pieces.push(current);
            current = '';
            bytes = 0;
        }

        current += character;
        bytes += size;
    }

    pieces.push(current);

    return pieces.join('\r\n ');
}

/**
 * A stable id part for an event title: its slug, or a short hash for titles
 * without Latin letters (e.g. Nepali).
 */
function titleId(value: string): string {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (slug) {
        return slug;
    }

    let hash = 5381;

    for (const character of value) {
        hash = (hash * 33 + (character.codePointAt(0) ?? 0)) >>> 0;
    }

    return `event-${hash.toString(36)}`;
}

function eventLines(event: CalendarEvent, host: string): string[] {
    const time = parseEventTime(event.time);
    const lastDay = event.endDate && event.endDate > event.date ? event.endDate : event.date;
    const lines = ['BEGIN:VEVENT', `UID:${event.date}-${titleId(event.title)}@${host}`, `DTSTAMP:${compactDate(event.date)}T000000Z`];

    if (time) {
        const end = time.end ?? (time.start.hour >= 23 ? { hour: 23, minute: 59 } : { hour: time.start.hour + 1, minute: time.start.minute });
        lines.push(`DTSTART:${compactDate(event.date)}T${pad(time.start.hour)}${pad(time.start.minute)}00`);
        lines.push(`DTEND:${compactDate(lastDay)}T${pad(end.hour)}${pad(end.minute)}00`);
    } else {
        lines.push(`DTSTART;VALUE=DATE:${compactDate(event.date)}`);
        lines.push(`DTEND;VALUE=DATE:${compactDate(nextDay(lastDay))}`);
    }

    lines.push(`SUMMARY:${escapeText(event.title)}`);

    if (event.description) {
        lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }

    if (event.location) {
        lines.push(`LOCATION:${escapeText(event.location)}`);
    }

    if (event.category) {
        lines.push(`CATEGORIES:${escapeText(event.category)}`);
    }

    lines.push('END:VEVENT');

    return lines;
}

/**
 * An iCalendar (.ics) document of the given events (all of the site's by default).
 * Times are "floating": calendar apps show them in the reader's own time zone,
 * which is the school's for almost every visitor.
 */
export function eventsToIcs(site: SiteData, events: CalendarEvent[] = site.content.events ?? []): string {
    const host = (site.seo?.siteUrl ?? '').replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'school.local';
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SchoolForge//School Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeText(site.school.name)}`,
        ...events.flatMap((event) => eventLines(event, host)),
        'END:VCALENDAR',
    ];

    return `${lines.map(fold).join('\r\n')}\r\n`;
}

/**
 * A download link for one event, so visitors can add it to their own calendar.
 */
export function eventIcsHref(site: SiteData, event: CalendarEvent): string {
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(eventsToIcs(site, [event]))}`;
}
