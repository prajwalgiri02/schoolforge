import { createInertiaApp } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { renderToString } from 'react-dom/server';
import Preview from './pages/Preview';

/**
 * Renders the pages of a published school to HTML when it is published, so
 * search engines and visitors get each page's content before JavaScript runs.
 * Studio runs `node bootstrap/ssr/ssr.js` with a JSON list of Inertia page
 * objects on stdin and reads a JSON list of HTML strings from stdout.
 */
/** The parts of Node's `process` this script uses (Studio does not install Node's types). */
declare const process: {
    stdin: { setEncoding(encoding: string): void; on(event: 'data', listener: (chunk: string) => void): void; on(event: 'end', listener: () => void): void };
    stdout: { write(data: string): void };
};

async function renderPage(page: Page): Promise<string> {
    let html = '';

    await createInertiaApp({
        page,
        render: (element) => (html = renderToString(element)),
        resolve: () => Preview,
        setup: ({ App, props }) => <App {...props} />,
    });

    return html;
}

let input = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', async () => {
    const pages = JSON.parse(input) as Page[];
    const html: string[] = [];

    for (const page of pages) {
        html.push(await renderPage(page));
    }

    process.stdout.write(JSON.stringify(html));
});
