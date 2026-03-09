<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class AuthService
{
    /**
     * Authenticate admin user.
     * 
     * @param string $username
     * @param string $password
     * @return array
     */
    public function login($username, $password)
    {
        $adminUsername = env('ADMIN_USERNAME');
        $adminPassword = env('ADMIN_PASSWORD');

        if ($username === $adminUsername && $password === $adminPassword) {
            // In a real Laravel app, we might use Sanctum or Sessions.
            // For this direct port, we'll return a simple token as the JS version did.
            return [
                'success' => true,
                'token' => 'laravel-token-' . time(),
                'user' => ['username' => $username]
            ];
        }

        return [
            'success' => false,
            'error' => 'Invalid credentials'
        ];
    }

    /**
     * Verify token (mock logic matching the original).
     * 
     * @param string|null $token
     * @return array
     */
    public function verify($token)
    {
        if ($token && str_contains($token, 'laravel-token-')) {
            return ['success' => true];
        }
        return ['success' => false, 'error' => 'Unauthorized'];
    }
}
