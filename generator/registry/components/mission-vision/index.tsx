import { Eye, Heart, Target } from 'lucide-react';
import { Container, Section, SectionHeading } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function MissionVision({ section, site }: SectionProps) {
    const about = site.school.about ?? {};
    const values = about.values ?? [];
    const cards = [
        about.mission && { icon: Target, title: t(site, 'ourMission'), text: about.mission },
        about.vision && { icon: Eye, title: t(site, 'ourVision'), text: about.vision },
        values.length > 0 && { icon: Heart, title: t(site, 'ourValues'), text: values.map((value) => value.title).join(' · ') },
    ].filter(Boolean) as { icon: typeof Target; title: string; text: string }[];

    if (cards.length === 0) {
        return null;
    }

    return (
        <Section tone="muted">
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'whatGuidesUs')} title={section.title ?? t(site, 'missionVisionValues')} subtitle={section.subtitle} />
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
