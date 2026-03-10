<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('dashboard');
});

Route::get('/investor.html', function () {
    return view('investor');
});

Route::get('/network.html', function () {
    return view('network');
});

Route::get('/login.html', function () {
    return view('login');
});

Route::get('/admin.html', function () {
    return view('admin');
});
