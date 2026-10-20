import { Container, Section, SectionHeading, cn } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

export default function Stats({ section, site }: SectionProps) {
    const variant = section.variant ?? 'band';
    const stats = site.content.stats ?? [];

    if (stats.length === 0) {
        return null;
    }

    if (variant === 'cards') {
        return (
            <Section tone="default" className="!py-12 md:!py-16">
                <Container>
                    <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
                    <dl className={cn('grid gap-5', stats.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3')}>
                        {stats.map((stat) => (
                            <div key={stat.label} className="school-card p-6 text-center md:p-8">
                                <dd className="school-heading text-4xl text-primary md:text-5xl">{stat.value}</dd>
                                <dt className="mt-3 text-sm font-medium text-muted-foreground">{stat.label}</dt>
                            </div>
                        ))}
                    </dl>
                </Container>
            </Section>
        );
    }

    return (
        <section className="bg-primary text-primary-foreground">
            <Container>
                <dl className={cn('grid divide-current/15 py-12', stats.length >= 4 ? 'grid-cols-2 lg:grid-cols-4 lg:divide-x' : 'grid-cols-1 sm:grid-cols-3 sm:divide-x')}>
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex flex-col items-center px-4 py-4 text-center">
                            <dd className="school-heading text-4xl text-accent md:text-5xl">{stat.value}</dd>
                            <dt className="mt-2 text-sm uppercase tracking-wider opacity-85">{stat.label}</dt>
                        </div>
                    ))}
                </dl>
            </Container>
        </section>
    );
}
