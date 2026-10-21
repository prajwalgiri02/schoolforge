<!DOCTYPE html>
<html lang="{{ $locale ?? 'en' }}" data-hosted>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ $title ?? '' }}</title>
    @isset($description)
        <meta name="description" content="{{ $description }}">
        <link rel="canonical" href="{{ $canonical }}">
        @foreach ($alternates as $language => $href)
            <link rel="alternate" hreflang="{{ $language }}" href="{{ $href }}">
        @endforeach
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ $siteName }}">
        <meta property="og:title" content="{{ $title }}">
        <meta property="og:description" content="{{ $description }}">
        <meta property="og:url" content="{{ $canonical }}">
        @if ($image)
            <meta property="og:image" content="{{ str_starts_with($image, 'http') ? $image : url($image) }}">
        @endif
        @if ($verification)
            <meta name="google-site-verification" content="{{ $verification }}">
        @endif
    @endisset
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="antialiased">
    @inertia
</body>
</html>
