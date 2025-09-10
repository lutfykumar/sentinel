<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CustomsDataController;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Customs Data Routes (requires data.view permission)
    Route::middleware('permission:data.view')->prefix('data')->name('data.')->group(function () {
        Route::get('/', [CustomsDataController::class, 'index'])->name('index');
        Route::get('/api/customs', [CustomsDataController::class, 'getData'])->name('api.get');
        Route::get('/api/customs/{idheader}/detail', [CustomsDataController::class, 'getDetail'])->name('api.detail');
        Route::get('/api/suggestions/registration-number', [CustomsDataController::class, 'getRegistrationNumberSuggestions'])->name('api.registration-suggestions');
        Route::get('/api/suggestions/importir', [CustomsDataController::class, 'getImportirSuggestions'])->name('api.importir-suggestions');
        Route::get('/api/suggestions/penjual', [CustomsDataController::class, 'getPenjualSuggestions'])->name('api.penjual-suggestions');
        Route::get('/api/suggestions/pengirim', [CustomsDataController::class, 'getPengirimSuggestions'])->name('api.pengirim-suggestions');
        Route::get('/api/suggestions/ppjk', [CustomsDataController::class, 'getPpjkSuggestions'])->name('api.ppjk-suggestions');
        Route::get('/api/suggestions/negara-asal', [CustomsDataController::class, 'getNegaraAsalSuggestions'])->name('api.negara-asal-suggestions');
        Route::get('/api/suggestions/uraian-barang', [CustomsDataController::class, 'getUraianBarangSuggestions'])->name('api.uraian-barang-suggestions');
        Route::get('/api/suggestions/hs-code', [CustomsDataController::class, 'getHsCodeSuggestions'])->name('api.hs-code-suggestions');
        Route::get('/api/suggestions/nomor-kontainer', [CustomsDataController::class, 'getNomorKontainerSuggestions'])->name('api.nomor-kontainer-suggestions');
        Route::get('/api/suggestions/pelabuhan-muat', [CustomsDataController::class, 'getPelabuhanMuatSuggestions'])->name('api.pelabuhan-muat-suggestions');
        Route::get('/api/suggestions/pelabuhan-transit', [CustomsDataController::class, 'getPelabuhanTransitSuggestions'])->name('api.pelabuhan-transit-suggestions');
        Route::get('/api/suggestions/kode-tps', [CustomsDataController::class, 'getKodeTpsSuggestions'])->name('api.kode-tps-suggestions');
        Route::get('/api/suggestions/nama-pengangkut', [CustomsDataController::class, 'getNamaPengangkutSuggestions'])->name('api.nama-pengangkut-suggestions');
        Route::get('/api/options/document-codes', [CustomsDataController::class, 'getDocumentCodes'])->name('api.document-codes');
        Route::get('/api/options/process-codes', [CustomsDataController::class, 'getProcessCodes'])->name('api.process-codes');
        Route::get('/api/options/customs-routes', [CustomsDataController::class, 'getCustomsRoutes'])->name('api.customs-routes');
        Route::get('/api/options/response-statuses', [CustomsDataController::class, 'getResponseStatuses'])->name('api.response-statuses');
        Route::get('/api/download/pdf/{idheader}', [CustomsDataController::class, 'downloadPdf'])->name('api.download-pdf');
        
        // Export routes (require additional data.export permission) - Excel only
        Route::middleware('permission:data.export')->group(function () {
            Route::get('/api/export/excel', [CustomsDataController::class, 'exportExcel'])->name('api.export-excel');
        });
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
