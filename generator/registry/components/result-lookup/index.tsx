'use client';

import { Printer, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { listExams, lookupResult, type ExamSummary, type ResultSheet } from '../../adapter';
import { Container, Section, SectionHeading } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

const fieldClass = 'w-full rounded-[min(var(--radius-button),0.75rem)] border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function ResultLookup({ section, site }: SectionProps) {
    const [exams, setExams] = useState<ExamSummary[] | null>(null);
    const [sheet, setSheet] = useState<ResultSheet | null | 'missing'>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        listExams().then(setExams);
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setSheet((await lookupResult(Number(data.get('exam')), String(data.get('symbol') ?? '').trim(), String(data.get('dob') ?? '').trim())) ?? 'missing');
        setBusy(false);
    }

    return (
        <Section>
            <Container className="max-w-3xl">
                <div className="print:hidden">
                    <SectionHeading eyebrow={section.eyebrow ?? t(site, 'results')} title={section.title ?? t(site, 'resultsTitle')} subtitle={section.subtitle ?? t(site, 'resultsSubtitle')} />
                    {exams !== null && exams.length === 0 ? (
                        <p className="text-center text-muted-foreground">{t(site, 'noResultsPublished')}</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="school-card grid gap-4 p-6 sm:grid-cols-2">
                            <label className="block sm:col-span-2">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'exam')}</span>
                                <select name="exam" required className={fieldClass}>
                                    {(exams ?? []).map((exam) => (
                                        <option key={exam.id} value={exam.id}>
                                            {exam.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'symbolNumber')}</span>
                                <input name="symbol" required className={fieldClass} />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium">{t(site, 'dateOfBirthAsAdmitCard')}</span>
                                <input name="dob" placeholder="2068-05-12" className={fieldClass} />
                            </label>
                            <button type="submit" disabled={busy || exams === null} className="school-button inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
                                <Search className="h-4 w-4" aria-hidden="true" /> {t(site, 'viewResult')}
                            </button>
                        </form>
                    )}
                </div>
                <div aria-live="polite" className="mt-8">
                    {sheet === 'missing' && <p className="text-center text-red-600">{t(site, 'resultNotFound')}</p>}
                    {sheet && sheet !== 'missing' && (
                        <article className="school-card p-6 md:p-8 print:border-0 print:shadow-none">
                            <header className="border-b border-border pb-4 text-center">
                                <p className="school-heading text-2xl">{site.school.name}</p>
                                <p className="mt-1 font-semibold text-primary">{sheet.exam}</p>
                            </header>
                            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="inline text-muted-foreground">{t(site, 'studentName')}: </dt>
                                    <dd className="inline font-semibold">{sheet.studentName}</dd>
                                </div>
                                <div>
                                    <dt className="inline text-muted-foreground">{t(site, 'symbolNumber')}: </dt>
                                    <dd className="inline font-semibold">{sheet.symbolNumber}</dd>
                                </div>
                                {sheet.class && (
                                    <div>
                                        <dt className="inline text-muted-foreground">{t(site, 'class')}: </dt>
                                        <dd className="inline font-semibold">{sheet.class}</dd>
                                    </div>
                                )}
                            </dl>
                            {sheet.subjects.length > 0 && (
                                <table className="mt-6 w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-muted-foreground">
                                            <th className="py-2 font-medium">{t(site, 'subject')}</th>
                                            <th className="py-2 text-right font-medium">{t(site, 'gradeOrMarks')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sheet.subjects.map((item) => (
                                            <tr key={item.subject} className="border-b border-border/60">
                                                <td className="py-2">{item.subject}</td>
                                                <td className="py-2 text-right font-semibold">{item.grade}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                <p className="text-lg">
                                    {sheet.gpa && (
                                        <>
                                            GPA <strong>{sheet.gpa}</strong>
                                        </>
                                    )}
                                    {sheet.gpa && sheet.result && ' · '}
                                    {sheet.result && <strong className="text-primary">{sheet.result}</strong>}
                                </p>
                                <button type="button" onClick={() => window.print()} className="school-button inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary print:hidden">
                                    <Printer className="h-4 w-4" aria-hidden="true" /> {t(site, 'print')}
                                </button>
                            </div>
                            <p className="mt-6 text-xs text-muted-foreground">{t(site, 'resultDisclaimer')}</p>
                        </article>
                    )}
                </div>
            </Container>
        </Section>
    );
}
