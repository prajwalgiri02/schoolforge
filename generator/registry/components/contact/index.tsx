'use client';

import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { submitContact, type ContactPayload } from '../../adapter';
import { Container, Section, SectionHeading, cn } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

type Status = { state: 'idle' | 'sending' | 'sent' | 'error'; errors: Record<string, string> };

const fieldClass = 'w-full rounded-[min(var(--radius-button),0.75rem)] border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function Contact({ section, site }: SectionProps) {
    const contact = site.school.contact ?? {};
    const [status, setStatus] = useState<Status>({ state: 'idle', errors: {} });

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries()) as unknown as ContactPayload;
        const errors: Record<string, string> = {};

        if (!data.name?.trim()) {
            errors.name = t(site, 'fieldRequired', { field: t(site, 'fullName') });
        }

        if (!/^\S+@\S+\.\S+$/.test(data.email?.trim() ?? '')) {
            errors.email = t(site, 'invalidEmail');
        }

        if (!data.message?.trim()) {
            errors.message = t(site, 'fieldRequired', { field: t(site, 'message') });
        }

        if (Object.keys(errors).length > 0) {
            setStatus({ state: 'error', errors });

            return;
        }

        setStatus({ state: 'sending', errors: {} });

        const result = await submitContact(data);

        if (result.ok) {
            form.reset();
            setStatus({ state: 'sent', errors: {} });
        } else {
            setStatus({ state: 'error', errors: result.errors ?? {} });
        }
    }

    const details = [
        contact.address && { icon: MapPin, label: t(site, 'visitUs'), value: contact.address },
        contact.phone?.length && { icon: Phone, label: t(site, 'callUs'), value: contact.phone.join(', '), href: `tel:${contact.phone[0].replace(/\s/g, '')}` },
        contact.email?.length && { icon: Mail, label: t(site, 'emailUs'), value: contact.email.join(', '), href: `mailto:${contact.email[0]}` },
        contact.hours && { icon: Clock, label: t(site, 'officeHours'), value: contact.hours },
    ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string }[];

    const error = (field: string) => status.errors[field] && <p className="mt-1 text-sm text-red-600">{status.errors[field]}</p>;

    return (
        <Section>
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'getInTouch')} title={section.title ?? t(site, 'contactTitle')} subtitle={section.subtitle} />
                <div className="grid gap-10 lg:grid-cols-[2fr_3fr]">
                    <div className="space-y-6">
                        {details.map((item) => (
                            <div key={item.label} className="flex gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
                                    <item.icon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="school-eyebrow text-muted-foreground">{item.label}</p>
                                    {item.href ? (
                                        <a href={item.href} className="mt-1 block font-medium hover:text-primary">
                                            {item.value}
                                        </a>
                                    ) : (
                                        <p className="mt-1 font-medium">{item.value}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {contact.mapEmbedUrl && (
                            <div className="aspect-[4/3] overflow-hidden rounded-card border border-border">
                                <iframe src={contact.mapEmbedUrl} title={t(site, 'mapOf', { school: site.school.name })} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="school-card space-y-5 p-6 md:p-8" noValidate>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'fullName')}</span>
                                <input name="name" required autoComplete="name" className={fieldClass} />
                                {error('name')}
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'email')}</span>
                                <input name="email" type="email" required autoComplete="email" className={fieldClass} />
                                {error('email')}
                            </label>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'phoneOptional')}</span>
                                <input name="phone" type="tel" autoComplete="tel" className={fieldClass} />
                                {error('phone')}
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'subject')}</span>
                                <select name="subject" className={fieldClass} defaultValue="Admissions enquiry">
                                    <option value="Admissions enquiry">{t(site, 'admissionsEnquiry')}</option>
                                    <option value="Campus visit">{t(site, 'campusVisit')}</option>
                                    <option value="General question">{t(site, 'generalQuestion')}</option>
                                    <option value="Careers">{t(site, 'careers')}</option>
                                </select>
                                {error('subject')}
                            </label>
                        </div>
                        {(site.content.campuses?.length ?? 0) > 1 && (
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'campus')}</span>
                                <select name="campus" className={fieldClass} defaultValue="">
                                    <option value="">{t(site, 'anyCampus')}</option>
                                    {site.content.campuses!.map((campus) => (
                                        <option key={campus.name} value={campus.name}>
                                            {campus.name}
                                        </option>
                                    ))}
                                </select>
                                {error('campus')}
                            </label>
                        )}
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t(site, 'message')}</span>
                            <textarea name="message" required rows={5} className={fieldClass} />
                            {error('message')}
                        </label>
                        <button
                            type="submit"
                            disabled={status.state === 'sending'}
                            className="school-button inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" aria-hidden="true" /> {status.state === 'sending' ? t(site, 'sending') : t(site, 'sendMessage')}
                        </button>
                        <p role="status" className={cn('text-sm', status.state === 'sent' ? 'text-green-700' : 'text-red-600')}>
                            {status.state === 'sent' && t(site, 'messageSent')}
                            {status.state === 'error' && Object.keys(status.errors).length === 0 && t(site, 'messageFailed')}
                        </p>
                    </form>
                </div>
            </Container>
        </Section>
    );
}
