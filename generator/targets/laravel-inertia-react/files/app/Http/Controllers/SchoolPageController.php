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
        $slug = '/'.trim((string) $path, '/');
        $page = $site->findPage($slug);

        abort_if($page === null, 404);

        return Inertia::render('School/Page', [
            'site' => $site->data(),
            'slug' => $slug,
        ]);
    }
}
