<?php

namespace Tests\Feature;

use App\Support\SchoolSite;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }

    public function test_sitemap_lists_every_page(): void
    {
        $site = app(SchoolSite::class);
        $response = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

        $xml = simplexml_load_string($response->getContent());
        $expected = array_sum(array_map(fn (string $locale): int => count($site->data($locale)['pages']), $site->locales()));
        $this->assertCount($expected, $xml->url);
        $this->assertSame($site->siteUrl(), (string) $xml->url[0]->loc);
    }

    public function test_robots_points_to_the_sitemap_and_hides_admin(): void
    {
        $this->get('/robots.txt')
            ->assertOk()
            ->assertSee('Disallow: /admin')
            ->assertSee('Sitemap: '.app(SchoolSite::class)->siteUrl().'/sitemap.xml');
    }

    public function test_pages_receive_the_site_url_for_canonical_links(): void
    {
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('siteUrl', app(SchoolSite::class)->siteUrl()));
    }

    public function test_site_url_falls_back_to_app_url(): void
    {
        $site = app(SchoolSite::class);

        if (($site->data()['seo']['siteUrl'] ?? null) !== null) {
            $this->assertSame(rtrim($site->data()['seo']['siteUrl'], '/'), $site->siteUrl());
        } else {
            $this->assertSame(rtrim(url('/'), '/'), $site->siteUrl());
        }
    }
}
