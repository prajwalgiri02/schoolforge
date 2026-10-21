import { ButtonLink, Container, Media, Section, SectionHeading, limitItems } from '../../runtime/ui';
import { Icon } from '../../runtime/icons';
import type { SectionProps } from '../../runtime/types';

type FacilitiesProps = SectionProps<{ link?: { label: string; href: string } | false }>;

export default function Facilities({ section, site }: FacilitiesProps) {
    const variant = section.variant ?? 'icons';
    const facilities = limitItems(site.content.facilities, section.limit);

    if (facilities.length === 0) {
        return null;
    }

    const isPreview = typeof section.limit === 'number' && (site.content.facilities?.length ?? 0) > section.limit;
    const link = section.link === false ? null : (section.link ?? (isPreview && site.pages.some((p) => p.slug === '/facilities') ? { label: 'View all facilities', href: '/facilities' } : null));
    const heading = (
        <SectionHeading
            eyebrow={section.eyebrow ?? 'Campus & Facilities'}
            title={section.title ?? 'Spaces designed for learning'}
            subtitle={section.subtitle ?? 'Modern, safe and inspiring environments where every learner can thrive.'}
        />
    );
    const footer = link && (
        <div className="mt-12 text-center">
            <ButtonLink href={link.href} variant="outline">
                {link.label}
            </ButtonLink>
        </div>
    );

    if (variant === 'cards') {
        return (
            <Section>
                <Container>
                    {heading}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {facilities.map((facility) => (
                            <article key={facility.name} className="group relative aspect-[4/3] overflow-hidden rounded-card">
                                <Media sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" src={facility.image} alt={facility.name} icon={facility.icon} className="transition duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" aria-hidden="true" />
                                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                                    <h3 className="school-heading text-xl">{facility.name}</h3>
                                    {facility.description && <p className="mt-2 text-sm leading-relaxed text-white/80">{facility.description}</p>}
                                </div>
                            </article>
                        ))}
                    </div>
                    {footer}
                </Container>
            </Section>
        );
    }

    return (
        <Section>
            <Container>
                {heading}
                <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {facilities.map((facility) => (
                        <article key={facility.name} className="flex gap-5">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
                                <Icon name={facility.icon} className="h-7 w-7" />
                            </span>
                            <div>
                                <h3 className="school-heading text-lg">{facility.name}</h3>
                                {facility.description && <p className="mt-2 leading-relaxed text-muted-foreground">{facility.description}</p>}
                            </div>
                        </article>
                    ))}
                </div>
                {footer}
            </Container>
        </Section>
    );
}
