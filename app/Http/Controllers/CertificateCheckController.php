<?php

namespace App\Http\Controllers;

use App\Support\HostedSites;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Asked by Caddy's on-demand TLS before it requests a certificate for a
 * domain: only published schools' domains get one, so the server cannot be
 * made to request certificates for arbitrary names.
 */
class CertificateCheckController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $domain = (string) $request->query('domain', '');

        return HostedSites::forHost($domain) !== null
            ? response('Allowed.', 200)
            : response('Not a published school.', 404);
    }
}
