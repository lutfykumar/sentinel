<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RoleManagementController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user()->load('roles');
})->middleware(['web', 'auth']);

// Debug authentication endpoint
Route::middleware(['web'])->get('/auth-test', function (Request $request) {
    return [
        'authenticated' => auth()->check(),
        'user_id' => auth()->id(),
        'session_id' => session()->getId(),
        'csrf_token' => csrf_token(),
    ];
});

// Dashboard API routes - using web middleware for session-based auth
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/document-summary', [DashboardController::class, 'getDocumentSummary']);
    Route::get('/monthly-documents', [DashboardController::class, 'getMonthlyDocuments']);
    Route::post('/refresh-bc20-jumlahdok', [DashboardController::class, 'refreshDocumentSummary']);
    Route::post('/refresh-bc20-jumlahdok-bulan', [DashboardController::class, 'refreshMonthlyDocuments']);
    Route::post('/refresh-all-dashboard-views', [DashboardController::class, 'refreshAllViews']);
    Route::get('/import-visualization', [DashboardController::class, 'getImportVisualization']);
    Route::post('/refresh-import-visualization', [DashboardController::class, 'refreshImportVisualization']);
});

// User Management Routes (Admin only) - using web middleware for session-based auth
Route::middleware(['web', 'auth', 'role:admin'])->group(function () {
    // Users
    Route::apiResource('users', UserManagementController::class);
    Route::post('/users/{user}/toggle-status', [UserManagementController::class, 'toggleStatus']);
    Route::get('/users-roles', [UserManagementController::class, 'getRoles']);
    
    // Roles
    Route::apiResource('roles', RoleManagementController::class);
    Route::post('/roles/{role}/toggle-status', [RoleManagementController::class, 'toggleStatus']);
    Route::get('/available-permissions', [RoleManagementController::class, 'getAvailablePermissions']);
});
