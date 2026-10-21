import { ChevronRight } from 'lucide-react';
import { Container, Media, SmartLink } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

type PageHeaderProps = SectionProps<{ image?: string }>;

export default function PageHeader({ section, site, page }: PageHeaderProps) {
    const variant = section.variant ?? 'band';
    const title = section.title ?? page.title;
    const subtitle = section.subtitle ?? page.description;
    const crumbs = (
        <nav aria-label={t(site, 'breadcrumb')} className="mb-4 flex items-center gap-1.5 text-sm opacity-80">
            <SmartLink href="/" className="hover:underline">
                {t(site, 'home')}
            </SmartLink>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-current="page">{page.navLabel ?? page.title}</span>
        </nav>
    );

    if (variant === 'image') {
        return (
            <section className="relative isolate overflow-hidden text-white">
                <div className="absolute inset-0 -z-20">
                    <Media src={section.image ?? site.content.hero?.image} alt="" icon="none" />
                </div>
                <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
                <Container className="py-20 md:py-28">
                    {crumbs}
                    <h1 className="school-heading text-4xl md:text-5xl">{title}</h1>
                    {subtitle && <p className="mt-4 max-w-2xl text-lg text-white/85">{subtitle}</p>}
                </Container>
            </section>
        );
    }

    if (variant === 'plain') {
        return (
            <section className="border-b border-border bg-background">
                <Container className="py-14 text-center md:py-20">
                    <p className="school-eyebrow text-accent-strong">{site.school.shortName ?? site.school.name}</p>
                    <h1 className="school-heading mt-3 text-4xl md:text-5xl">{title}</h1>
                    <span className="school-rule mx-auto mt-6" aria-hidden="true" />
                    {subtitle && <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
                </Container>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-2xl" aria-hidden="true" />
            <Container className="relative py-16 md:py-20">
                {crumbs}
                <h1 className="school-heading text-4xl md:text-5xl">{title}</h1>
                {subtitle && <p className="mt-4 max-w-2xl text-lg opacity-85">{subtitle}</p>}
            </Container>
        </section>
    );
}
