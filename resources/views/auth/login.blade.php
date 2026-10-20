@extends('layouts.auth')

@section('title', 'Prihlásenie')

@section('content')
    <form method="POST" action="/login" class="auth-form" novalidate>
        @csrf
        <div class="empty-text">
            <h2>Vitajte späť</h2>
            <p>Prihláste sa a vaše kartičky budú na každom zariadení.</p>
        </div>

        <label class="field">
            <span>E-mail</span>
            <input type="email" name="email" value="{{ old('email') }}" autocomplete="email" inputmode="email" required autofocus>
        </label>
        <label class="field">
            <span>Heslo</span>
            <input type="password" name="password" autocomplete="current-password" required>
        </label>
        @if ($errors->any())
            <p class="form-error" role="alert">{{ $errors->first() }}</p>
        @endif

        <div class="actions">
            <button type="submit" class="btn btn-dark">Prihlásiť sa</button>
            <a href="/register" class="btn btn-ghost">Nemám účet – registrovať sa</a>
        </div>
    </form>
@endsection
