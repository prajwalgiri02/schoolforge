'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonLink, Media } from '../../runtime/ui';
import { isoDate, t } from '../../runtime/i18n';
import type { SectionProps, SiteData } from '../../runtime/types';

type Popup = NonNullable<SiteData['content']['popup']>;

/** Changes whenever the popup's text changes, so an edited popup shows again. */
function storageKey(popup: Popup): string {
    let hash = 5381;

    for (const character of `${popup.title ?? ''}|${popup.message ?? ''}`) {
        hash = (hash * 33 + (character.codePointAt(0) ?? 0)) >>> 0;
    }

    return `school-popup-${hash.toString(36)}`;
}

function isActive(popup: Popup, today: string): boolean {
    return Boolean(popup.title || popup.message) && (!popup.startDate || popup.startDate <= today) && (!popup.endDate || popup.endDate >= today);
}

/**
 * Opens shortly after the page loads, between its start and end dates. Once
 * closed it stays closed in that browser unless `everyVisit` is set.
 */
export default function PopupAnnouncement({ site }: SectionProps) {
    const popup = site.content.popup;
    const [open, setOpen] = useState(false);
    const closeButton = useRef<HTMLButtonElement>(null);
    const close = useCallback(() => {
        setOpen(false);

        try {
            if (popup) {
                window.localStorage.setItem(storageKey(popup), '1');
            }
        } catch {
            // Storage blocked: nothing to remember.
        }
    }, [popup]);

    useEffect(() => {
        if (!popup || !isActive(popup, isoDate(new Date()))) {
            return;
        }

        try {
            if (!popup.everyVisit && window.localStorage.getItem(storageKey(popup))) {
                return;
            }
        } catch {
            // Storage blocked: show the popup anyway.
        }

        const timer = window.setTimeout(() => setOpen(true), 800);

        return () => window.clearTimeout(timer);
    }, [popup]);

    useEffect(() => {
        if (!open) {
            return;
        }

        closeButton.current?.focus();
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close();
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [open, close]);

    if (!popup || !open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={close}>
            <div role="dialog" aria-modal="true" aria-labelledby="school-popup-title" className="school-card relative w-full max-w-lg overflow-hidden bg-surface" onClick={(event) => event.stopPropagation()}>
                <button ref={closeButton} type="button" onClick={close} aria-label={t(site, 'close')} className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60">
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
                {popup.image && (
                    <div className="aspect-[16/9]">
                        <Media src={popup.image} alt="" sizes="512px" />
                    </div>
                )}
                <div className="p-6 sm:p-8">
                    <h2 id="school-popup-title" className="school-heading text-2xl">
                        {popup.title}
                    </h2>
                    {popup.message && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{popup.message}</p>}
                    {popup.link?.href && (
                        <div className="mt-6" onClick={close}>
                            <ButtonLink href={popup.link.href}>{popup.link.label}</ButtonLink>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
