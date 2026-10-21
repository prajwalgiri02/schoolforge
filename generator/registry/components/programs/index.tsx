import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink, Container, Media, Section, SectionHeading, limitItems } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

type ProgramsProps = SectionProps<{ link?: { label: string; href: string } | false }>;

export default function Programs({ section, site }: ProgramsProps) {
    const variant = section.variant ?? 'cards';
    const programs = limitItems(site.content.programs, section.limit);

    if (programs.length === 0) {
        return null;
    }

    const isPreview = typeof section.limit === 'number' && (site.content.programs?.length ?? 0) > section.limit;
    const link = section.link === false ? null : (section.link ?? (isPreview && site.pages.some((p) => p.slug === '/academics') ? { label: 'Explore all programs', href: '/academics' } : null));
    const heading = (
        <SectionHeading
            eyebrow={section.eyebrow ?? 'Academics'}
            title={section.title ?? 'Programs that shape futures'}
            subtitle={section.subtitle ?? 'A balanced curriculum that pairs academic rigour with creativity, character and care.'}
        />
    );

    if (variant === 'list') {
        return (
            <Section>
                <Container className="max-w-5xl">
                    {heading}
                    <div className="divide-y divide-border border-y border-border">
                        {programs.map((program, index) => (
                            <article key={program.name} className="grid gap-4 py-8 md:grid-cols-[6rem_1fr_1fr] md:gap-8">
                                <span className="school-heading text-4xl text-accent-strong">{String(index + 1).padStart(2, '0')}</span>
                                <div>
                                    {program.level && <p className="school-eyebrow text-muted-foreground">{program.level}</p>}
                                    <h3 className="school-heading mt-1 text-2xl">{program.name}</h3>
                                </div>
                                <div>
                                    {program.description && <p className="leading-relaxed text-muted-foreground">{program.description}</p>}
                                    {program.highlights && program.highlights.length > 0 && (
                                        <ul className="mt-4 flex flex-wrap gap-2">
                                            {program.highlights.map((highlight) => (
                                                <li key={highlight} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                    {link && (
                        <div className="mt-10 text-center">
                            <ButtonLink href={link.href} variant="outline">
                                {link.label}
                            </ButtonLink>
                        </div>
                    )}
                </Container>
            </Section>
        );
    }

    return (
        <Section tone="muted">
            <Container>
                {heading}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {programs.map((program) => (
                        <article key={program.name} className="school-card group flex flex-col overflow-hidden">
                            <div className="aspect-[16/10] overflow-hidden">
                                <Media sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" src={program.image} alt={program.name} label={program.level} icon="book" className="transition duration-500 group-hover:scale-105" />
                            </div>
                            <div className="flex flex-1 flex-col p-6">
                                {program.level && <p className="school-eyebrow text-accent-strong">{program.level}</p>}
                                <h3 className="school-heading mt-2 text-xl">{program.name}</h3>
                                {program.description && <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{program.description}</p>}
                                {program.highlights && program.highlights.length > 0 && (
                                    <ul className="mt-5 space-y-2 text-sm">
                                        {program.highlights.slice(0, 4).map((highlight) => (
                                            <li key={highlight} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-accent-strong" aria-hidden="true" /> {highlight}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
                {link && (
                    <div className="mt-12 text-center">
                        <ButtonLink href={link.href} variant="primary">
                            {link.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </ButtonLink>
                    </div>
                )}
            </Container>
        </Section>
    );
}
