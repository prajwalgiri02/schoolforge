'use client';

import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { lookupApplication, supportsStatusLookup, type ApplicationStatus } from '../../adapter';
import { Container, Section, SectionHeading } from '../../runtime/ui';
import { formatSiteDate, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

const fieldClass = 'w-full rounded-[min(var(--radius-button),0.75rem)] border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function AdmissionStatus({ section, site }: SectionProps) {
    const [result, setResult] = useState<ApplicationStatus | null | 'missing'>(null);
    const [busy, setBusy] = useState(false);

    if (!supportsStatusLookup) {
        return null;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setResult((await lookupApplication(String(data.get('reference') ?? '').trim(), String(data.get('email') ?? '').trim())) ?? 'missing');
        setBusy(false);
    }

    return (
        <Section tone="muted">
            <Container className="max-w-2xl">
                <SectionHeading eyebrow={section.eyebrow} title={section.title ?? t(site, 'trackApplication')} subtitle={section.subtitle ?? t(site, 'trackApplicationSubtitle')} />
                <form onSubmit={handleSubmit} className="school-card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <label className="block">
                        <span className="mb-1.5 block text-sm font-medium">{t(site, 'referenceNumber')}</span>
                        <input name="reference" required placeholder="ADM-26-XXXXXX" className={`${fieldClass} uppercase`} />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-sm font-medium">{t(site, 'email')}</span>
                        <input name="email" type="email" required className={fieldClass} />
                    </label>
                    <button type="submit" disabled={busy} className="school-button inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                        <Search className="h-4 w-4" aria-hidden="true" /> {t(site, 'checkStatus')}
                    </button>
                </form>
                <div aria-live="polite" className="mt-6 text-center">
                    {result === 'missing' && <p className="text-red-600">{t(site, 'applicationNotFound')}</p>}
                    {result && result !== 'missing' && (
                        <div className="school-card p-6">
                            <p className="school-heading text-xl">
                                {t(site, 'applicationStatus', { reference: result.reference, status: t(site, `status_${result.status}` as Parameters<typeof t>[1]) })}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">{t(site, 'lastUpdated', { date: formatSiteDate(site, result.updatedAt.slice(0, 10), 'long') })}</p>
                        </div>
                    )}
                </div>
            </Container>
        </Section>
    );
}
