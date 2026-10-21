import type { MetadataRoute } from 'next';
import { sites } from '@/school/sites';
import { siteUrl } from './site-url';

export default function sitemap(): MetadataRoute.Sitemap {
    return Object.values(sites).flatMap((site) => {
        const base = `${siteUrl}${site.i18n?.basePath ?? ''}`;
        const articleDates = Object.fromEntries((site.content.news ?? []).map((item) => [`/news/${item.slug}`, item.date]));

        return site.pages.map((page) => ({
            url: page.slug === '/' ? base : `${base}${page.slug}`,
            lastModified: articleDates[page.slug] ? new Date(`${articleDates[page.slug]}T00:00:00Z`) : undefined,
            changeFrequency: page.slug === '/' || page.slug === '/news' ? ('weekly' as const) : ('monthly' as const),
            priority: page.slug === '/' ? 1 : page.slug.startsWith('/news/') ? 0.6 : 0.8,
        }));
    });
}
