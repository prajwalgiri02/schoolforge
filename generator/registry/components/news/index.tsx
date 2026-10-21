'use client';

import { ArrowRight, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ButtonLink, Container, Media, Section, SectionHeading, SmartLink, cn, limitItems } from '../../runtime/ui';
import { formatSiteDate, localizeDigits, t } from '../../runtime/i18n';
import type { SectionProps, SiteData } from '../../runtime/types';

type NewsProps = SectionProps<{ link?: { label: string; href: string } | false; search?: boolean }>;

type NewsItem = NonNullable<SiteData['content']['news']>[number];

const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFKD');

function matches(item: NewsItem, query: string): boolean {
    const haystack = normalize([item.title, item.excerpt, item.category, ...(item.tags ?? []), ...(item.body ?? [])].filter(Boolean).join(' '));

    return normalize(query)
        .split(/\s+/)
        .filter(Boolean)
        .every((word) => haystack.includes(word));
}

export default function News({ section, site }: NewsProps) {
    const variant = section.variant ?? 'cards';
    const sorted = [...(site.content.news ?? [])].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [tag, setTag] = useState<string | null>(null);
    const categories = Array.from(new Set(sorted.map((item) => item.category).filter(Boolean))) as string[];
    const searchable = section.search !== false && !section.limit && sorted.length > 1;
    const filtered = sorted.filter((item) => (!category || item.category === category) && (!tag || item.tags?.includes(tag)) && (!query || matches(item, query)));
    const news = limitItems(searchable ? filtered : sorted, section.limit);

    // Article pages link to /news?tag=… and /news?category=…
    useEffect(() => {
        if (!searchable) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        setTag(params.get('tag'));
        setCategory(params.get('category'));
    }, [searchable]);

    if (sorted.length === 0) {
        return null;
    }

    const hasArticle = (slug: string) => site.pages.some((p) => p.slug === `/news/${slug}`);
    const isPreview = typeof section.limit === 'number' && sorted.length > section.limit;
    const link = section.link === false ? null : (section.link ?? (isPreview && site.pages.some((p) => p.slug === '/news') ? { label: t(site, 'allNews'), href: '/news' } : null));
    const heading = (
        <>
            <SectionHeading eyebrow={section.eyebrow ?? t(site, 'latestNews')} title={section.title ?? t(site, 'newsTitle')} subtitle={section.subtitle} />
            {searchable && (
                <div className="mb-10 space-y-4">
                    <label className="relative mx-auto block max-w-xl">
                        <span className="sr-only">{t(site, 'searchNews')}</span>
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t(site, 'searchNews')}
                            className="w-full rounded-full border border-border bg-surface py-3 pl-12 pr-4 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </label>
                    {categories.length > 1 && (
                        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t(site, 'filterByCategory')}>
                            {[null, ...categories].map((value) => (
                                <button
                                    key={value ?? 'all'}
                                    type="button"
                                    aria-pressed={category === value}
                                    onClick={() => setCategory(value)}
                                    className={cn('school-button px-4 py-2 text-sm font-medium transition', category === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/75 hover:text-primary')}
                                >
                                    {value ?? t(site, 'all')}
                                </button>
                            ))}
                        </div>
                    )}
                    {tag && (
                        <p className="text-center">
                            <button type="button" onClick={() => setTag(null)} className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-foreground">
                                #{tag} <X className="h-3.5 w-3.5" aria-hidden="true" />
                                <span className="sr-only">{t(site, 'clearFilter')}</span>
                            </button>
                        </p>
                    )}
                    <p className="text-center text-sm text-muted-foreground" aria-live="polite">
                        {query || category || tag ? (filtered.length === 1 ? t(site, 'resultCountOne') : t(site, 'resultCount', { count: localizeDigits(site, filtered.length) })) : ''}
                    </p>
                </div>
            )}
        </>
    );
    const empty = news.length === 0 && <p className="text-center text-muted-foreground">{t(site, 'noNewsFound')}</p>;
    const tagList = (item: NewsItem) =>
        (item.category || (item.tags?.length ?? 0) > 0) && (
            <p className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium">
                {item.category && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">{item.category}</span>}
                {item.tags?.map((value) =>
                    searchable ? (
                        <button key={value} type="button" onClick={() => setTag(value)} className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground hover:text-primary">
                            #{value}
                        </button>
                    ) : (
                        <span key={value} className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
                            #{value}
                        </span>
                    ),
                )}
            </p>
        );
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
                    {empty}
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
                                    {tagList(item)}
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
                {empty}
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
                                {tagList(item)}
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
