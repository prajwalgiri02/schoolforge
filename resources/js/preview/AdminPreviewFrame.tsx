import { usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { MediaLibraryUrlContext, UploadUrlContext } from '@admin/fields';

type Props = { adminUrl: string; studioUrl: string; themeVariables?: Record<string, string> };

/**
 * Wraps the generated Laravel site's admin panel when Studio previews it, with a
 * banner saying nothing is saved, the school's theme colours, and uploads pointed at the preview.
 */
export function AdminPreviewFrame({ children }: { children: ReactNode }) {
    const { adminUrl, studioUrl, themeVariables } = usePage<Props>().props;

    return (
        <UploadUrlContext.Provider value={`${adminUrl}/uploads`}>
            <MediaLibraryUrlContext.Provider value={`${adminUrl}/media`}>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e2741] px-4 py-2 font-sans text-sm text-white sm:px-6 lg:sticky lg:top-0 lg:z-50 lg:h-9 lg:flex-nowrap lg:py-0">
                    <span className="flex items-center gap-2">
                        <Eye className="h-4 w-4 shrink-0" />
                        Preview of the admin panel in the Laravel site. Changes here are not saved.
                    </span>
                    <a href={studioUrl} className="flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline">
                        <ArrowLeft className="h-4 w-4" /> Back to Studio
                    </a>
                </div>
                <div style={themeVariables as CSSProperties} className="[--admin-top:2.25rem]">
                    {children}
                </div>
            </MediaLibraryUrlContext.Provider>
        </UploadUrlContext.Provider>
    );
}
