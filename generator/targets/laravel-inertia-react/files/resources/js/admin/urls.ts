import { usePage } from '@inertiajs/react';
import type { SharedProps } from './types';

/**
 * Builds admin panel links. The panel lives at /admin, but SchoolForge Studio
 * previews it under another path, so pages never hard-code /admin.
 */
export function useAdminUrl(): (path?: string) => string {
    const base = usePage<SharedProps>().props.adminUrl ?? '/admin';

    return (path = '') => `${base}${path}`;
}

export function useSiteUrl(): string {
    return usePage<SharedProps>().props.siteUrl ?? '/';
}
