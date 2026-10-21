import { eventsToIcs } from '@/school/runtime/ics';
import { defaultLocale, sites } from '@/school/sites';

export const dynamic = 'force-static';

/**
 * The school's events as an iCalendar feed (/events.ics) that families can
 * subscribe to in Google Calendar, Outlook or Apple Calendar.
 */
export function GET(): Response {
    return new Response(eventsToIcs(sites[defaultLocale]), {
        headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="events.ics"' },
    });
}
