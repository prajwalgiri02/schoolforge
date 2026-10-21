'use client';

import { ExternalLink, Play } from 'lucide-react';
import { useState } from 'react';
import { Container, Media, Section, SectionHeading, cn, limitItems } from '../../runtime/ui';
import { formatSiteDate, t } from '../../runtime/i18n';
import { videoEmbed } from '../../runtime/video';
import type { SectionProps, SiteData } from '../../runtime/types';

type Video = NonNullable<SiteData['content']['videos']>[number];

export default function Videos({ section, site }: SectionProps) {
    const videos = limitItems(site.content.videos, section.limit);

    if (videos.length === 0) {
        return null;
    }

    const featured = section.variant === 'featured';

    return (
        <Section tone="muted">
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'videos')} title={section.title ?? t(site, 'videosTitle')} subtitle={section.subtitle} />
                <ul className={cn('grid gap-6', featured ? 'lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3')}>
                    {videos.map((video, index) => (
                        <li key={video.url} className={cn(featured && index === 0 && 'lg:col-span-2 lg:row-span-2')}>
                            <VideoCard site={site} video={video} large={featured && index === 0} />
                        </li>
                    ))}
                </ul>
            </Container>
        </Section>
    );
}

/**
 * Shows a poster until the visitor presses play, so pages stay fast and no
 * video site cookies are set before then (YouTube plays in privacy mode).
 */
function VideoCard({ site, video, large }: { site: SiteData; video: Video; large: boolean }) {
    const [playing, setPlaying] = useState(false);
    const embed = videoEmbed(video.url);
    const poster = video.thumbnail ?? embed?.thumbnail;

    return (
        <article className="school-card h-full overflow-hidden">
            <div className="relative aspect-video bg-black">
                {playing && embed ? (
                    <iframe
                        src={embed.embedUrl}
                        title={video.title}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                ) : (
                    <>
                        <Media src={poster} alt="" icon="none" className="opacity-90" />
                        {embed ? (
                            <button type="button" onClick={() => setPlaying(true)} aria-label={t(site, 'playVideo', { title: video.title })} className="group absolute inset-0 flex items-center justify-center">
                                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition group-hover:scale-110">
                                    <Play className="ml-1 h-7 w-7" aria-hidden="true" />
                                </span>
                            </button>
                        ) : (
                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center">
                                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">
                                    {t(site, 'watchVideo')} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                </span>
                            </a>
                        )}
                    </>
                )}
            </div>
            <div className="p-5">
                {video.date && (
                    <time className="text-sm font-semibold text-accent-strong" dateTime={video.date}>
                        {formatSiteDate(site, video.date, 'long')}
                    </time>
                )}
                <h3 className={cn('school-heading mt-1', large ? 'text-2xl' : 'text-lg')}>{video.title}</h3>
                {video.description && <p className="mt-2 text-muted-foreground">{video.description}</p>}
            </div>
        </article>
    );
}
