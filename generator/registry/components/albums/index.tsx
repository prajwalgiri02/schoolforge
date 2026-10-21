import { Images } from 'lucide-react';
import { Container, Media, Section, SectionHeading, SmartLink, limitItems } from '../../runtime/ui';
import { formatSiteDate, localizeDigits, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function Albums({ section, site }: SectionProps) {
    const albums = limitItems(
        [...(site.content.albums ?? [])].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
        section.limit,
    );

    if (albums.length === 0) {
        return null;
    }

    return (
        <Section>
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'photoAlbums')} title={section.title ?? t(site, 'albumsTitle')} subtitle={section.subtitle} />
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {albums.map((album) => {
                        const count = album.photos?.length ?? 0;

                        return (
                            <li key={album.slug}>
                                <SmartLink href={`/gallery/${album.slug}`} className="group school-card block overflow-hidden">
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <Media sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" src={album.cover ?? album.photos?.[0]?.src} alt={album.title} icon="camera" className="transition duration-500 group-hover:scale-105" />
                                        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                                            <Images className="h-3.5 w-3.5" aria-hidden="true" /> {t(site, 'photoCount', { count: localizeDigits(site, count) })}
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        {album.date && (
                                            <time className="text-sm font-semibold text-accent-strong" dateTime={album.date}>
                                                {formatSiteDate(site, album.date, 'long')}
                                            </time>
                                        )}
                                        <h3 className="school-heading mt-1 text-xl group-hover:text-primary">{album.title}</h3>
                                        {album.description && <p className="mt-2 line-clamp-2 text-muted-foreground">{album.description}</p>}
                                    </div>
                                </SmartLink>
                            </li>
                        );
                    })}
                </ul>
            </Container>
        </Section>
    );
}
