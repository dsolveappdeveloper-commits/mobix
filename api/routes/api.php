<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BranchController;
use App\Http\Controllers\Api\V1\OtpAuthController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\StaffController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    //OTP enpoints:
    Route::post('/auth/forgot-password', [OtpAuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/auth/reset-password', [OtpAuthController::class, 'resetPassword'])->middleware('throttle:10,1');
    Route::post('/auth/login-otp/send', [OtpAuthController::class, 'sendLoginOtp'])->middleware('throttle:5,1');
    Route::post('/auth/login-otp/verify', [OtpAuthController::class, 'verifyLoginOtp'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'changePassword']);

        Route::get('/branches', [BranchController::class, 'index']);
        Route::get('/branches/{branch}', [BranchController::class, 'show']);
        Route::post('/branches', [BranchController::class, 'store'])
            ->middleware('permission:settings,create');
        Route::put('/branches/{branch}', [BranchController::class, 'update'])
            ->middleware('permission:settings,edit');
        Route::delete('/branches/{branch}', [BranchController::class, 'destroy'])
            ->middleware('permission:settings,delete');

        Route::middleware('permission:settings,view')->get('/staff', [StaffController::class, 'index']);
        Route::middleware('permission:settings,view')->get('/staff/{id}', [StaffController::class, 'show']);
        Route::middleware('permission:settings,create')->post('/staff', [StaffController::class, 'store']);
        Route::middleware('permission:settings,edit')->put('/staff/{id}', [StaffController::class, 'update']);
        Route::middleware('permission:settings,delete')->delete('/staff/{id}', [StaffController::class, 'destroy']);

        Route::middleware('permission:settings,view')->get('/roles', [RoleController::class, 'index']);
                Route::middleware('permission:settings,create')->post('/roles', [RoleController::class, 'store']);
        Route::middleware('permission:settings,edit')->put('/roles/{id}', [RoleController::class, 'update']);
        Route::middleware('permission:settings,delete')->delete('/roles/{id}', [RoleController::class, 'destroy']);
        Route::middleware('permission:settings,edit')->put('/roles/{id}/permissions', [RoleController::class, 'updatePermissions']);
    });
});
