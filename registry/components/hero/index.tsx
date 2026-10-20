import { ArrowRight } from 'lucide-react';
import { ButtonLink, Container, Media } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

type HeroProps = SectionProps<{ image?: string }>;

export default function Hero({ section, site }: HeroProps) {
    const variant = section.variant ?? 'overlay';
    const { school } = site;
    const hero = site.content.hero ?? {};
    const title = section.title ?? hero.title ?? school.tagline ?? school.name;
    const subtitle = section.subtitle ?? hero.subtitle ?? school.about?.summary;
    const eyebrow = section.eyebrow ?? [school.type, school.established && `Since ${school.established}`].filter(Boolean).join(' · ');
    const image = section.image ?? hero.image;
    const primary = hero.primaryCta;
    const secondary = hero.secondaryCta;

    if (variant === 'split') {
        return (
            <section className="relative overflow-hidden bg-background">
                <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
                <Container className="relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
                    <div>
                        {eyebrow && (
                            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">{eyebrow}</p>
                        )}
                        <h1 className="school-heading text-4xl text-foreground sm:text-5xl lg:text-6xl">{title}</h1>
                        {subtitle && <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{subtitle}</p>}
                        <div className="mt-9 flex flex-wrap gap-4">
                            {primary && (
                                <ButtonLink href={primary.href} size="lg">
                                    {primary.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </ButtonLink>
                            )}
                            {secondary && (
                                <ButtonLink href={secondary.href} variant="outline" size="lg">
                                    {secondary.label}
                                </ButtonLink>
                            )}
                        </div>
                        {site.content.stats && site.content.stats.length > 0 && (
                            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
                                {site.content.stats.slice(0, 3).map((stat) => (
                                    <div key={stat.label}>
                                        <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                                        <dd className="school-heading mt-1 text-2xl text-primary">{stat.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>
                    <div className="relative">
                        <div className="absolute -bottom-5 -left-5 h-full w-full rounded-card bg-accent/30" aria-hidden="true" />
                        <div className="relative aspect-[4/5] overflow-hidden rounded-card shadow-card sm:aspect-[5/4] lg:aspect-[4/5]">
                            <Media src={image} alt={school.name} label={school.name} icon="school" />
                        </div>
                    </div>
                </Container>
            </section>
        );
    }

    if (variant === 'centered') {
        return (
            <section className="relative overflow-hidden bg-muted">
                <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent/40 blur-2xl" aria-hidden="true" />
                <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-primary/25 blur-2xl" aria-hidden="true" />
                <Container className="relative flex flex-col items-center py-20 text-center md:py-28">
                    {eyebrow && <p className="school-eyebrow mb-5 text-accent-strong">{eyebrow}</p>}
                    <h1 className="school-heading max-w-4xl text-4xl text-foreground sm:text-5xl lg:text-6xl">{title}</h1>
                    {subtitle && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{subtitle}</p>}
                    <div className="mt-9 flex flex-wrap justify-center gap-4">
                        {primary && (
                            <ButtonLink href={primary.href} size="lg">
                                {primary.label}
                            </ButtonLink>
                        )}
                        {secondary && (
                            <ButtonLink href={secondary.href} variant="outline" size="lg">
                                {secondary.label}
                            </ButtonLink>
                        )}
                    </div>
                    <div className="mt-14 aspect-[21/9] w-full max-w-5xl overflow-hidden rounded-card shadow-card">
                        <Media src={image} alt={school.name} label={school.name} icon="school" />
                    </div>
                </Container>
            </section>
        );
    }

    return (
        <section className="relative isolate flex min-h-[78vh] items-center overflow-hidden text-white">
            <div className="absolute inset-0 -z-20">
                <Media src={image} alt="" icon="none" />
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/20" aria-hidden="true" />
            <Container className="py-24">
                <div className="max-w-3xl">
                    {eyebrow && <p className="school-eyebrow mb-5 text-accent">{eyebrow}</p>}
                    <h1 className="school-heading text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
                    {subtitle && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">{subtitle}</p>}
                    <div className="mt-10 flex flex-wrap gap-4">
                        {primary && (
                            <ButtonLink href={primary.href} variant="accent" size="lg">
                                {primary.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </ButtonLink>
                        )}
                        {secondary && (
                            <ButtonLink href={secondary.href} variant="outlineLight" size="lg">
                                {secondary.label}
                            </ButtonLink>
                        )}
                    </div>
                </div>
            </Container>
        </section>
    );
}
