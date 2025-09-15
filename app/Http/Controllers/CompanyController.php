<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CompanyController extends Controller
{
    /**
     * Display the company search page.
     */
    public function index()
    {
        return Inertia::render('company/Company');
    }

    /**
     * Get filtered company data with pagination.
     */
    public function getData(Request $request)
    {
        $request->validate([
            'nib' => 'nullable|string|max:255',
            'npwp_perseroan' => 'nullable|string|max:255', 
            'nama_perseroan' => 'nullable|string|max:255',
            'no_identitas_penanggung_jwb' => 'nullable|string|max:255',
            'nama_penanggung_jwb' => 'nullable|string|max:255',
            'npwp_penanggung_jwb' => 'nullable|string|max:255',
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'sort_by' => ['nullable', Rule::in(['nib', 'npwp_perseroan', 'nama_perseroan'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        // Build the query
        $query = DB::table('customs.oss_nib')
            ->select([
                'nib',
                'npwp_perseroan',
                'nama_perseroan'
            ]);

        // Apply filters
        $this->applyFilters($query, $request);

        // Apply sorting
        $this->applySorting($query, $request);

        // Get paginated results
        $perPage = $request->get('per_page', 20);
        $page = $request->get('page', 1);
        
        // Get total count
        $total = $query->count();
        
        // Apply pagination
        $results = $query
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        // Calculate pagination data
        $lastPage = ceil($total / $perPage);
        $from = (($page - 1) * $perPage) + 1;
        $to = min($from + $perPage - 1, $total);

        // Format response like Laravel's pagination
        $response = [
            'data' => $results->toArray(),
            'current_page' => $page,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'from' => $from,
            'to' => $to,
        ];

        return response()->json($response);
    }

    /**
     * Apply filters to the query.
     */
    private function applyFilters($query, Request $request)
    {
        if ($request->filled('nib')) {
            $query->where('nib', 'LIKE', '%' . $request->nib . '%');
        }

        if ($request->filled('npwp_perseroan')) {
            $query->where('npwp_perseroan', 'LIKE', '%' . $request->npwp_perseroan . '%');
        }

        if ($request->filled('nama_perseroan')) {
            $query->whereRaw('UPPER(nama_perseroan) LIKE UPPER(?)', ['%' . $request->nama_perseroan . '%']);
        }

        if ($request->filled('no_identitas_penanggung_jwb')) {
            $query->whereExists(function ($q) use ($request) {
                $q->select(DB::raw(1))
                  ->from('customs.oss_penanggung_jawab')
                  ->whereColumn('oss_penanggung_jawab.nib', 'oss_nib.nib')
                  ->where('no_identitas_penanggung_jwb', 'LIKE', '%' . $request->no_identitas_penanggung_jwb . '%');
            });
        }

        if ($request->filled('nama_penanggung_jwb')) {
            $query->whereExists(function ($q) use ($request) {
                $q->select(DB::raw(1))
                  ->from('customs.oss_penanggung_jawab')
                  ->whereColumn('oss_penanggung_jawab.nib', 'oss_nib.nib')
                  ->whereRaw('UPPER(nama_penanggung_jwb) LIKE UPPER(?)', ['%' . $request->nama_penanggung_jwb . '%']);
            });
        }

        if ($request->filled('npwp_penanggung_jwb')) {
            $query->whereExists(function ($q) use ($request) {
                $q->select(DB::raw(1))
                  ->from('customs.oss_penanggung_jawab')
                  ->whereColumn('oss_penanggung_jawab.nib', 'oss_nib.nib')
                  ->where('npwp_penanggung_jwb', 'LIKE', '%' . $request->npwp_penanggung_jwb . '%');
            });
        }
    }

    /**
     * Apply sorting to the query.
     */
    private function applySorting($query, Request $request)
    {
        $sortBy = $request->get('sort_by', 'nib');
        $sortDirection = $request->get('sort_direction', 'asc');

        switch ($sortBy) {
            case 'nib':
            case 'npwp_perseroan':
            case 'nama_perseroan':
                $query->orderBy($sortBy, $sortDirection);
                break;
            default:
                $query->orderBy('nib', 'asc');
        }
    }

    /**
     * Get detailed information for a specific company by NIB.
     */
    public function getDetail($nib)
    {
        // Get main company data
        $company = DB::table('customs.oss_nib')
            ->where('nib', $nib)
            ->first();

        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        // Get related data
        $legalitas = DB::table('customs.oss_legalitas')
            ->where('nib', $nib)
            ->get();

        $pemegang_saham = DB::table('customs.oss_pemegang_saham')
            ->where('nib', $nib)
            ->get();

        $penanggung_jawab = DB::table('customs.oss_penanggung_jawab')
            ->where('nib', $nib)
            ->get();

        $proyek = DB::table('customs.oss_proyek')
            ->leftJoin('customs.oss_kbli', 'oss_proyek.kbli', '=', 'oss_kbli.kode_referensi')
            ->select(
                'oss_proyek.*',
                'oss_kbli.uraian_referensi as uraian'
            )
            ->where('oss_proyek.nib', $nib)
            ->get();

        // Combine all data
        $result = [
            'company' => $company,
            'legalitas' => $legalitas,
            'pemegang_saham' => $pemegang_saham,
            'penanggung_jawab' => $penanggung_jawab,
            'proyek' => $proyek,
        ];

        return response()->json($result);
    }

    /**
     * Get autocomplete suggestions for NIB.
     */
    public function getNibSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = DB::table('customs.oss_nib')
            ->where('nib', 'LIKE', $request->input('query') . '%')
            ->limit(10)
            ->pluck('nib')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for NPWP Perseroan.
     */
    public function getNpwpPerseroanSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = DB::table('customs.oss_nib')
            ->where('npwp_perseroan', 'LIKE', '%' . $request->input('query') . '%')
            ->whereNotNull('npwp_perseroan')
            ->where('npwp_perseroan', '!=', '')
            ->limit(10)
            ->pluck('npwp_perseroan')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for Nama Perseroan.
     */
    public function getNamaPerseroanSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = DB::table('customs.oss_nib')
            ->whereRaw('UPPER(nama_perseroan) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->whereNotNull('nama_perseroan')
            ->where('nama_perseroan', '!=', '')
            ->limit(10)
            ->pluck('nama_perseroan')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for Identitas Penanggung Jawab.
     */
    public function getIdentitasPenanggungJwbSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = DB::table('customs.oss_penanggung_jawab')
            ->where('no_identitas_penanggung_jwb', 'LIKE', '%' . $request->input('query') . '%')
            ->whereNotNull('no_identitas_penanggung_jwb')
            ->where('no_identitas_penanggung_jwb', '!=', '')
            ->limit(10)
            ->pluck('no_identitas_penanggung_jwb')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for Nama Penanggung Jawab.
     */
    public function getNamaPenanggungJwbSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = DB::table('customs.oss_penanggung_jawab')
            ->whereRaw('UPPER(nama_penanggung_jwb) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->whereNotNull('nama_penanggung_jwb')
            ->where('nama_penanggung_jwb', '!=', '')
            ->limit(10)
            ->pluck('nama_penanggung_jwb')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for NPWP Penanggung Jawab.
     */
    public function getNpwpPenanggungJwbSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = DB::table('customs.oss_penanggung_jawab')
            ->where('npwp_penanggung_jwb', 'LIKE', '%' . $request->input('query') . '%')
            ->whereNotNull('npwp_penanggung_jwb')
            ->where('npwp_penanggung_jwb', '!=', '')
            ->limit(10)
            ->pluck('npwp_penanggung_jwb')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }
}
