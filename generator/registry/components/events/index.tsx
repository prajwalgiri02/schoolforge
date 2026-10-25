'use client';

import { CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin, Rss } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFileHref } from '../../adapter';
import { Container, Section, SectionHeading, cn, limitItems } from '../../runtime/ui';
import { calendarMonth, formatSiteDate, isoDate, localizeDigits, siteDateParts, t, weekdayNames } from '../../runtime/i18n';
import { EVENTS_FEED_PATH, eventIcsHref, type CalendarEvent } from '../../runtime/ics';
import type { SectionProps, SiteData } from '../../runtime/types';

type EventsProps = SectionProps<{ subscribe?: boolean }>;

const lastDay = (event: CalendarEvent) => (event.endDate && event.endDate > event.date ? event.endDate : event.date);

export default function Events({ section, site }: EventsProps) {
    const feedHref = useFileHref(EVENTS_FEED_PATH);
    const sorted = [...(site.content.events ?? [])].sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) {
        return null;
    }

    return (
        <Section tone="muted">
            <Container className="max-w-5xl">
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'calendar')} title={section.title ?? t(site, 'upcomingEvents')} subtitle={section.subtitle} />
                {section.variant === 'calendar' ? <MonthCalendar site={site} events={sorted} /> : <EventList site={site} events={limitItems(sorted, section.limit)} />}
                {section.subscribe !== false && (
                    <p className="mt-8 text-center">
                        <a href={feedHref} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                            <Rss className="h-4 w-4" aria-hidden="true" /> {t(site, 'subscribeCalendar')}
                        </a>
                    </p>
                )}
            </Container>
        </Section>
    );
}

function EventList({ site, events }: { site: SiteData; events: CalendarEvent[] }) {
    return (
        <ol className="space-y-4">
            {events.map((event) => {
                const { day, month, year } = siteDateParts(site, event.date);

                return (
                    <li key={`${event.date}-${event.title}`} className="school-card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-card bg-primary text-primary-foreground">
                            <span className="school-heading text-3xl leading-none">{day}</span>
                            <span className="mt-1 text-xs font-semibold uppercase tracking-wider">
                                {month} {year}
                            </span>
                        </div>
                        <EventDetails site={site} event={event} />
                    </li>
                );
            })}
        </ol>
    );
}

function EventDetails({ site, event }: { site: SiteData; event: CalendarEvent }) {
    return (
        <div className="flex-1">
            {event.category && <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">{event.category}</p>}
            <h3 className="school-heading text-lg">{event.title}</h3>
            {event.description && <p className="mt-1 text-muted-foreground">{event.description}</p>}
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {lastDay(event) !== event.date && <span>{t(site, 'until', { date: formatSiteDate(site, lastDay(event)) })}</span>}
                {event.time && (
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-accent-strong" aria-hidden="true" /> {event.time}
                    </span>
                )}
                {event.location && (
                    <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-accent-strong" aria-hidden="true" /> {event.location}
                    </span>
                )}
                <a href={eventIcsHref(site, event)} download={`${event.date}.ics`} className="flex items-center gap-1.5 font-medium text-primary hover:underline">
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" /> {t(site, 'addToCalendar')}
                </a>
            </p>
        </div>
    );
}

/**
 * A month grid in the site's calendar (Bikram Sambat for Nepali sites). It opens
 * on the first event's month while rendering on the server, then moves to the
 * month of the next upcoming event in the browser.
 */
function MonthCalendar({ site, events }: { site: SiteData; events: CalendarEvent[] }) {
    const [anchor, setAnchor] = useState(events[0].date);
    const [offset, setOffset] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const month = calendarMonth(site, anchor, offset);
    const firstWeekday = new Date(`${month.days[0]}T00:00:00`).getDay();
    const eventsOn = (day: string) => events.filter((event) => event.date <= day && lastDay(event) >= day);
    const monthEvents = events.filter((event) => event.date <= month.days[month.days.length - 1] && lastDay(event) >= month.days[0]);
    const shown = selected ? eventsOn(selected) : monthEvents;
    const today = useToday();

    useEffect(() => {
        const now = isoDate(new Date());
        setAnchor(events.find((event) => lastDay(event) >= now)?.date ?? now);
        setOffset(0);
    }, [events]);

    const go = (delta: number) => {
        setOffset(offset + delta);
        setSelected(null);
    };

    return (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="school-card p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <button type="button" onClick={() => go(-1)} aria-label={t(site, 'previousMonth')} className="rounded-full p-2 hover:bg-muted">
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <h3 className="school-heading text-lg" aria-live="polite">
                        {month.label}
                    </h3>
                    <button type="button" onClick={() => go(1)} aria-label={t(site, 'nextMonth')} className="rounded-full p-2 hover:bg-muted">
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted-foreground">
                    {weekdayNames(site).map((name) => (
                        <span key={name} className="py-1">
                            {name}
                        </span>
                    ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                    {Array.from({ length: firstWeekday }, (_, index) => (
                        <span key={`blank-${index}`} />
                    ))}
                    {month.days.map((day, index) => {
                        const count = eventsOn(day).length;

                        return (
                            <button
                                key={day}
                                type="button"
                                disabled={count === 0}
                                aria-pressed={selected === day}
                                aria-label={count > 0 ? t(site, 'eventsOn', { date: formatSiteDate(site, day, 'long') }) : formatSiteDate(site, day, 'long')}
                                onClick={() => setSelected(selected === day ? null : day)}
                                className={cn(
                                    'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition',
                                    count > 0 ? 'bg-primary/10 font-semibold text-primary hover:bg-primary/20' : 'text-foreground/70',
                                    selected === day && 'bg-primary text-primary-foreground hover:bg-primary',
                                    day === today && 'ring-2 ring-accent',
                                )}
                            >
                                {localizeDigits(site, index + 1)}
                                {count > 0 && <span className={cn('absolute bottom-1.5 h-1.5 w-1.5 rounded-full', selected === day ? 'bg-primary-foreground' : 'bg-accent')} aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div>
                <h3 className="school-heading mb-4 text-lg">{selected ? t(site, 'eventsOn', { date: formatSiteDate(site, selected, 'long') }) : month.label}</h3>
                {shown.length === 0 ? (
                    <p className="text-muted-foreground">{t(site, 'noEventsThisMonth')}</p>
                ) : (
                    <ul className="space-y-4">
                        {shown.map((event) => (
                            <li key={`${event.date}-${event.title}`} className="school-card p-5">
                                <p className="mb-1 text-sm font-semibold text-primary">{formatSiteDate(site, event.date, 'full')}</p>
                                <EventDetails site={site} event={event} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

/** Today's date, known only in the browser so server and client markup match. */
function useToday(): string | null {
    const [today, setToday] = useState<string | null>(null);

    useEffect(() => setToday(isoDate(new Date())), []);

    return today;
}
