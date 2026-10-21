'use client';

import { Briefcase, CalendarDays, ChevronDown, MapPin } from 'lucide-react';
import { useState } from 'react';
import { SchoolForm } from '../../runtime/form';
import { Container, Section, SectionHeading, cn } from '../../runtime/ui';
import { formatSiteDate, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function Careers({ section, site }: SectionProps) {
    const jobs = site.content.jobs ?? [];
    const [open, setOpen] = useState<number | null>(null);
    const [applying, setApplying] = useState<number | null>(null);

    return (
        <Section>
            <Container className="max-w-4xl">
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'careers')} title={section.title ?? t(site, 'careersTitle')} subtitle={section.subtitle} />
                {jobs.length === 0 ? (
                    <p className="text-center text-muted-foreground">{t(site, 'noOpenings')}</p>
                ) : (
                    <ul className="space-y-4">
                        {jobs.map((job, index) => (
                            <li key={job.title} className="school-card overflow-hidden">
                                <button type="button" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} className="flex w-full items-start justify-between gap-4 p-6 text-left">
                                    <span>
                                        <span className="school-heading block text-xl">{job.title}</span>
                                        <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                                            {job.type && (
                                                <span className="flex items-center gap-1.5">
                                                    <Briefcase className="h-4 w-4 text-accent-strong" aria-hidden="true" /> {job.type}
                                                </span>
                                            )}
                                            {job.location && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-accent-strong" aria-hidden="true" /> {job.location}
                                                </span>
                                            )}
                                            {job.deadline && (
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarDays className="h-4 w-4 text-accent-strong" aria-hidden="true" /> {t(site, 'applyBy', { date: formatSiteDate(site, job.deadline, 'long') })}
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                    <ChevronDown className={cn('mt-1 h-5 w-5 shrink-0 transition', open === index && 'rotate-180')} aria-hidden="true" />
                                </button>
                                {open === index && (
                                    <div className="border-t border-border p-6">
                                        {job.description && <p className="whitespace-pre-line leading-relaxed text-foreground/85">{job.description}</p>}
                                        {job.requirements && job.requirements.length > 0 && (
                                            <>
                                                <h4 className="mt-5 font-semibold">{t(site, 'requirements')}</h4>
                                                <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground/85">
                                                    {job.requirements.map((requirement) => (
                                                        <li key={requirement}>{requirement}</li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                        {applying === index ? (
                                            <SchoolForm site={site} type="job" hidden={{ position: job.title }} className="mt-6 shadow-none" />
                                        ) : (
                                            <button type="button" onClick={() => setApplying(index)} className="school-button mt-6 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
                                                {t(site, 'applyForThisJob')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Container>
        </Section>
    );
}
