import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import siteData from '@/school/site.json';
import type { SiteData } from '@/school/runtime/types';
import './globals.css';

const site = siteData as unknown as SiteData;

export const metadata: Metadata = {
    title: { default: site.school.name, template: `%s | ${site.school.name}` },
    description: site.school.about?.summary ?? site.school.tagline,
    icons: site.school.favicon ? [{ url: site.school.favicon }] : undefined,
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                {site.theme.fontImports?.length ? (
                    <>
                        <link rel="preconnect" href="https://fonts.googleapis.com" />
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    </>
                ) : null}
                {site.theme.fontImports?.map((href) => (
                    <link key={href} rel="stylesheet" href={href} />
                ))}
            </head>
            <body>{children}</body>
        </html>
    );
}
