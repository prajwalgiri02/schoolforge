export type VideoEmbed = {
    provider: 'youtube' | 'vimeo';
    id: string;
    /** Player URL that starts playing when loaded (after the visitor clicks play). */
    embedUrl: string;
    /** Poster image, when the provider offers one without an API call. */
    thumbnail: string | null;
};

/**
 * Recognises YouTube and Vimeo links in their usual shapes (watch, share,
 * shorts, embed). Other links are not embedded and open on their own site.
 */
export function videoEmbed(url: string | undefined): VideoEmbed | null {
    if (!url) {
        return null;
    }

    let parsed: URL;

    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    const host = parsed.hostname.replace(/^(www|m)\./, '');
    let youtubeId: string | null = null;

    if (host === 'youtu.be') {
        youtubeId = parsed.pathname.slice(1).split('/')[0];
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        youtubeId = parsed.searchParams.get('v') ?? parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ?? null;
    }

    if (youtubeId && /^[\w-]{6,}$/.test(youtubeId)) {
        return {
            provider: 'youtube',
            id: youtubeId,
            embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`,
            thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        };
    }

    const vimeoId = host === 'vimeo.com' || host === 'player.vimeo.com' ? parsed.pathname.match(/(\d{5,})/)?.[1] : null;

    if (vimeoId) {
        return { provider: 'vimeo', id: vimeoId, embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&dnt=1`, thumbnail: null };
    }

    return null;
}
