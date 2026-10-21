import { CalendarDays, CircleCheck, Download } from 'lucide-react';
import { ButtonLink, Container, Section, SectionHeading } from '../../runtime/ui';
import { formatSiteDate, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function Admissions({ section, site }: SectionProps) {
    const admissions = site.content.admissions;

    if (!admissions) {
        return null;
    }

    const steps = admissions.steps ?? [];
    const requirements = admissions.requirements ?? [];
    const cta = admissions.cta ?? { label: t(site, 'enquireNow'), href: '/contact' };

    return (
        <Section>
            <Container>
                <SectionHeading
                    eyebrow={section.eyebrow ?? (admissions.open === false ? t(site, 'admissions') : t(site, 'admissionsOpen'))}
                    title={section.title ?? t(site, 'admissionsTitle')}
                    subtitle={section.subtitle ?? admissions.intro}
                />
                {admissions.deadline && (
                    <p className="mx-auto -mt-4 mb-12 flex w-fit items-center gap-2 rounded-full bg-accent/20 px-5 py-2 text-sm font-semibold text-accent-strong">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" /> {t(site, 'applicationsClose', { date: formatSiteDate(site, admissions.deadline, 'long') })}
                    </p>
                )}
                <div className="grid gap-12 lg:grid-cols-[3fr_2fr]">
                    {steps.length > 0 && (
                        <ol className="space-y-6">
                            {steps.map((step, index) => (
                                <li key={step.title} className="flex gap-5">
                                    <span className="school-heading flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground">
                                        {index + 1}
                                    </span>
                                    <div className="pt-1">
                                        <h3 className="school-heading text-lg">{step.title}</h3>
                                        {step.description && <p className="mt-1 leading-relaxed text-muted-foreground">{step.description}</p>}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                    <aside className="school-card h-fit p-8">
                        {requirements.length > 0 && (
                            <>
                                <h3 className="school-heading text-xl">{t(site, 'documentsRequired')}</h3>
                                <ul className="mt-5 space-y-3">
                                    {requirements.map((requirement) => (
                                        <li key={requirement} className="flex gap-3 text-foreground/85">
                                            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong" aria-hidden="true" /> {requirement}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        <div className="mt-8 flex flex-col gap-3">
                            <ButtonLink href={cta.href} size="lg">
                                {cta.label}
                            </ButtonLink>
                            {admissions.feeStructureUrl && (
                                <ButtonLink href={admissions.feeStructureUrl} variant="outline">
                                    <Download className="h-4 w-4" aria-hidden="true" /> {t(site, 'feeStructure')}
                                </ButtonLink>
                            )}
                        </div>
                    </aside>
                </div>
            </Container>
        </Section>
    );
}
