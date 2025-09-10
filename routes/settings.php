<?php

use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('settings', function () {
        return Inertia::render('settings/index');
    })->name('settings');
    Route::redirect('settings/', '/settings');
    
    Route::get('settings/two-factor', [TwoFactorController::class, 'show'])->name('2fa.show');
    Route::get('settings/two-factor/qr-code', [TwoFactorController::class, 'qrCode'])->name('2fa.qrcode');
    Route::post('settings/two-factor/enable', [TwoFactorController::class, 'enable'])->name('2fa.enable');
    Route::post('settings/two-factor/disable', [TwoFactorController::class, 'disable'])->name('2fa.disable');
    Route::post('settings/two-factor/regenerate', [TwoFactorController::class, 'regenerateSecret'])->name('2fa.regenerate');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
});
