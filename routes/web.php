<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CardController;
use App\Http\Middleware\RedirectIfRegistered;
use Illuminate\Support\Facades\Route;

// prihlásenie a registrácia – aj pre hosťa, ktorý už má karty bez účtu
Route::middleware(RedirectIfRegistered::class)->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
});

// appka funguje aj bez účtu; hosťovský účet vznikne až s prvou kartou
Route::get('/', fn () => view('app'))->name('home');
Route::get('/api/cards', [CardController::class, 'index']);
Route::post('/api/cards', [CardController::class, 'store']);

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::prefix('api')->group(function () {
        Route::put('/cards/{card}', [CardController::class, 'update']);
        Route::delete('/cards/{card}', [CardController::class, 'destroy']);
        Route::post('/cards/{card}/use', [CardController::class, 'use']);
    });
});
