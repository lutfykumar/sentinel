<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CustomsDataController;
use App\Http\Controllers\RuleSetController;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Data Page Route (requires data.view permission)
    Route::middleware('permission:data.view')->get('/data', [CustomsDataController::class, 'index'])->name('data.index');
    
    // RuleSet Page Route (requires rulesets.view permission)
    Route::middleware('permission:rulesets.view')->get('/rulesets', [RuleSetController::class, 'index'])->name('rulesets.index');
    
    // Rulesets Routes (requires data.view permission)
    Route::middleware('permission:data.view')->group(function () {
        Route::get('rulesets', function () {
            return Inertia::render('rulesets/Rulesets');
        })->name('rulesets');
    });
    
    // Management Routes (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('management/users', function () {
            return Inertia::render('management/Users');
        })->name('management.users');
        
        Route::get('management/roles', function () {
            return Inertia::render('management/Roles');
        })->name('management.roles');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
