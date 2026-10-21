import { Head } from '@inertiajs/react';
import { PageRenderer } from '@/school/runtime/page-renderer';
import { findPage } from '@/school/runtime/pages';
import { jsonLdScript, pageMeta } from '@/school/runtime/seo';
import type { SiteData } from '@/school/runtime/types';

export default function SchoolPage({ site, slug, siteUrl }: { site: SiteData; slug: string; siteUrl: string }) {
    const page = findPage(site, slug);

    if (!page) {
        return null;
    }

    const meta = pageMeta(site, page, siteUrl);

    return (
        <>
            <Head title={meta.title}>
                <meta name="description" content={meta.description} />
                {meta.keywords.length > 0 && <meta name="keywords" content={meta.keywords.join(', ')} />}
                <link rel="canonical" href={meta.url} />
                <meta property="og:site_name" content={site.school.name} />
                <meta property="og:type" content={meta.type} />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:url" content={meta.url} />
                {meta.image && <meta property="og:image" content={meta.image} />}
                <meta name="twitter:card" content={meta.image ? 'summary_large_image' : 'summary'} />
                {site.seo?.googleSiteVerification && <meta name="google-site-verification" content={site.seo.googleSiteVerification} />}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(meta.jsonLd) }} />
            </Head>
            <PageRenderer site={site} page={page} debug={import.meta.env.DEV} />
        </>
    );
}
