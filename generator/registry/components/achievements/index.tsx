import { Trophy } from 'lucide-react';
import { Container, Section, SectionHeading, limitItems } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function Achievements({ section, site }: SectionProps) {
    const variant = section.variant ?? 'grid';
    const achievements = limitItems(site.content.achievements, section.limit);

    if (achievements.length === 0) {
        return null;
    }

    const heading = (
        <SectionHeading
            eyebrow={section.eyebrow ?? t(site, 'achievements')}
            title={section.title ?? t(site, 'achievementsTitle')}
            subtitle={section.subtitle}
        />
    );

    if (variant === 'timeline') {
        return (
            <Section>
                <Container className="max-w-3xl">
                    {heading}
                    <ol className="relative border-l-2 border-border pl-8">
                        {achievements.map((item) => (
                            <li key={`${item.year}-${item.title}`} className="relative pb-10 last:pb-0">
                                <span className="absolute -left-[2.6rem] flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground ring-4 ring-background">
                                    <Trophy className="h-4 w-4" aria-hidden="true" />
                                </span>
                                {item.year && <p className="school-eyebrow text-accent-strong">{item.year}</p>}
                                <h3 className="school-heading mt-1 text-xl">{item.title}</h3>
                                {item.description && <p className="mt-2 leading-relaxed text-muted-foreground">{item.description}</p>}
                            </li>
                        ))}
                    </ol>
                </Container>
            </Section>
        );
    }

    return (
        <Section>
            <Container>
                {heading}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {achievements.map((item) => (
                        <article key={`${item.year}-${item.title}`} className="school-card p-7">
                            <div className="flex items-center justify-between">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent-strong">
                                    <Trophy className="h-6 w-6" aria-hidden="true" />
                                </span>
                                {item.year && <span className="school-heading text-2xl text-primary/30">{item.year}</span>}
                            </div>
                            <h3 className="school-heading mt-5 text-lg">{item.title}</h3>
                            {item.description && <p className="mt-2 leading-relaxed text-muted-foreground">{item.description}</p>}
                        </article>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
