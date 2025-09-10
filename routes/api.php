<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RoleManagementController;
use App\Http\Controllers\RuleSetController;
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

// Data API Routes - standardized under /api/data/
Route::middleware(['web', 'auth', 'permission:data.view'])->prefix('data')->group(function () {
    Route::get('/customs', [\App\Http\Controllers\CustomsDataController::class, 'getData']);
    Route::get('/customs/{idheader}', [\App\Http\Controllers\CustomsDataController::class, 'getDetail']);
    
    // Download routes
    Route::get('/download/pdf/{idheader}', [\App\Http\Controllers\CustomsDataController::class, 'downloadPdf']);
    
    // Export routes (require additional data.export permission)
    Route::middleware('permission:data.export')->group(function () {
        Route::get('/export/excel', [\App\Http\Controllers\CustomsDataController::class, 'exportExcel']);
    });
    
    // Suggestion routes
    Route::get('/suggestions/registration-number', [\App\Http\Controllers\CustomsDataController::class, 'getRegistrationNumberSuggestions']);
    Route::get('/suggestions/importir', [\App\Http\Controllers\CustomsDataController::class, 'getImportirSuggestions']);
    Route::get('/suggestions/penjual', [\App\Http\Controllers\CustomsDataController::class, 'getPenjualSuggestions']);
    Route::get('/suggestions/pengirim', [\App\Http\Controllers\CustomsDataController::class, 'getPengirimSuggestions']);
    Route::get('/suggestions/ppjk', [\App\Http\Controllers\CustomsDataController::class, 'getPpjkSuggestions']);
    Route::get('/suggestions/negara-asal', [\App\Http\Controllers\CustomsDataController::class, 'getNegaraAsalSuggestions']);
    Route::get('/suggestions/uraian-barang', [\App\Http\Controllers\CustomsDataController::class, 'getUraianBarangSuggestions']);
    Route::get('/suggestions/hs-code', [\App\Http\Controllers\CustomsDataController::class, 'getHsCodeSuggestions']);
    Route::get('/suggestions/nomor-kontainer', [\App\Http\Controllers\CustomsDataController::class, 'getNomorKontainerSuggestions']);
    Route::get('/suggestions/pelabuhan-muat', [\App\Http\Controllers\CustomsDataController::class, 'getPelabuhanMuatSuggestions']);
    Route::get('/suggestions/pelabuhan-transit', [\App\Http\Controllers\CustomsDataController::class, 'getPelabuhanTransitSuggestions']);
    Route::get('/suggestions/kode-tps', [\App\Http\Controllers\CustomsDataController::class, 'getKodeTpsSuggestions']);
    Route::get('/suggestions/nama-pengangkut', [\App\Http\Controllers\CustomsDataController::class, 'getNamaPengangkutSuggestions']);
    
    // Options routes
    Route::get('/options/document-codes', [\App\Http\Controllers\CustomsDataController::class, 'getDocumentCodes']);
    Route::get('/options/process-codes', [\App\Http\Controllers\CustomsDataController::class, 'getProcessCodes']);
    Route::get('/options/customs-routes', [\App\Http\Controllers\CustomsDataController::class, 'getCustomsRoutes']);
    Route::get('/options/response-statuses', [\App\Http\Controllers\CustomsDataController::class, 'getResponseStatuses']);
});

// Rule Set Management Routes - using web middleware for session-based auth
Route::middleware(['web', 'auth'])->group(function () {
    // Get user's rule sets
    Route::middleware('permission:rulesets.view')->get('/rulesets', [RuleSetController::class, 'getRuleSets']);
    
    // Create new rule set
    Route::middleware('permission:rulesets.create')->post('/rulesets', [RuleSetController::class, 'store']);
    
    // Get specific rule set
    Route::middleware('permission:rulesets.view')->get('/rulesets/{ruleset}', [RuleSetController::class, 'show']);
    
    // Update rule set
    Route::middleware('permission:rulesets.update')->put('/rulesets/{ruleset}', [RuleSetController::class, 'update']);
    
    // Delete rule set
    Route::middleware('permission:rulesets.delete')->delete('/rulesets/{ruleset}', [RuleSetController::class, 'destroy']);
    
    // Admin: Get all rule sets (for admin users)
    Route::middleware('permission:rulesets.manage')->get('/rulesets/admin/all', [RuleSetController::class, 'adminIndex']);
    
    // RuleSet Query Execution API (standardized under /api/rulesets/queries/)
    Route::middleware('permission:rulesets.view')->get('/rulesets/queries/execute', [RuleSetController::class, 'executeQuery']);
    Route::middleware('permission:rulesets.view')->get('/rulesets/queries/{idheader}', [RuleSetController::class, 'getDetail']);
    
    // RuleSet Export API (require additional data.export permission)
    Route::middleware(['permission:rulesets.view', 'permission:data.export'])->get('/rulesets/export/excel', [\App\Http\Controllers\RuleSetQueryController::class, 'exportExcel']);
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
