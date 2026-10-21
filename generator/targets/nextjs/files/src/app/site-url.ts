import siteData from '@/school/site.json';
import type { SiteData } from '@/school/runtime/types';

/**
 * The live site address, from `seo.siteUrl` in school.config.json, or the
 * SITE_URL environment variable, falling back to the local dev server.
 */
export const siteUrl = ((siteData as unknown as SiteData).seo?.siteUrl ?? process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
