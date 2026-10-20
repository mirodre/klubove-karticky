<!DOCTYPE html>
<html lang="sk">
<head>
    @include('layouts.head')
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Klubové kartičky</title>
</head>
<body>
<main id="app" aria-live="polite"></main>
<div id="toast" role="status" hidden></div>

<script>
    window.APP_USER = @json(['id' => auth()->id(), 'name' => auth()->user()->name, 'email' => auth()->user()->email]);
</script>
<script src="/vendor/jsbarcode.min.js" defer></script>
<script src="/vendor/qrcode.js" defer></script>
<script src="/app.js?v={{ $assetVersion }}" defer></script>
</body>
</html>
