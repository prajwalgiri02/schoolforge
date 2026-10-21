import { pageDescription, pageTitle } from './pages';
import type { PageDefinition, SiteData } from './types';

export type PageMeta = {
    title: string;
    description: string;
    url: string;
    image: string | null;
    type: 'website' | 'article';
    keywords: string[];
    jsonLd: Record<string, unknown>[];
};

/**
 * Turns a root-relative path into an absolute URL on the live site.
 */
export function absoluteUrl(siteUrl: string, path: string | null | undefined): string | null {
    if (!path) {
        return null;
    }

    if (/^https?:\/\//.test(path)) {
        return path;
    }

    return `${siteUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

function schoolType(type: string | undefined): string {
    const value = (type ?? '').toLowerCase();

    if (/(pre-?school|kindergarten|montessori|nursery)/.test(value)) {
        return 'Preschool';
    }

    if (/(college|university|\+2|higher secondary)/.test(value)) {
        return 'CollegeOrUniversity';
    }

    if (/(primary|elementary)/.test(value) && !/secondary|k-?12|k–12/.test(value)) {
        return 'ElementarySchool';
    }

    if (/(high school|secondary)/.test(value) && !/k-?12|k–12/.test(value)) {
        return 'HighSchool';
    }

    return 'School';
}

/**
 * schema.org description of the school, which search engines use for rich results.
 */
export function schoolJsonLd(site: SiteData, siteUrl: string): Record<string, unknown> {
    const { school } = site;
    const contact = school.contact ?? {};

    return Object.fromEntries(
        Object.entries({
            '@context': 'https://schema.org',
            '@type': schoolType(school.type),
            '@id': `${siteUrl}/#school`,
            name: school.name,
            alternateName: school.shortName,
            url: siteUrl,
            logo: absoluteUrl(siteUrl, school.logo ?? null),
            image: absoluteUrl(siteUrl, site.seo?.image ?? null),
            description: school.about?.summary ?? school.tagline,
            slogan: school.motto,
            foundingDate: school.established ? String(school.established) : undefined,
            telephone: contact.phone?.[0],
            email: contact.email?.[0],
            address: contact.address ? { '@type': 'PostalAddress', streetAddress: contact.address } : undefined,
            sameAs: Object.values(school.social ?? {}).filter(Boolean),
        }).filter(([, value]) => value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0)),
    );
}

/**
 * Everything a page needs in its <head>: title, description, canonical URL,
 * share image and structured data. Shared by the Next.js and Laravel targets.
 */
export function pageMeta(site: SiteData, page: PageDefinition, siteUrl: string): PageMeta {
    const url = page.slug === '/' ? siteUrl : `${siteUrl}${page.slug}`;
    const articleSlug = page.sections.find((section) => section.type === 'article')?.newsSlug as string | undefined;
    const article = articleSlug ? site.content.news?.find((item) => item.slug === articleSlug) : undefined;
    const image = absoluteUrl(siteUrl, article?.image ?? site.seo?.image ?? null);
    const jsonLd: Record<string, unknown>[] = [schoolJsonLd(site, siteUrl)];

    if (article) {
        jsonLd.push(
            Object.fromEntries(
                Object.entries({
                    '@context': 'https://schema.org',
                    '@type': 'NewsArticle',
                    headline: article.title,
                    description: article.excerpt,
                    datePublished: article.date,
                    image: image ?? undefined,
                    url,
                    publisher: { '@id': `${siteUrl}/#school` },
                }).filter(([, value]) => value !== undefined),
            ),
        );
    }

    return {
        title: pageTitle(site, page),
        description: pageDescription(site, page),
        url,
        image,
        type: article ? 'article' : 'website',
        keywords: site.seo?.keywords ?? [],
        jsonLd,
    };
}

/**
 * Serialises structured data for a <script type="application/ld+json"> tag, escaping
 * "<" so content can never close the script element.
 */
export function jsonLdScript(data: Record<string, unknown>[]): string {
    return JSON.stringify(data.length === 1 ? data[0] : data).replace(/</g, '\\u003c');
}
