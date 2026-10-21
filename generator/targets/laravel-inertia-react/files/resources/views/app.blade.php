@php($schoolSite = app(\App\Support\SchoolSite::class))
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ $schoolSite->schoolName() }}</title>
    @if ($favicon = $schoolSite->data()['school']['favicon'] ?? null)
        <link rel="icon" href="{{ $favicon }}">
    @endif
    @if (count($schoolSite->fontStylesheets()) > 0)
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        @foreach ($schoolSite->fontStylesheets() as $stylesheet)
            <link rel="stylesheet" href="{{ $stylesheet }}">
        @endforeach
    @endif
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @if ($colorOverrides = $schoolSite->colorOverridesCss())
        <style>{!! $colorOverrides !!}</style>
    @endif
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
