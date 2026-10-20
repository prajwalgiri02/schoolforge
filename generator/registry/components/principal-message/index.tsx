import { Quote } from 'lucide-react';
import { Avatar, Container, Media, Section } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

type PrincipalProps = SectionProps<{ mode?: 'summary' | 'full' }>;

export default function PrincipalMessage({ section, site }: PrincipalProps) {
    const variant = section.variant ?? 'split';
    const principal = site.school.principal;

    if (!principal?.message?.length) {
        return null;
    }

    const message = section.mode === 'summary' ? principal.message.slice(0, 1) : principal.message;
    const heading = section.title ?? "Principal's Message";

    if (variant === 'quote') {
        return (
            <Section tone="primary">
                <Container className="max-w-4xl text-center">
                    <Quote className="mx-auto h-12 w-12 text-accent" aria-hidden="true" />
                    <p className="school-eyebrow mt-6 text-accent">{heading}</p>
                    <blockquote className="school-heading mt-6 text-2xl leading-snug md:text-3xl">“{message[0]}”</blockquote>
                    {message.slice(1).map((paragraph) => (
                        <p key={paragraph.slice(0, 32)} className="mx-auto mt-5 max-w-3xl leading-relaxed opacity-85">
                            {paragraph}
                        </p>
                    ))}
                    <div className="mt-10 flex items-center justify-center gap-4">
                        <Avatar src={principal.photo} name={principal.name} className="h-14 w-14 text-lg" />
                        <div className="text-left">
                            <p className="font-semibold">{principal.name}</p>
                            {principal.title && <p className="text-sm opacity-75">{principal.title}</p>}
                        </div>
                    </div>
                </Container>
            </Section>
        );
    }

    return (
        <Section tone="muted">
            <Container className="grid items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
                <div className="mx-auto w-full max-w-sm">
                    <div className="aspect-[4/5] overflow-hidden rounded-card shadow-card">
                        <Media src={principal.photo} alt={principal.name} label={principal.name} icon="users" />
                    </div>
                </div>
                <div>
                    <p className="school-eyebrow mb-3 text-accent-strong">{section.eyebrow ?? 'From the desk of the principal'}</p>
                    <h2 className="school-heading text-3xl md:text-4xl">{heading}</h2>
                    <span className="school-rule mt-5" aria-hidden="true" />
                    <div className="school-prose mt-6 text-lg leading-relaxed text-foreground/85">
                        {message.map((paragraph) => (
                            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                        ))}
                    </div>
                    <div className="mt-8 border-l-4 border-accent pl-4">
                        <p className="school-heading text-xl text-primary">{principal.name}</p>
                        {principal.title && <p className="text-sm text-muted-foreground">{principal.title}</p>}
                    </div>
                </div>
            </Container>
        </Section>
    );
}
