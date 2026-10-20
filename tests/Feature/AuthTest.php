<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
        $this->get('/login')->assertOk()->assertSee('Prihlásiť sa');
    }

    public function test_user_can_register(): void
    {
        $this->post('/register', [
            'name' => 'Jana',
            'email' => 'jana@example.com',
            'password' => 'tajneheslo',
            'password_confirmation' => 'tajneheslo',
        ])->assertRedirect('/');

        $this->assertAuthenticated();
        $this->get('/')->assertOk()->assertSee('APP_USER', false);
    }

    public function test_user_can_login_and_logout(): void
    {
        $user = User::factory()->create(['password' => 'tajneheslo']);

        $this->post('/login', ['email' => $user->email, 'password' => 'zle'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();

        $this->post('/login', ['email' => $user->email, 'password' => 'tajneheslo'])
            ->assertRedirect('/');
        $this->assertAuthenticatedAs($user);

        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }
}
