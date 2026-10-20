<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Verzia app.js/styles.css pre ?v= – mení sa pri každom nasadení zmenených súborov.
        View::composer(['app', 'layouts.head'], function ($view) {
            $mtimes = array_map(
                fn (string $file) => @filemtime(public_path($file)) ?: 0,
                ['app.js', 'styles.css'],
            );
            $view->with('assetVersion', substr(md5(implode('-', $mtimes)), 0, 8));
        });
    }
}
