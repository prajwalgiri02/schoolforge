import { Head } from '@inertiajs/react';
import { PageRenderer } from '@/school/runtime/page-renderer';
import { findPage, pageDescription, pageTitle } from '@/school/runtime/pages';
import type { SiteData } from '@/school/runtime/types';

export default function SchoolPage({ site, slug }: { site: SiteData; slug: string }) {
    const page = findPage(site, slug);

    if (!page) {
        return null;
    }

    return (
        <>
            <Head title={pageTitle(site, page)}>
                <meta name="description" content={pageDescription(site, page)} />
            </Head>
            <PageRenderer site={site} page={page} debug={import.meta.env.DEV} />
        </>
    );
}
