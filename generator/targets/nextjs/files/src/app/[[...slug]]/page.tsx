import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageRenderer } from '@/school/runtime/page-renderer';
import { findPage } from '@/school/runtime/pages';
import { jsonLdScript, pageMeta } from '@/school/runtime/seo';
import { defaultLocale } from '@/school/sites';
import { getSites } from '../content';
import { siteUrl } from '../site-url';

type Params = Promise<{ slug?: string[] }>;

/**
 * Splits /ne/about into the Nepali site and /about; other paths use the default language.
 */
async function resolve(slug: string[] | undefined) {
    const sites = await getSites();
    const [first, ...rest] = slug ?? [];
    const locale = first && first !== defaultLocale && sites[first] ? first : defaultLocale;
    const segments = locale === defaultLocale ? (slug ?? []) : rest;
    const site = sites[locale];

    return { site, page: findPage(site, `/${segments.join('/')}`) };
}

/** Pages published later in SchoolForge Studio (headless mode) are rendered on first visit. */
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
    return Object.values(await getSites()).flatMap((site) => {
        const prefix = site.i18n?.basePath ? [site.i18n.basePath.slice(1)] : [];

        return site.pages.map((page) => ({ slug: [...prefix, ...(page.slug === '/' ? [] : page.slug.slice(1).split('/'))] }));
    });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { site, page } = await resolve((await params).slug);

    if (!page) {
        return {};
    }

    const meta = pageMeta(site, page, siteUrl);
    const images = meta.image ? [{ url: meta.image }] : undefined;

    return {
        title: { absolute: meta.title },
        description: meta.description,
        alternates: { canonical: meta.url, languages: meta.alternates.length > 0 ? Object.fromEntries(meta.alternates.map((item) => [item.locale, item.url])) : undefined },
        openGraph: { title: meta.title, description: meta.description, url: meta.url, type: meta.type, images, locale: site.i18n?.locale },
        twitter: { card: meta.image ? 'summary_large_image' : 'summary', title: meta.title, description: meta.description, images: meta.image ? [meta.image] : undefined },
    };
}

export default async function SchoolPage({ params }: { params: Params }) {
    const { site, page } = await resolve((await params).slug);

    if (!page) {
        notFound();
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(pageMeta(site, page, siteUrl).jsonLd) }} />
            <PageRenderer site={site} page={page} debug={process.env.NODE_ENV !== 'production'} />
        </>
    );
}
