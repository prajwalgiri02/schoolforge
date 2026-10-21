'use client';

import { Lock, Wallet } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { paymentGateways, startPayment, type PaymentGateway } from '../../adapter';
import { Container, Section, SectionHeading, cn } from '../../runtime/ui';
import { localizeDigits, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

const fieldClass = 'w-full rounded-[min(var(--radius-button),0.75rem)] border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const gatewayColors: Record<string, string> = { esewa: 'peer-checked:border-[#60bb46] peer-checked:ring-[#60bb46]/30', khalti: 'peer-checked:border-[#5c2d91] peer-checked:ring-[#5c2d91]/30' };

export default function FeePayment({ section, site }: SectionProps) {
    const fees = site.content.fees ?? [];
    const [gateways, setGateways] = useState<PaymentGateway[] | null>(null);
    const [fee, setFee] = useState(fees.length > 0 ? '0' : 'other');
    const [state, setState] = useState<{ busy: boolean; errors: Record<string, string>; message?: string }>({ busy: false, errors: {} });
    const chosen = fee === 'other' ? null : fees[Number(fee)];

    useEffect(() => {
        paymentGateways().then(setGateways);
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
        setState({ busy: true, errors: {} });

        const result = await startPayment({
            gateway: data.gateway ?? '',
            purpose: chosen?.name ?? data.purpose ?? '',
            amount: chosen?.amount !== undefined ? String(chosen.amount) : (data.amount ?? ''),
            student_name: data.student_name ?? '',
            class: data.class,
            payer_name: data.payer_name ?? '',
            email: data.email ?? '',
            phone: data.phone,
        });

        // On success the browser is already on its way to the gateway.
        if (!result.ok) {
            setState({ busy: false, errors: result.errors ?? {}, message: result.message ?? (result.errors && Object.keys(result.errors).length > 0 ? undefined : t(site, 'formFailed')) });
        }
    }

    const error = (field: string) => state.errors[field] && <span className="mt-1 block text-sm text-red-600">{state.errors[field]}</span>;

    return (
        <Section>
            <Container className="max-w-3xl">
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'fees')} title={section.title ?? t(site, 'payFeesTitle')} subtitle={section.subtitle ?? t(site, 'payFeesSubtitle')} />
                {gateways !== null && gateways.length === 0 ? (
                    <p className="text-center text-muted-foreground">{t(site, 'paymentsUnavailable')}</p>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="school-card grid gap-5 p-6 md:p-8 sm:grid-cols-2">
                        {fees.length > 0 && (
                            <label className="block sm:col-span-2">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'payingFor')}</span>
                                <select value={fee} onChange={(event) => setFee(event.target.value)} className={fieldClass}>
                                    {fees.map((item, index) => (
                                        <option key={item.name} value={index}>
                                            {item.name}
                                            {item.amount !== undefined && ` — NPR ${localizeDigits(site, Number(item.amount).toLocaleString('en-IN'))}`}
                                        </option>
                                    ))}
                                    <option value="other">{t(site, 'otherPayment')}</option>
                                </select>
                                {chosen?.description && <span className="mt-1 block text-sm text-muted-foreground">{chosen.description}</span>}
                            </label>
                        )}
                        {!chosen && (
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'paymentPurpose')}</span>
                                <input name="purpose" required className={fieldClass} />
                                {error('purpose')}
                            </label>
                        )}
                        {chosen?.amount === undefined && (
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'amountNpr')}</span>
                                <input name="amount" type="number" min="10" step="0.01" inputMode="decimal" required className={fieldClass} />
                                {error('amount')}
                            </label>
                        )}
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t(site, 'studentName')}</span>
                            <input name="student_name" required className={fieldClass} />
                            {error('student_name')}
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t(site, 'class')}</span>
                            <input name="class" className={fieldClass} />
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t(site, 'payerName')}</span>
                            <input name="payer_name" required autoComplete="name" className={fieldClass} />
                            {error('payer_name')}
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t(site, 'emailForReceipt')}</span>
                            <input name="email" type="email" required autoComplete="email" className={fieldClass} />
                            {error('email')}
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium">{t(site, 'phoneOptional')}</span>
                            <input name="phone" type="tel" autoComplete="tel" className={fieldClass} />
                        </label>
                        <fieldset className="sm:col-span-2">
                            <legend className="mb-2 text-sm font-medium">{t(site, 'payWith')}</legend>
                            <div className="flex flex-wrap gap-3">
                                {(gateways ?? []).map((gateway, index) => (
                                    <label key={gateway.id} className="cursor-pointer">
                                        <input type="radio" name="gateway" value={gateway.id} defaultChecked={index === 0} className="peer sr-only" />
                                        <span className={cn('flex items-center gap-2 rounded-card border-2 border-border px-5 py-3 font-semibold ring-4 ring-transparent transition', gatewayColors[gateway.id])}>{gateway.label}</span>
                                    </label>
                                ))}
                            </div>
                            {error('gateway')}
                        </fieldset>
                        <div className="sm:col-span-2">
                            <button type="submit" disabled={state.busy || gateways === null} className="school-button inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">
                                <Wallet className="h-4 w-4" aria-hidden="true" /> {state.busy ? t(site, 'redirectingToPayment') : t(site, 'continueToPayment')}
                            </button>
                            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Lock className="h-3.5 w-3.5" aria-hidden="true" /> {t(site, 'paymentSecurity')}
                            </p>
                            {state.message && (
                                <p role="alert" className="mt-3 text-sm text-red-600">
                                    {state.message}
                                </p>
                            )}
                        </div>
                    </form>
                )}
            </Container>
        </Section>
    );
}
