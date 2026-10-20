import { Eye, Heart, Target } from 'lucide-react';
import { Container, Section, SectionHeading } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

export default function MissionVision({ section, site }: SectionProps) {
    const about = site.school.about ?? {};
    const values = about.values ?? [];
    const cards = [
        about.mission && { icon: Target, title: 'Our Mission', text: about.mission },
        about.vision && { icon: Eye, title: 'Our Vision', text: about.vision },
        values.length > 0 && { icon: Heart, title: 'Our Values', text: values.map((value) => value.title).join(' · ') },
    ].filter(Boolean) as { icon: typeof Target; title: string; text: string }[];

    if (cards.length === 0) {
        return null;
    }

    return (
        <Section tone="muted">
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? 'What guides us'} title={section.title ?? 'Mission, Vision & Values'} subtitle={section.subtitle} />
                <div className="grid gap-6 md:grid-cols-3">
                    {cards.map((card) => (
                        <article key={card.title} className="school-card p-8">
                            <span className="flex h-12 w-12 items-center justify-center rounded-button bg-primary text-primary-foreground">
                                <card.icon className="h-6 w-6" aria-hidden="true" />
                            </span>
                            <h3 className="school-heading mt-6 text-xl">{card.title}</h3>
                            <p className="mt-3 leading-relaxed text-muted-foreground">{card.text}</p>
                        </article>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
