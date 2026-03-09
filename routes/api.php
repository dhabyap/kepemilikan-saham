<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SahamController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\KonglomeratController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- Auth ---
Route::post('/login', [AuthController::class, 'login']);
Route::get('/verify', [AuthController::class, 'verify']);

// --- Stats & Visualizations ---
Route::get('/stats', [StatsController::class, 'getStats']);
Route::get('/top-investors', [StatsController::class, 'getTopInvestors']);
Route::get('/local-vs-foreign', [StatsController::class, 'getLocalVsForeign']);
Route::get('/investor-types', [StatsController::class, 'getInvestorTypes']);
Route::get('/most-distributed', [StatsController::class, 'getMostDistributed']);

// --- Saham Queries ---
Route::get('/dates', [SahamController::class, 'getDates']);
Route::get('/top-holdings', [SahamController::class, 'getTopHoldings']);
Route::get('/fractional-owners', [SahamController::class, 'getFractionalOwners']);
Route::get('/issuers', [SahamController::class, 'getIssuers']);
Route::get('/issuer/{code}', [SahamController::class, 'getIssuerDetail']);
Route::get('/search', [SahamController::class, 'search']);
Route::get('/investors/search', [SahamController::class, 'searchInvestors']);
Route::get('/investor-network', [SahamController::class, 'getInvestorNetwork']);
Route::get('/investor/{name}', [SahamController::class, 'getInvestorDetail']);

// --- Upload ---
Route::post('/upload-pdf', [\App\Http\Controllers\UploadController::class, 'uploadPdf']);
Route::get('/upload-status/{id}', [\App\Http\Controllers\UploadController::class, 'getUploadStatus']);
Route::get('/uploads', [\App\Http\Controllers\UploadController::class, 'getAllUploads']);

// --- Stock Price Endpoints ---
Route::get('/stocks/prices', [SahamController::class, 'getStockPrices']);
Route::get('/stocks/{symbol}', [SahamController::class, 'getStockPrice']);

// --- Konglomerat Queries ---
Route::get('/konglomerat', [KonglomeratController::class, 'getAll']);

Route::middleware('api')->group(function () {
    Route::post('/konglomerat', [KonglomeratController::class, 'create']);
    Route::put('/konglomerat/{id}', [KonglomeratController::class, 'update']);
    Route::delete('/konglomerat/{id}', [KonglomeratController::class, 'delete']);

    Route::put('/saham/{id}', [SahamController::class, 'updateSaham']);
    Route::delete('/saham/{id}', [SahamController::class, 'deleteSaham']);
});
