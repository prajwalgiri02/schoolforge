<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Studio is private: the home page sends guests to sign in.
     */
    public function test_the_application_redirects_guests_to_sign_in(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/login');
    }
}
