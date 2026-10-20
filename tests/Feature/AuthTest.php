<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_app_opens_without_account(): void
    {
        $this->get('/')->assertOk()->assertSee('window.APP_USER = null', false);
        $this->get('/login')->assertOk()->assertSee('Prihlásiť sa');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_guest_keeps_cards_after_registration(): void
    {
        $this->postJson('/api/cards', $this->card())->assertCreated()->assertJsonPath('user.guest', true);
        $guest = User::sole();

        $this->get('/register')->assertOk()->assertSee('karty z tohto zariadenia');
        $this->post('/register', [
            'name' => 'Jana',
            'email' => 'jana@example.com',
            'password' => 'tajneheslo',
            'password_confirmation' => 'tajneheslo',
        ])->assertRedirect('/');

        $this->assertAuthenticatedAs($guest);
        $this->assertDatabaseCount('users', 1);
        $this->assertSame('jana@example.com', $guest->fresh()->email);
        $this->getJson('/api/cards')->assertJsonCount(1, 'cards');
    }

    public function test_guest_cards_move_to_account_on_login(): void
    {
        $user = User::factory()->create(['password' => 'tajneheslo']);
        $user->cards()->create($this->card(['name' => 'Už mám', 'number' => '111']));

        $this->postJson('/api/cards', $this->card(['number' => '111']))->assertCreated(); // duplikát
        $this->postJson('/api/cards', $this->card(['name' => 'Nová', 'number' => '222']))->assertCreated();
        $guest = User::whereNull('email')->sole();

        $this->post('/login', ['email' => $user->email, 'password' => 'tajneheslo'])->assertRedirect('/');

        $this->assertAuthenticatedAs($user);
        $this->assertModelMissing($guest);
        $this->assertEqualsCanonicalizing(['111', '222'], $user->cards()->pluck('number')->all());
    }

    public function test_registered_user_cannot_open_register_page(): void
    {
        $this->actingAs(User::factory()->create())->get('/register')->assertRedirect('/');
    }

    private function card(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Zelený Košík',
            'number' => '8590123456781',
            'format' => 'EAN13',
            'color' => '#1F4D3A',
        ], $overrides);
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

    public function test_login_keeps_user_signed_in_for_at_least_a_year(): void
    {
        $user = User::factory()->create(['password' => 'tajneheslo']);

        $response = $this->post('/login', ['email' => $user->email, 'password' => 'tajneheslo']);

        $year = 365 * 24 * 60 * 60;
        $remember = collect($response->headers->getCookies())
            ->first(fn ($c) => str_starts_with($c->getName(), 'remember_web_'));
        $this->assertNotNull($remember);
        $this->assertGreaterThanOrEqual(time() + $year, $remember->getExpiresTime());
        $this->assertGreaterThanOrEqual(525600, config('session.lifetime'));
    }
}
