'use client';

import { BellRing, CheckCircle2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { subscribe } from '../../adapter';
import { Container, Section } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

const fieldClass = 'w-full rounded-[min(var(--radius-button),0.75rem)] border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-3 text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus:border-primary-foreground focus:ring-2 focus:ring-primary-foreground/30';

export default function Newsletter({ section, site }: SectionProps) {
    const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done'; errors: Record<string, string> }>({ status: 'idle', errors: {} });

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setState({ status: 'sending', errors: {} });
        const result = await subscribe({ email: String(data.get('email') ?? '').trim(), locale: site.i18n?.locale });
        setState(result.ok ? { status: 'done', errors: {} } : { status: 'idle', errors: result.errors ?? { email: t(site, 'formFailed') } });
    }

    return (
        <Section tone="primary">
            <Container className="grid items-center gap-8 lg:grid-cols-2">
                <div>
                    <BellRing className="h-8 w-8 text-accent" aria-hidden="true" />
                    <h2 className="school-heading mt-4 text-3xl md:text-4xl">{section.title ?? t(site, 'newsletterTitle')}</h2>
                    <p className="mt-3 text-lg text-primary-foreground/80">{section.subtitle ?? t(site, 'newsletterSubtitle')}</p>
                </div>
                {state.status === 'done' ? (
                    <p role="status" className="flex items-center gap-3 text-lg font-medium">
                        <CheckCircle2 className="h-6 w-6 text-accent" aria-hidden="true" /> {t(site, 'subscribed')}
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <label>
                            <span className="sr-only">{t(site, 'email')}</span>
                            <input name="email" type="email" autoComplete="email" placeholder={t(site, 'email')} className={fieldClass} />
                            {state.errors.email && <span className="mt-1 block text-sm text-accent">{state.errors.email}</span>}
                        </label>
                        <button type="submit" disabled={state.status === 'sending'} className="school-button h-fit bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:opacity-60">
                            {t(site, 'subscribe')}
                        </button>
                    </form>
                )}
            </Container>
        </Section>
    );
}
