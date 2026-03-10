<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request)
    {
        $username = $request->json('username');
        $password = $request->json('password');

        $result = $this->authService->login($username, $password);

        if ($result['success']) {
            return response()->json([
                'token' => $result['token'],
                'message' => 'Login successful',
                'user' => $result['user']
            ]);
        }

        return response()->json(['error' => $result['error']], 401);
    }

    public function verify(Request $request)
    {
        $token = $request->header('Authorization');
        $result = $this->authService->verify($token);

        if ($result['success']) {
            return response()->json($result);
        }

        return response()->json($result, 401);
    }
}
