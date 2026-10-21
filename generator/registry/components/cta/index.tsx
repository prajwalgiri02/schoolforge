import { ButtonLink, Container } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { LinkItem, SectionProps } from '../../runtime/types';

type CtaProps = SectionProps<{ primary?: LinkItem; secondary?: LinkItem }>;

export default function Cta({ section, site }: CtaProps) {
    const variant = section.variant ?? 'banner';
    const title = section.title ?? t(site, 'ctaTitle', { school: site.school.shortName ?? site.school.name });
    const subtitle = section.subtitle ?? site.content.admissions?.intro ?? t(site, 'ctaSubtitle');
    const primary = section.primary ?? site.content.admissions?.cta ?? { label: t(site, 'applyForAdmission'), href: '/admissions' };
    const secondary = section.secondary ?? { label: t(site, 'bookCampusVisit'), href: '/contact' };

    if (variant === 'card') {
        return (
            <section className="bg-background py-16 md:py-24">
                <Container>
                    <div className="relative overflow-hidden rounded-card bg-primary px-6 py-14 text-center text-primary-foreground md:px-16">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-2xl" aria-hidden="true" />
                        <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                        <h2 className="school-heading relative mx-auto max-w-3xl text-3xl md:text-4xl">{title}</h2>
                        <p className="relative mx-auto mt-4 max-w-2xl text-lg opacity-85">{subtitle}</p>
                        <div className="relative mt-8 flex flex-wrap justify-center gap-4">
                            <ButtonLink href={primary.href} variant="accent" size="lg">
                                {primary.label}
                            </ButtonLink>
                            <ButtonLink href={secondary.href} variant="outlineLight" size="lg">
                                {secondary.label}
                            </ButtonLink>
                        </div>
                    </div>
                </Container>
            </section>
        );
    }

    return (
        <section className="bg-secondary text-secondary-foreground">
            <Container className="flex flex-col items-start justify-between gap-8 py-14 md:flex-row md:items-center">
                <div className="max-w-2xl">
                    <h2 className="school-heading text-3xl">{title}</h2>
                    <p className="mt-3 text-lg opacity-85">{subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <ButtonLink href={primary.href} variant="accent" size="lg">
                        {primary.label}
                    </ButtonLink>
                    <ButtonLink href={secondary.href} variant="outlineLight" size="lg">
                        {secondary.label}
                    </ButtonLink>
                </div>
            </Container>
        </section>
    );
}
