import { defaultLocale, sites } from '@/school/sites';

/**
 * The live site address, from `seo.siteUrl` in school.config.json, or the
 * SITE_URL environment variable, falling back to the local dev server.
 */
export const siteUrl = (sites[defaultLocale].seo?.siteUrl ?? process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
