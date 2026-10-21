import { eventsToIcs } from '@/school/runtime/ics';
import { getSite } from '../content';

export const revalidate = 3600;

/**
 * The school's events as an iCalendar feed (/events.ics) that families can
 * subscribe to in Google Calendar, Outlook or Apple Calendar.
 */
export async function GET(): Promise<Response> {
    return new Response(eventsToIcs(await getSite()), {
        headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="events.ics"' },
    });
}
