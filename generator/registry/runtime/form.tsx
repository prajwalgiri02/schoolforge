'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { submitForm, supportsStatusLookup } from '../adapter';
import { forms, localized, validateFields, type FormField, type FormType } from './forms';
import { formatSiteDate, localizeDigits, t } from './i18n';
import type { SiteData } from './types';
import { cn } from './ui';

const fieldClass = 'w-full rounded-[min(var(--radius-button),0.75rem)] border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

type Status = { state: 'editing' | 'sending' | 'sent' | 'failed'; reference?: string };

/**
 * Renders a form from runtime/forms.json, one step at a time, checking each step
 * before moving on and showing a summary before submitting. The adapter sends
 * it to the site's backend (Laravel) or API route (Next.js).
 */
export function SchoolForm({ site, type, hidden = {}, className }: { site: SiteData; type: FormType; hidden?: Record<string, string>; className?: string }) {
    const definition = forms[type];
    const steps = definition.steps;
    const [step, setStep] = useState(0);
    const [values, setValues] = useState<Record<string, string>>(hidden);
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<Status>({ state: 'editing' });
    const id = useId();
    const formRef = useRef<HTMLFormElement>(null);
    const shownStep = useRef(step);
    const current = steps[step];

    // Bring the top of the form into view when moving between steps.
    useEffect(() => {
        if (shownStep.current !== step) {
            shownStep.current = step;
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [step]);
    const isLast = step === steps.length - 1;
    const visible = (fields: FormField[]) => fields.filter((field) => field.type !== 'hidden');

    if (status.state === 'sent') {
        const moderated = type === 'alumni' || type === 'testimonial';

        return (
            <div className={cn('school-card p-8 text-center', className)} role="status">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
                <p className="school-heading mt-4 text-2xl">{t(site, moderated ? 'submissionReceived' : 'applicationReceived')}</p>
                {moderated ? (
                    <p className="mt-3 text-muted-foreground">{t(site, 'reviewedBeforePublishing')}</p>
                ) : (
                    status.reference && <p className="mt-3 text-muted-foreground">{t(site, supportsStatusLookup ? 'yourReference' : 'yourReferenceToQuote', { reference: status.reference })}</p>
                )}
            </div>
        );
    }

    const checkStep = (index: number) => {
        const stepErrors = validateFields(site, steps[index].fields, values, files);
        setErrors(stepErrors);

        return Object.keys(stepErrors).length === 0;
    };

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!checkStep(step)) {
            return;
        }

        if (!isLast) {
            setStep(step + 1);

            return;
        }

        const allErrors = validateFields(site, steps.flatMap((item) => item.fields), values, files);

        if (Object.keys(allErrors).length > 0) {
            setErrors(allErrors);
            setStep(steps.findIndex((item) => item.fields.some((field) => allErrors[field.name])));

            return;
        }

        const data = new FormData();
        Object.entries(values).forEach(([name, value]) => data.append(name, value));
        Object.entries(files).forEach(([name, file]) => file && data.append(name, file));
        data.append('locale', site.i18n?.locale ?? 'en');
        setStatus({ state: 'sending' });

        const result = await submitForm(type, data);

        if (result.ok) {
            setStatus({ state: 'sent', reference: result.reference });

            return;
        }

        setStatus({ state: 'failed' });
        setErrors(result.errors ?? {});

        const failedStep = steps.findIndex((item) => item.fields.some((field) => result.errors?.[field.name]));

        if (failedStep >= 0) {
            setStep(failedStep);
        }
    }

    const update = (name: string, value: string) => {
        setValues({ ...values, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className={cn('school-card scroll-mt-28 p-6 md:p-8', className)} aria-labelledby={steps.length > 1 ? `${id}-step` : undefined}>
            {steps.length > 1 && (
                <div className="mb-8">
                    <ol className="flex gap-2" aria-hidden="true">
                        {steps.map((item, index) => (
                            <li key={index} className={cn('h-1.5 flex-1 rounded-full', index <= step ? 'bg-primary' : 'bg-muted')} />
                        ))}
                    </ol>
                    <p id={`${id}-step`} className="mt-4 text-sm font-medium text-muted-foreground">
                        {t(site, 'stepOf', { step: localizeDigits(site, step + 1), total: localizeDigits(site, steps.length) })}
                        {current.title && <span className="school-heading mt-1 block text-2xl text-foreground">{localized(site, current.title)}</span>}
                    </p>
                </div>
            )}

            {current.review && (
                <dl className="mb-6 divide-y divide-border rounded-card border border-border">
                    {steps
                        .filter((item) => !item.review)
                        .flatMap((item) => visible(item.fields))
                        .map((field) => {
                            const value = field.type === 'file' ? files[field.name]?.name : field.type === 'date' ? formatSiteDate(site, values[field.name], 'long') : field.options ? localized(site, field.options.find((option) => option.value === values[field.name])?.label) : values[field.name];

                            return (
                                <div key={field.name} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[14rem_1fr]">
                                    <dt className="text-muted-foreground">{localized(site, field.label)}</dt>
                                    <dd className={cn('font-medium', !value && 'text-muted-foreground')}>{value || t(site, 'notProvided')}</dd>
                                </div>
                            );
                        })}
                </dl>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
                {visible(current.fields).map((field) => (
                    <Field key={field.name} site={site} field={field} value={values[field.name] ?? ''} file={files[field.name] ?? null} error={errors[field.name]} onChange={(value) => update(field.name, value)} onFile={(file) => (setFiles({ ...files, [field.name]: file }), setErrors({ ...errors, [field.name]: '' }))} />
                ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                {step > 0 ? (
                    <button type="button" onClick={() => (setErrors({}), setStep(step - 1))} className="school-button inline-flex items-center gap-2 border border-border px-5 py-3 text-sm font-semibold hover:border-primary hover:text-primary">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t(site, 'back')}
                    </button>
                ) : (
                    <span />
                )}
                <button type="submit" disabled={status.state === 'sending'} className="school-button inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">
                    {isLast ? (
                        <>
                            <Send className="h-4 w-4" aria-hidden="true" /> {status.state === 'sending' ? t(site, 'submitting') : t(site, 'submit')}
                        </>
                    ) : (
                        <>
                            {t(site, 'next')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </>
                    )}
                </button>
            </div>
            {status.state === 'failed' && Object.values(errors).every((error) => !error) && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                    {t(site, 'formFailed')}
                </p>
            )}
        </form>
    );
}

function Field({ site, field, value, file, error, onChange, onFile }: { site: SiteData; field: FormField; value: string; file: File | null; error?: string; onChange: (value: string) => void; onFile: (file: File | null) => void }) {
    const id = useId();
    const label = (
        <>
            {localized(site, field.label)}
            {field.required && field.type !== 'checkbox' && <span className="text-red-600"> *</span>}
        </>
    );
    const describedBy = error ? `${id}-error` : undefined;
    const message = error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
            {error}
        </p>
    );
    const wide = !field.half || field.type === 'textarea' || field.type === 'checkbox';

    if (field.type === 'checkbox') {
        return (
            <div className="sm:col-span-2">
                <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" checked={value === '1'} onChange={(event) => onChange(event.target.checked ? '1' : '')} aria-invalid={Boolean(error)} aria-describedby={describedBy} className="mt-0.5 h-4 w-4 rounded border-border" />
                    <span>{label}</span>
                </label>
                {message}
            </div>
        );
    }

    return (
        <div className={cn(wide && 'sm:col-span-2')}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
                {label}
            </label>
            {field.type === 'textarea' ? (
                <textarea id={id} rows={4} value={value} maxLength={field.max} placeholder={localized(site, field.placeholder)} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={fieldClass} />
            ) : field.type === 'select' ? (
                <select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={fieldClass}>
                    <option value="">—</option>
                    {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {localized(site, option.label)}
                        </option>
                    ))}
                </select>
            ) : field.type === 'file' ? (
                <>
                    <input
                        id={id}
                        type="file"
                        accept={field.accept?.map((extension) => `.${extension}`).join(',')}
                        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className={cn(fieldClass, 'file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-primary')}
                    />
                    {file && <p className="mt-1 text-xs text-muted-foreground">{file.name}</p>}
                </>
            ) : (
                <input id={id} type={field.type} value={value} maxLength={field.max} placeholder={localized(site, field.placeholder)} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={fieldClass} autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : undefined} />
            )}
            {message}
        </div>
    );
}
