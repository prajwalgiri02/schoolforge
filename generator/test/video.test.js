import assert from 'node:assert/strict';
import test from 'node:test';
import { videoEmbed } from '../registry/runtime/video.ts';

test('YouTube links in every common shape are embedded in privacy mode', () => {
    for (const url of [
        'https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=10s',
        'https://youtu.be/aqz-KE-bpKQ?si=abc',
        'https://m.youtube.com/watch?v=aqz-KE-bpKQ',
        'https://www.youtube.com/shorts/aqz-KE-bpKQ',
        'https://www.youtube.com/embed/aqz-KE-bpKQ',
    ]) {
        assert.deepEqual(videoEmbed(url), {
            provider: 'youtube',
            id: 'aqz-KE-bpKQ',
            embedUrl: 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?autoplay=1&rel=0',
            thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
        }, url);
    }
});

test('Vimeo links are embedded without tracking', () => {
    assert.equal(videoEmbed('https://vimeo.com/76979871')?.embedUrl, 'https://player.vimeo.com/video/76979871?autoplay=1&dnt=1');
    assert.equal(videoEmbed('https://player.vimeo.com/video/76979871')?.id, '76979871');
});

test('other links are not embedded', () => {
    assert.equal(videoEmbed('https://www.facebook.com/school/videos/123'), null);
    assert.equal(videoEmbed('not a url'), null);
    assert.equal(videoEmbed(undefined), null);
    assert.equal(videoEmbed('https://www.youtube.com/channel/UC123'), null);
});
