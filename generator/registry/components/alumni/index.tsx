'use client';

import { Quote, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { SchoolForm } from '../../runtime/form';
import { Container, Media, Section, SectionHeading } from '../../runtime/ui';
import { localizeDigits, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

type AlumniProps = SectionProps<{ form?: boolean }>;

export default function Alumni({ section, site }: AlumniProps) {
    const alumni = site.content.alumni ?? [];
    const [joining, setJoining] = useState(false);

    return (
        <Section>
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'alumni')} title={section.title ?? t(site, 'alumniTitle')} subtitle={section.subtitle} />
                {alumni.length > 0 && (
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {alumni.map((person) => (
                            <li key={`${person.name}-${person.batch}`} className="school-card flex flex-col p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
                                        <Media src={person.photo} alt={person.name} icon="users" sizes="64px" />
                                    </div>
                                    <div>
                                        <p className="school-heading text-lg">{person.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {[person.batch && t(site, 'batchOf', { year: localizeDigits(site, person.batch) }), person.role].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                </div>
                                {person.quote && (
                                    <blockquote className="mt-4 flex gap-2 text-foreground/80">
                                        <Quote className="h-4 w-4 shrink-0 text-accent-strong" aria-hidden="true" />
                                        <span>{person.quote}</span>
                                    </blockquote>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                {section.form !== false && (
                    <div className="mx-auto mt-12 max-w-2xl">
                        {joining ? (
                            <SchoolForm site={site} type="alumni" />
                        ) : (
                            <p className="text-center">
                                <button type="button" onClick={() => setJoining(true)} className="school-button inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
                                    <UserPlus className="h-4 w-4" aria-hidden="true" /> {t(site, 'joinAlumni')}
                                </button>
                            </p>
                        )}
                    </div>
                )}
            </Container>
        </Section>
    );
}
