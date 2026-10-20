import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import siteData from '@/school/site.json';
import { PageRenderer } from '@/school/runtime/page-renderer';
import { findPage, pageDescription } from '@/school/runtime/pages';
import type { SiteData } from '@/school/runtime/types';

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

    return {
        title: page.slug === '/' ? { absolute: `${site.school.name}${site.school.tagline ? ` | ${site.school.tagline}` : ''}` } : page.title,
        description: pageDescription(site, page),
    };
}

export default async function SchoolPage({ params }: { params: Params }) {
    const page = findPage(site, pathFrom((await params).slug));

    if (!page) {
        notFound();
    }

    return <PageRenderer site={site} page={page} debug={process.env.NODE_ENV !== 'production'} />;
}
