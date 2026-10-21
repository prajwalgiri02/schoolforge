import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import siteData from '@/school/site.json';
import { PageRenderer } from '@/school/runtime/page-renderer';
import { findPage } from '@/school/runtime/pages';
import { jsonLdScript, pageMeta } from '@/school/runtime/seo';
import type { SiteData } from '@/school/runtime/types';
import { siteUrl } from '../site-url';

const site = siteData as unknown as SiteData;

type Params = Promise<{ slug?: string[] }>;

function pathFrom(slug: string[] | undefined): string {
    return `/${(slug ?? []).join('/')}`;
}

export const dynamicParams = false;

export function generateStaticParams(): { slug: string[] }[] {
    return site.pages.map((page) => ({ slug: page.slug === '/' ? [] : page.slug.slice(1).split('/') }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const page = findPage(site, pathFrom((await params).slug));

    if (!page) {
        return {};
    }

    const meta = pageMeta(site, page, siteUrl);
    const images = meta.image ? [{ url: meta.image }] : undefined;

    return {
        title: { absolute: meta.title },
        description: meta.description,
        alternates: { canonical: meta.url },
        openGraph: { title: meta.title, description: meta.description, url: meta.url, type: meta.type, images },
        twitter: { card: meta.image ? 'summary_large_image' : 'summary', title: meta.title, description: meta.description, images: meta.image ? [meta.image] : undefined },
    };
}

export default async function SchoolPage({ params }: { params: Params }) {
    const page = findPage(site, pathFrom((await params).slug));

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
