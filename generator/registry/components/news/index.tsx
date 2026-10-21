import { ArrowRight } from 'lucide-react';
import { ButtonLink, Container, Media, Section, SectionHeading, SmartLink, limitItems } from '../../runtime/ui';
import { formatSiteDate, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

type NewsProps = SectionProps<{ link?: { label: string; href: string } | false }>;

export default function News({ section, site }: NewsProps) {
    const variant = section.variant ?? 'cards';
    const sorted = [...(site.content.news ?? [])].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    const news = limitItems(sorted, section.limit);

    if (news.length === 0) {
        return null;
    }

    const hasArticle = (slug: string) => site.pages.some((p) => p.slug === `/news/${slug}`);
    const isPreview = typeof section.limit === 'number' && sorted.length > section.limit;
    const link = section.link === false ? null : (section.link ?? (isPreview && site.pages.some((p) => p.slug === '/news') ? { label: t(site, 'allNews'), href: '/news' } : null));
    const heading = <SectionHeading eyebrow={section.eyebrow ?? t(site, 'latestNews')} title={section.title ?? t(site, 'newsTitle')} subtitle={section.subtitle} />;
    const more = link && (
        <div className="mt-12 text-center">
            <ButtonLink href={link.href} variant="outline">
                {link.label}
            </ButtonLink>
        </div>
    );

    if (variant === 'list') {
        return (
            <Section>
                <Container className="max-w-4xl">
                    {heading}
                    <div className="divide-y divide-border">
                        {news.map((item) => (
                            <article key={item.slug} className="grid gap-2 py-7 sm:grid-cols-[9rem_1fr] sm:gap-8">
                                <time className="text-sm font-semibold text-accent-strong" dateTime={item.date}>
                                    {formatSiteDate(site, item.date)}
                                </time>
                                <div>
                                    <h3 className="school-heading text-xl">
                                        {hasArticle(item.slug) ? (
                                            <SmartLink href={`/news/${item.slug}`} className="hover:text-primary">
                                                {item.title}
                                            </SmartLink>
                                        ) : (
                                            item.title
                                        )}
                                    </h3>
                                    {item.excerpt && <p className="mt-2 leading-relaxed text-muted-foreground">{item.excerpt}</p>}
                                </div>
                            </article>
                        ))}
                    </div>
                    {more}
                </Container>
            </Section>
        );
    }

    return (
        <Section>
            <Container>
                {heading}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {news.map((item) => (
                        <article key={item.slug} className="school-card group flex flex-col overflow-hidden">
                            <div className="aspect-[16/10] overflow-hidden">
                                <Media sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" src={item.image} alt={item.title} icon="megaphone" className="transition duration-500 group-hover:scale-105" />
                            </div>
                            <div className="flex flex-1 flex-col p-6">
                                <time className="text-sm font-medium text-accent-strong" dateTime={item.date}>
                                    {formatSiteDate(site, item.date, 'long')}
                                </time>
                                <h3 className="school-heading mt-2 text-xl">{item.title}</h3>
                                {item.excerpt && <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{item.excerpt}</p>}
                                {hasArticle(item.slug) && (
                                    <SmartLink href={`/news/${item.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                                        {t(site, 'readMore')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                                    </SmartLink>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
                {more}
            </Container>
        </Section>
    );
}
