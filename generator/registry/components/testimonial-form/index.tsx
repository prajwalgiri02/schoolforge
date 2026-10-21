import { SchoolForm } from '../../runtime/form';
import { Container, Section, SectionHeading } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function TestimonialForm({ section, site }: SectionProps) {
    return (
        <Section tone="muted">
            <Container className="max-w-2xl">
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'testimonials')} title={section.title ?? t(site, 'shareExperience')} subtitle={section.subtitle ?? t(site, 'shareExperienceSubtitle')} />
                <SchoolForm site={site} type="testimonial" />
            </Container>
        </Section>
    );
}
