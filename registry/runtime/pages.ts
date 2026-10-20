import type { PageDefinition, SiteData } from './types';

export function normalizePath(path: string | undefined | null): string {
    const trimmed = (path ?? '').split(/[?#]/)[0].replace(/\/+$/, '');

    return trimmed === '' ? '/' : trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function findPage(site: SiteData, path: string): PageDefinition | undefined {
    const slug = normalizePath(path);

    return site.pages.find((page) => page.slug === slug);
}

export function pageTitle(site: SiteData, page: PageDefinition): string {
    return page.slug === '/' ? `${site.school.name}${site.school.tagline ? ` | ${site.school.tagline}` : ''}` : `${page.title} | ${site.school.name}`;
}

export function pageDescription(site: SiteData, page: PageDefinition): string {
    return page.description ?? site.school.about?.summary ?? site.school.tagline ?? site.school.name;
}

export function isActivePath(current: string, href: string): boolean {
    const a = normalizePath(current);
    const b = normalizePath(href);

    return b === '/' ? a === '/' : a === b || a.startsWith(`${b}/`);
}
