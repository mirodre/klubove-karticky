<!DOCTYPE html>
<html lang="sk">
<head>
    @include('layouts.head')
    <title>@yield('title') · Klubové kartičky</title>
</head>
<body>
<main class="screen empty auth">
    <h1 class="h1">Moje karty</h1>

    <div class="auth-hero" aria-hidden="true">
        <div class="stack small">
            <div class="c1"></div>
            <div class="c2"></div>
            <div class="c3"><div class="sq"></div><div class="bars"><i style="width:3px"></i><i style="width:6px"></i><i style="width:3px"></i><i style="width:3px;background:none"></i><i style="width:6px"></i><i style="width:3px"></i><i style="width:9px"></i><i style="width:3px;background:none"></i><i style="width:3px"></i><i style="width:6px"></i></div></div>
        </div>
    </div>

    @yield('content')
</main>
<script>
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
</script>
</body>
</html>
