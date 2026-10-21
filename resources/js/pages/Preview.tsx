import { Head } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { setHostedMode } from '@/preview/adapter';
import { PageRenderer } from '@registry/runtime/page-renderer';
import { findPage, pageTitle } from '@registry/runtime/pages';
import type { SiteData } from '@registry/runtime/types';

type Tokens = { cssVariables: Record<string, string>; heading: { weight: number | string; tracking: string } };

type Props = {
    base: string;
    slug?: string;
    site?: SiteData;
    tokens?: Tokens;
    extraCss?: string;
    problems?: string[];
    /** A published school Studio hosts, rather than the editor preview. */
    hosted?: boolean;
};

/**
 * Renders a school website inside Studio with its real components. The theme is
 * applied through CSS variables, so any theme or brand colour shows instantly.
 * Published schools that Studio hosts are served with this page too.
 */
export default function Preview({ slug, site, tokens, extraCss, problems = [], hosted = false }: Props) {
    setHostedMode(hosted);

    if (!site || !tokens || !slug) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 font-sans">
                <Head title="Preview" />
                <div className="max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                    <p className="font-semibold">The preview can’t be shown until these are fixed:</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5">
                        {problems.map((problem) => (
                            <li key={problem}>{problem}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    const page = findPage(site, slug);
    const style = {
        ...tokens.cssVariables,
        '--school-heading-weight': String(tokens.heading.weight),
        '--school-heading-tracking': tokens.heading.tracking,
    } as CSSProperties;

    return (
        <>
            <Head title={page ? pageTitle(site, page) : site.school.name}>
                {site.theme.fontImports?.map((href) => <link key={href} rel="stylesheet" href={href} />)}
            </Head>
            {extraCss && <style>{extraCss}</style>}
            <div style={style}>{page && <PageRenderer site={site} page={page} debug={!hosted} />}</div>
        </>
    );
}
