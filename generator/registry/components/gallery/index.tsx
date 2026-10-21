'use client';

import { useState } from 'react';
import { Lightbox, useLightbox } from '../../runtime/lightbox';
import { ButtonLink, Container, Media, Section, SectionHeading, cn, limitItems } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

type GalleryProps = SectionProps<{ filter?: boolean; link?: { label: string; href: string } | false }>;

export default function Gallery({ section, site }: GalleryProps) {
    const variant = section.variant ?? 'grid';
    const all = limitItems(site.content.gallery, section.limit);
    const categories = Array.from(new Set(all.map((item) => item.category).filter(Boolean))) as string[];
    const [category, setCategory] = useState<string | null>(null);
    const items = category ? all.filter((item) => item.category === category) : all;
    const showFilter = section.filter !== false && categories.length > 1 && !section.limit;
    const isPreview = typeof section.limit === 'number' && (site.content.gallery?.length ?? 0) > section.limit;
    const link = section.link === false ? null : (section.link ?? (isPreview && site.pages.some((p) => p.slug === '/gallery') ? { label: t(site, 'openGallery'), href: '/gallery' } : null));

    const lightbox = useLightbox(items.length);

    if (all.length === 0) {
        return null;
    }

    return (
        <Section>
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'gallery')} title={section.title ?? t(site, 'galleryTitle')} subtitle={section.subtitle} />
                {showFilter && (
                    <div className="mb-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label={t(site, 'filterGallery')}>
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
                                {value ?? t(site, 'all')}
                            </button>
                        ))}
                    </div>
                )}
                <div className={cn(variant === 'masonry' ? 'columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4' : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4')}>
                    {items.map((item, index) => (
                        <button
                            key={`${item.caption ?? 'image'}-${index}`}
                            type="button"
                            onClick={() => lightbox.open(index)}
                            className={cn(
                                'group relative block w-full overflow-hidden rounded-card text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                                variant === 'masonry' ? (index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]') : 'aspect-square',
                            )}
                        >
                            <Media sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" src={item.src} alt={item.caption ?? t(site, 'galleryImage')} label={item.caption} icon="camera" className="transition duration-500 group-hover:scale-105" />
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
            <Lightbox site={site} item={lightbox.active === null ? null : items[lightbox.active]} onClose={lightbox.close} onStep={lightbox.step} />
        </Section>
    );
}
