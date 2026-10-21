import { SchoolForm } from '../../runtime/form';
import { Container, Section, SectionHeading } from '../../runtime/ui';
import { formatSiteDate, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function AdmissionForm({ section, site }: SectionProps) {
    const admissions = site.content.admissions;

    if (admissions?.open === false) {
        return null;
    }

    return (
        <Section id="apply">
            <Container className="max-w-3xl">
                <SectionHeading
                    eyebrow={section.eyebrow ?? t(site, 'applyOnline')}
                    title={section.title ?? t(site, 'admissionFormTitle')}
                    subtitle={section.subtitle ?? (admissions?.deadline ? t(site, 'applicationsClose', { date: formatSiteDate(site, admissions.deadline, 'long') }) : undefined)}
                />
                <SchoolForm site={site} type="admission" />
            </Container>
        </Section>
    );
}
