import { Clock, MapPin } from 'lucide-react';
import { Container, Section, SectionHeading, dateParts, limitItems } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

export default function Events({ section, site }: SectionProps) {
    const events = limitItems(
        [...(site.content.events ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
        section.limit,
    );

    if (events.length === 0) {
        return null;
    }

    return (
        <Section tone="muted">
            <Container className="max-w-5xl">
                <SectionHeading eyebrow={section.eyebrow ?? 'Calendar'} title={section.title ?? 'Upcoming events'} subtitle={section.subtitle} />
                <ol className="space-y-4">
                    {events.map((event) => {
                        const { day, month, year } = dateParts(event.date);

                        return (
                            <li key={`${event.date}-${event.title}`} className="school-card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-card bg-primary text-primary-foreground">
                                    <span className="school-heading text-3xl leading-none">{day}</span>
                                    <span className="mt-1 text-xs font-semibold uppercase tracking-wider">
                                        {month} {year}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="school-heading text-lg">{event.title}</h3>
                                    {event.description && <p className="mt-1 text-muted-foreground">{event.description}</p>}
                                    <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
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
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </Container>
        </Section>
    );
}
