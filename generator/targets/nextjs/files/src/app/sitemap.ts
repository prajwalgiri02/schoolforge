import type { MetadataRoute } from 'next';
import siteData from '@/school/site.json';
import type { SiteData } from '@/school/runtime/types';
import { siteUrl } from './site-url';

const site = siteData as unknown as SiteData;

export default function sitemap(): MetadataRoute.Sitemap {
    const articleDates = Object.fromEntries((site.content.news ?? []).map((item) => [`/news/${item.slug}`, item.date]));

    return site.pages.map((page) => ({
        url: page.slug === '/' ? siteUrl : `${siteUrl}${page.slug}`,
        lastModified: articleDates[page.slug] ? new Date(`${articleDates[page.slug]}T00:00:00Z`) : undefined,
        changeFrequency: page.slug === '/' || page.slug === '/news' ? 'weekly' : 'monthly',
        priority: page.slug === '/' ? 1 : page.slug.startsWith('/news/') ? 0.6 : 0.8,
    }));
}
