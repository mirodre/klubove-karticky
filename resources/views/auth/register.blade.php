@extends('layouts.auth')

@section('title', 'Registrácia')

@section('content')
    <form method="POST" action="/register" class="auth-form" novalidate>
        @csrf
        <div class="empty-text">
            <h2>Peňaženka bez plastu</h2>
            @if (auth()->user()?->isGuest())
                <p>Vytvorte si účet a karty z tohto zariadenia budú v bezpečí a na každom zariadení.</p>
            @else
                <p>Vytvorte si účet a majte kartičky vždy pri sebe — aj offline.</p>
            @endif
        </div>

        <label class="field">
            <span>Meno</span>
            <input type="text" name="name" value="{{ old('name') }}" autocomplete="name" required autofocus>
        </label>
        <label class="field">
            <span>E-mail</span>
            <input type="email" name="email" value="{{ old('email') }}" autocomplete="email" inputmode="email" required>
        </label>
        <label class="field">
            <span>Heslo (aspoň 8 znakov)</span>
            <input type="password" name="password" autocomplete="new-password" required minlength="8">
        </label>
        <label class="field">
            <span>Heslo znova</span>
            <input type="password" name="password_confirmation" autocomplete="new-password" required minlength="8">
        </label>
        @if ($errors->any())
            <p class="form-error" role="alert">{{ $errors->first() }}</p>
        @endif

        <div class="actions">
            <button type="submit" class="btn btn-dark">Vytvoriť účet</button>
            <a href="/login" class="btn btn-ghost">Už mám účet – prihlásiť sa</a>
            <a href="/" class="btn btn-ghost">Pokračovať bez účtu</a>
        </div>
    </form>
@endsection
