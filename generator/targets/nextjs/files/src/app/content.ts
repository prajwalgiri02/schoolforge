import { cache } from 'react';
import type { SiteData } from '@/school/runtime/types';
import { defaultLocale, sites as bundledSites } from '@/school/sites';

/** Cache tag of content fetched from SchoolForge Studio; /api/revalidate clears it. */
export const CONTENT_TAG = 'school-content';

/** Whether content comes from SchoolForge Studio rather than the files generated with the site. */
export const isHeadless = Boolean(process.env.SCHOOLFORGE_CONTENT_URL);

/**
 * The website's content in every language. With SCHOOLFORGE_CONTENT_URL set,
 * it is the version last published in SchoolForge Studio, cached and refreshed
 * when Studio publishes (or every SCHOOLFORGE_REVALIDATE seconds); otherwise,
 * or if Studio cannot be reached, it is the content generated with the site.
 * The theme always comes from the generated site, since its CSS is built in.
 */
export const getSites = cache(async (): Promise<Record<string, SiteData>> => {
    if (!isHeadless) {
        return bundledSites;
    }

    try {
        const response = await fetch(process.env.SCHOOLFORGE_CONTENT_URL!, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${process.env.SCHOOLFORGE_CONTENT_TOKEN ?? ''}` },
            next: { revalidate: Number(process.env.SCHOOLFORGE_REVALIDATE ?? 3600), tags: [CONTENT_TAG] },
        });

        if (!response.ok) {
            throw new Error(`SchoolForge Studio answered ${response.status}`);
        }

        const { locales } = (await response.json()) as { locales: Record<string, SiteData> };

        return Object.fromEntries(Object.entries(locales).map(([locale, site]) => [locale, { ...site, theme: (bundledSites[locale] ?? bundledSites[defaultLocale]).theme }]));
    } catch (error) {
        console.error('Using the generated content: could not load content from SchoolForge Studio.', error);

        return bundledSites;
    }
});

export async function getSite(locale: string = defaultLocale): Promise<SiteData> {
    const sites = await getSites();

    return sites[locale] ?? sites[defaultLocale];
}
