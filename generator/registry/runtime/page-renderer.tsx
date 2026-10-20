import { sectionComponents } from '../registry';
import type { PageDefinition, SectionBlock, SiteData } from './types';

function MissingSection({ type }: { type: string }) {
    return (
        <div className="border-2 border-dashed border-red-400 bg-red-50 p-6 text-center text-sm text-red-700">
            Unknown section type <code>{type}</code>. Install it with <code>schoolforge add {type}</code> or remove it from the page.
        </div>
    );
}

type ListProps = { sections: SectionBlock[]; site: SiteData; page: PageDefinition; debug?: boolean };

export function SectionList({ sections, site, page, debug = false }: ListProps) {
    return (
        <>
            {sections.map((section, index) => {
                const Component = sectionComponents[section.type];
                const key = section.id ?? `${section.type}-${index}`;

                if (!Component) {
                    return debug ? <MissingSection key={key} type={section.type} /> : null;
                }

                return <Component key={key} section={section} site={site} page={page} />;
            })}
        </>
    );
}

/**
 * Renders a full page: theme header blocks, the page's sections, then footer blocks.
 * With `debug`, sections whose component is not installed show a visible warning.
 */
export function PageRenderer({ site, page, debug = false }: { site: SiteData; page: PageDefinition; debug?: boolean }) {
    return (
        <div className={`school-site theme-${site.theme.name} flex min-h-screen flex-col bg-background font-body text-foreground antialiased`}>
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2">
                Skip to content
            </a>
            <SectionList sections={site.layout.header} site={site} page={page} debug={debug} />
            <main id="main" className="flex-1">
                <SectionList sections={page.sections} site={site} page={page} debug={debug} />
            </main>
            <SectionList sections={site.layout.footer} site={site} page={page} debug={debug} />
        </div>
    );
}
