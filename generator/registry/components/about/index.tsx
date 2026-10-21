import { CircleCheck } from 'lucide-react';
import { ButtonLink, Container, Media, Section, cn } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

type AboutProps = SectionProps<{ mode?: 'summary' | 'full'; link?: { label: string; href: string } | false; image?: string }>;

export default function About({ section, site }: AboutProps) {
    const variant = section.variant ?? 'split';
    const mode = section.mode ?? 'summary';
    const { school } = site;
    const about = school.about ?? {};
    const paragraphs = mode === 'full' ? (about.body ?? []) : (about.body ?? []).slice(0, 1);
    const values = (about.values ?? []).slice(0, mode === 'full' ? undefined : 4);
    const link = section.link === false ? null : (section.link ?? (mode === 'summary' && site.pages.some((p) => p.slug === '/about') ? { label: t(site, 'discoverOurStory'), href: '/about' } : null));
    const image = section.image ?? about.image;

    if (!about.summary && paragraphs.length === 0) {
        return null;
    }

    const text = (
        <div>
            <p className="school-eyebrow mb-3 text-accent-strong">{section.eyebrow ?? t(site, 'aboutSchool', { school: school.shortName ?? school.name })}</p>
            <h2 className="school-heading text-3xl md:text-4xl">{section.title ?? school.tagline ?? t(site, 'welcomeTo', { school: school.name })}</h2>
            <span className="school-rule mt-5" aria-hidden="true" />
            {about.summary && <p className="mt-6 text-lg leading-relaxed text-foreground/90">{about.summary}</p>}
            <div className="school-prose mt-4 leading-relaxed text-muted-foreground">
                {paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
            </div>
            {values.length > 0 && (
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                    {values.map((value) => (
                        <li key={value.title} className="flex gap-3">
                            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong" aria-hidden="true" />
                            <span>
                                <span className="font-semibold">{value.title}</span>
                                {value.description && mode === 'full' && <span className="block text-sm text-muted-foreground">{value.description}</span>}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {link && (
                <ButtonLink href={link.href} variant="primary" className="mt-9">
                    {link.label}
                </ButtonLink>
            )}
        </div>
    );

    if (variant === 'stacked') {
        return (
            <Section>
                <Container className="max-w-4xl">
                    {text}
                    <div className="mt-12 aspect-[16/9] overflow-hidden rounded-card">
                        <Media src={image} alt={`${school.name} campus`} label={school.name} icon="building" />
                    </div>
                </Container>
            </Section>
        );
    }

    const imageFirst = variant === 'split-reverse';

    return (
        <Section>
            <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                <div className={cn('relative', imageFirst ? 'lg:order-2' : '')}>
                    <div className="aspect-[4/3] overflow-hidden rounded-card shadow-card">
                        <Media src={image} alt={`${school.name} campus`} label={school.name} icon="building" />
                    </div>
                    {school.established && (
                        <div className="absolute -bottom-6 right-6 rounded-card bg-accent px-6 py-4 text-accent-foreground shadow-card">
                            <p className="school-heading text-3xl">{new Date().getFullYear() - Number(school.established)}+</p>
                            <p className="text-xs font-semibold uppercase tracking-wider">{t(site, 'yearsOfExcellence')}</p>
                        </div>
                    )}
                </div>
                {text}
            </Container>
        </Section>
    );
}
