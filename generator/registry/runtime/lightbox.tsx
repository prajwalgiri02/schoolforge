'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { t } from './i18n';
import type { ImageRef, SiteData } from './types';
import { Media } from './ui';

export type LightboxItem = { src?: ImageRef; caption?: string };

/**
 * Which image of a list is open full screen, with keyboard navigation
 * (Escape closes, arrow keys step through the images).
 */
export function useLightbox(count: number) {
    const [active, setActive] = useState<number | null>(null);
    const close = useCallback(() => setActive(null), []);
    const step = useCallback((delta: number) => setActive((index) => (index === null ? null : (index + delta + count) % count)), [count]);

    useEffect(() => {
        if (active === null) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            } else if (event.key === 'ArrowRight') {
                step(1);
            } else if (event.key === 'ArrowLeft') {
                step(-1);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [active, close, step]);

    return { active, open: setActive, close, step };
}

export function Lightbox({ site, item, onClose, onStep }: { site: SiteData; item: LightboxItem | null; onClose: () => void; onStep: (delta: number) => void }) {
    if (!item) {
        return null;
    }

    return (
        <div role="dialog" aria-modal="true" aria-label={item.caption ?? t(site, 'imagePreview')} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
            <button type="button" onClick={onClose} aria-label={t(site, 'close')} className="absolute right-4 top-4 text-white/80 hover:text-white">
                <X className="h-8 w-8" />
            </button>
            <button type="button" onClick={(event) => (event.stopPropagation(), onStep(-1))} aria-label={t(site, 'previousImage')} className="absolute left-4 text-white/80 hover:text-white">
                <ChevronLeft className="h-10 w-10" />
            </button>
            <figure className="max-h-full w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
                <div className="aspect-[16/10] overflow-hidden rounded-card">
                    <Media src={item.src} alt={item.caption ?? t(site, 'galleryImage')} label={item.caption} icon="camera" className="object-contain" />
                </div>
                {item.caption && <figcaption className="mt-4 text-center text-white/85">{item.caption}</figcaption>}
            </figure>
            <button type="button" onClick={(event) => (event.stopPropagation(), onStep(1))} aria-label={t(site, 'nextImage')} className="absolute right-4 text-white/80 hover:text-white">
                <ChevronRight className="h-10 w-10" />
            </button>
        </div>
    );
}
