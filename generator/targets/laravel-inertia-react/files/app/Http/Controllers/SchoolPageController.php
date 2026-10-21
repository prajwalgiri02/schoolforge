<?php

namespace App\Http\Controllers;

use App\Support\SchoolSite;
use Inertia\Inertia;
use Inertia\Response;

class SchoolPageController extends Controller
{
    /**
     * Render any page defined in the generated site data.
     */
    public function __invoke(SchoolSite $site, ?string $path = null): Response
    {
        $segments = array_values(array_filter(explode('/', (string) $path), fn (string $segment): bool => $segment !== ''));
        $locale = $site->defaultLocale();

        if (isset($segments[0]) && $segments[0] !== $locale && in_array($segments[0], $site->locales(), true)) {
            $locale = array_shift($segments);
        }

        $slug = '/'.implode('/', $segments);
        $page = $site->findPage($slug, $locale);

        abort_if($page === null, 404);

        return Inertia::render('School/Page', [
            'site' => $site->data($locale),
            'slug' => $slug,
            'siteUrl' => $site->siteUrl(),
        ]);
    }
}
