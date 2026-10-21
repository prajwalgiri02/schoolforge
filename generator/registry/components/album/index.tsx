'use client';

import { ArrowLeft } from 'lucide-react';
import { Lightbox, useLightbox } from '../../runtime/lightbox';
import { Container, Media, SmartLink } from '../../runtime/ui';
import { formatSiteDate, localizeDigits, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

type AlbumProps = SectionProps<{ albumSlug?: string }>;

export default function Album({ section, site }: AlbumProps) {
    const album = site.content.albums?.find((item) => item.slug === section.albumSlug);
    const photos = album?.photos ?? [];
    const lightbox = useLightbox(photos.length);

    if (!album) {
        return null;
    }

    return (
        <section className="bg-background py-14 md:py-20">
            <Container>
                <SmartLink href="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t(site, 'backToGallery')}
                </SmartLink>
                <div className="mt-8 max-w-3xl">
                    <p className="text-sm font-semibold text-accent-strong">
                        {album.date && <time dateTime={album.date}>{formatSiteDate(site, album.date, 'long')} · </time>}
                        {t(site, 'photoCount', { count: localizeDigits(site, photos.length) })}
                    </p>
                    <h1 className="school-heading mt-3 text-4xl md:text-5xl">{album.title}</h1>
                    {album.description && <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{album.description}</p>}
                </div>
                <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {photos.map((photo, index) => (
                        <button
                            key={`${photo.caption ?? 'photo'}-${index}`}
                            type="button"
                            onClick={() => lightbox.open(index)}
                            className="group relative block aspect-square w-full overflow-hidden rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                            <Media sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" src={photo.src} alt={photo.caption ?? `${album.title} ${index + 1}`} label={photo.caption} icon="camera" className="transition duration-500 group-hover:scale-105" />
                        </button>
                    ))}
                </div>
            </Container>
            <Lightbox site={site} item={lightbox.active === null ? null : photos[lightbox.active]} onClose={lightbox.close} onStep={lightbox.step} />
        </section>
    );
}
