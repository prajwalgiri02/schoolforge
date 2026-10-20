/**
 * Small colour helpers used to derive readable foreground colours when a school
 * overrides theme colours with its own brand palette.
 */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value) {
    return typeof value === 'string' && HEX.test(value.trim());
}

export function parseHex(value) {
    const match = HEX.exec(String(value).trim());

    if (!match) {
        throw new Error(`Invalid hex colour "${value}". Use #rgb or #rrggbb.`);
    }

    let hex = match[1];

    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((char) => char + char)
            .join('');
    }

    return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

export function toHex([r, g, b]) {
    return `#${[r, g, b].map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0')).join('')}`;
}

export function normalizeHex(value) {
    return toHex(parseHex(value));
}

function channelLuminance(channel) {
    const c = channel / 255;

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
    const [r, g, b] = parseHex(hex).map(channelLuminance);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);

    return (light + 0.05) / (dark + 0.05);
}

export function mix(a, b, weight) {
    const ca = parseHex(a);
    const cb = parseHex(b);

    return toHex(ca.map((channel, index) => channel * (1 - weight) + cb[index] * weight));
}

/**
 * Picks whichever of the candidate colours reads best on the given background.
 */
export function readableOn(background, candidates = ['#ffffff', '#111827']) {
    return candidates.reduce((best, candidate) => (contrastRatio(background, candidate) > contrastRatio(background, best) ? candidate : best));
}

/**
 * Darkens (or lightens) a colour towards `towards` until it meets the target
 * contrast against `background`.
 */
export function ensureContrast(color, background, target = 4.5, towards = null) {
    const direction = towards ?? (luminance(background) > 0.5 ? '#000000' : '#ffffff');
    let result = normalizeHex(color);

    for (let step = 0; step <= 20 && contrastRatio(result, background) < target; step++) {
        result = mix(color, direction, step * 0.05);
    }

    return result;
}
