<?php

namespace App\Http\Controllers;

use App\Support\SchoolSite;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    /**
     * XML sitemap of every page, so search engines find the whole site.
     */
    public function sitemap(SchoolSite $site): Response
    {
        $siteUrl = $site->siteUrl();
        $articleDates = collect($site->data()['content']['news'] ?? [])->mapWithKeys(fn (array $item): array => ['/news/'.$item['slug'] => $item['date'] ?? null]);

        $urls = collect($site->data()['pages'])->map(fn (array $page): string => sprintf(
            "  <url>\n    <loc>%s</loc>%s\n    <priority>%s</priority>\n  </url>",
            e($page['slug'] === '/' ? $siteUrl : $siteUrl.$page['slug']),
            $articleDates->get($page['slug']) ? "\n    <lastmod>".e($articleDates->get($page['slug'])).'</lastmod>' : '',
            $page['slug'] === '/' ? '1.0' : (str_starts_with($page['slug'], '/news/') ? '0.6' : '0.8'),
        ));

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n"
            .$urls->implode("\n")."\n"
            .'</urlset>'."\n";

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    /**
     * robots.txt that allows the public site and hides the admin panel.
     */
    public function robots(SchoolSite $site): Response
    {
        $body = implode("\n", [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            '',
            'Sitemap: '.$site->siteUrl().'/sitemap.xml',
            '',
        ]);

        return response($body, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
