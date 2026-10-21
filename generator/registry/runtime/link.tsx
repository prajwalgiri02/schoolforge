'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { Link } from '../adapter';

/**
 * Path prefix of the language being shown ('' for the default language, '/ne' for Nepali...).
 * Internal links get it automatically, so components can keep using plain paths like '/about'.
 */
const LocaleBaseContext = createContext('');

export function LocaleProvider({ basePath, children }: { basePath: string; children: ReactNode }) {
    return <LocaleBaseContext.Provider value={basePath}>{children}</LocaleBaseContext.Provider>;
}

export function useLocaleBase(): string {
    return useContext(LocaleBaseContext);
}

export function isInternalHref(href: string): boolean {
    return href.startsWith('/') && !href.startsWith('//');
}

export function SmartLink({ href, className, children, localized = true, ...rest }: { href: string; className?: string; children: ReactNode; localized?: boolean; 'aria-label'?: string; hrefLang?: string; lang?: string }) {
    const base = useLocaleBase();

    if (isInternalHref(href)) {
        const target = localized && base ? (href === '/' ? base : `${base}${href}`) : href;

        return (
            <Link href={target} className={className} {...rest}>
                {children}
            </Link>
        );
    }

    const external = /^https?:\/\//.test(href);

    return (
        <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
            {children}
        </a>
    );
}
