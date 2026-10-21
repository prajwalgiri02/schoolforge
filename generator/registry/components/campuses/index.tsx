import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { Container, Media, Section, SectionHeading, cn } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function Campuses({ section, site }: SectionProps) {
    const campuses = site.content.campuses ?? [];

    if (campuses.length === 0) {
        return null;
    }

    return (
        <Section tone="muted">
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'ourCampuses')} title={section.title ?? t(site, 'campusesTitle')} subtitle={section.subtitle} />
                <ul className={cn('grid gap-8', campuses.length === 1 ? 'mx-auto max-w-xl' : campuses.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3')}>
                    {campuses.map((campus) => (
                        <li key={campus.name} className="school-card flex flex-col overflow-hidden">
                            {campus.image && (
                                <div className="aspect-[16/9]">
                                    <Media src={campus.image} alt={campus.name} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                                </div>
                            )}
                            <div className="flex flex-1 flex-col p-6">
                                <h3 className="school-heading text-xl">{campus.name}</h3>
                                {campus.levels && campus.levels.length > 0 && (
                                    <p className="mt-2 flex flex-wrap gap-1.5">
                                        {campus.levels.map((level) => (
                                            <span key={level} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                {level}
                                            </span>
                                        ))}
                                    </p>
                                )}
                                {campus.description && <p className="mt-3 text-muted-foreground">{campus.description}</p>}
                                <ul className="mt-4 flex-1 space-y-2 text-sm">
                                    {campus.address && (
                                        <li className="flex gap-2">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" aria-hidden="true" /> {campus.address}
                                        </li>
                                    )}
                                    {campus.phone && (
                                        <li className="flex gap-2">
                                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" aria-hidden="true" />
                                            <a href={`tel:${campus.phone.replace(/\s/g, '')}`} className="hover:text-primary">
                                                {campus.phone}
                                            </a>
                                        </li>
                                    )}
                                    {campus.email && (
                                        <li className="flex gap-2">
                                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" aria-hidden="true" />
                                            <a href={`mailto:${campus.email}`} className="break-all hover:text-primary">
                                                {campus.email}
                                            </a>
                                        </li>
                                    )}
                                    {campus.hours && (
                                        <li className="flex gap-2">
                                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" aria-hidden="true" /> {campus.hours}
                                        </li>
                                    )}
                                </ul>
                                {(campus.mapUrl || campus.address) && (
                                    <a
                                        href={campus.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${campus.name}, ${campus.address}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                                    >
                                        <Navigation className="h-4 w-4" aria-hidden="true" /> {t(site, 'getDirections')}
                                    </a>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </Container>
        </Section>
    );
}
