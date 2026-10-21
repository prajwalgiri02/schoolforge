'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ButtonLink, Container, Media, Section, SectionHeading, cn, limitItems } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

type GalleryProps = SectionProps<{ filter?: boolean; link?: { label: string; href: string } | false }>;

export default function Gallery({ section, site }: GalleryProps) {
    const variant = section.variant ?? 'grid';
    const all = limitItems(site.content.gallery, section.limit);
    const categories = Array.from(new Set(all.map((item) => item.category).filter(Boolean))) as string[];
    const [category, setCategory] = useState<string | null>(null);
    const [active, setActive] = useState<number | null>(null);
    const items = category ? all.filter((item) => item.category === category) : all;
    const showFilter = section.filter !== false && categories.length > 1 && !section.limit;
    const isPreview = typeof section.limit === 'number' && (site.content.gallery?.length ?? 0) > section.limit;
    const link = section.link === false ? null : (section.link ?? (isPreview && site.pages.some((p) => p.slug === '/gallery') ? { label: 'Open the gallery', href: '/gallery' } : null));

    const close = useCallback(() => setActive(null), []);
    const step = useCallback((delta: number) => setActive((index) => (index === null ? null : (index + delta + items.length) % items.length)), [items.length]);

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

    if (all.length === 0) {
        return null;
    }

    const current = active === null ? null : items[active];

    return (
        <Section>
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? 'Gallery'} title={section.title ?? 'Life on campus'} subtitle={section.subtitle} />
                {showFilter && (
                    <div className="mb-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter gallery">
                        {[null, ...categories].map((value) => (
                            <button
                                key={value ?? 'all'}
                                type="button"
                                role="tab"
                                aria-selected={category === value}
                                onClick={() => setCategory(value)}
                                className={cn(
                                    'school-button px-4 py-2 text-sm font-medium transition',
                                    category === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/75 hover:text-primary',
                                )}
                            >
                                {value ?? 'All'}
                            </button>
                        ))}
                    </div>
                )}
                <div className={cn(variant === 'masonry' ? 'columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4' : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4')}>
                    {items.map((item, index) => (
                        <button
                            key={`${item.caption ?? 'image'}-${index}`}
                            type="button"
                            onClick={() => setActive(index)}
                            className={cn(
                                'group relative block w-full overflow-hidden rounded-card text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                                variant === 'masonry' ? (index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]') : 'aspect-square',
                            )}
                        >
                            <Media sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" src={item.src} alt={item.caption ?? 'Gallery image'} label={item.caption} icon="camera" className="transition duration-500 group-hover:scale-105" />
                            {item.caption && (
                                <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-4 text-sm text-white transition group-hover:translate-y-0">
                                    {item.caption}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                {link && (
                    <div className="mt-12 text-center">
                        <ButtonLink href={link.href} variant="outline">
                            {link.label}
                        </ButtonLink>
                    </div>
                )}
            </Container>
            {current && (
                <div role="dialog" aria-modal="true" aria-label={current.caption ?? 'Image preview'} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={close}>
                    <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 text-white/80 hover:text-white">
                        <X className="h-8 w-8" />
                    </button>
                    <button type="button" onClick={(event) => (event.stopPropagation(), step(-1))} aria-label="Previous image" className="absolute left-4 text-white/80 hover:text-white">
                        <ChevronLeft className="h-10 w-10" />
                    </button>
                    <figure className="max-h-full w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
                        <div className="aspect-[16/10] overflow-hidden rounded-card">
                            <Media src={current.src} alt={current.caption ?? 'Gallery image'} label={current.caption} icon="camera" className="object-contain" />
                        </div>
                        {current.caption && <figcaption className="mt-4 text-center text-white/85">{current.caption}</figcaption>}
                    </figure>
                    <button type="button" onClick={(event) => (event.stopPropagation(), step(1))} aria-label="Next image" className="absolute right-4 text-white/80 hover:text-white">
                        <ChevronRight className="h-10 w-10" />
                    </button>
                </div>
            )}
        </Section>
    );
}
