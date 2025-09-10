<?php

namespace App\Http\Controllers;

use App\Models\BC20\BC20Header;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CustomsDataController extends Controller
{
    /**
     * Apply generic field operator for relationship queries.
     */
    private function applyGenericFieldOperator($query, $field, $operator, $value, $textFields = [], $numericFields = [])
    {
        // Cast numeric values for numeric fields
        if (in_array($field, $numericFields) && is_string($value) && is_numeric($value)) {
            $value = (float) $value;
            \Log::info("QUERY_DEBUG: Field '{$field}' < operator '{$operator}' < value {$value} (converted from string)");
        } else {
            \Log::info("QUERY_DEBUG: Field '{$field}' < operator '{$operator}' < value " . json_encode($value));
        }

        switch ($operator) {
            case '=':
            case 'equals':
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') = UPPER(?)', [$value]);
                } else {
                    $query->where($field, '=', $value);
                }
                break;
            case 'contains':
            case 'like':
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') LIKE UPPER(?)', ['%' . $value . '%']);
                } else {
                    $query->where($field, 'LIKE', '%' . $value . '%');
                }
                break;
            case 'beginsWith':
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') LIKE UPPER(?)', [$value . '%']);
                } else {
                    $query->where($field, 'LIKE', $value . '%');
                }
                break;
            case 'endsWith':
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') LIKE UPPER(?)', ['%' . $value]);
                } else {
                    $query->where($field, 'LIKE', '%' . $value);
                }
                break;
            case '>=':
            case 'gte':
                $query->where($field, '>=', $value);
                break;
            case '<=':
            case 'lte':
                $query->where($field, '<=', $value);
                break;
            case '>':
            case 'gt':
                $query->where($field, '>', $value);
                break;
            case '<':
            case 'lt':
                $query->where($field, '<', $value);
                break;
            case '!=':
            case 'doesNotEqual':
                $query->where($field, '!=', $value);
                break;
            case 'between':
                $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                if (is_array($betweenValues) && count($betweenValues) === 2) {
                    // Cast numeric values if needed
                    if (in_array($field, $numericFields)) {
                        $betweenValues = array_map('floatval', $betweenValues);
                    }
                    $query->whereBetween($field, $betweenValues);
                }
                break;
            case 'notBetween':
                $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                if (is_array($betweenValues) && count($betweenValues) === 2) {
                    // Cast numeric values if needed
                    if (in_array($field, $numericFields)) {
                        $betweenValues = array_map('floatval', $betweenValues);
                    }
                    $query->whereNotBetween($field, $betweenValues);
                }
                break;
            case 'null':
                $query->whereNull($field);
                break;
            case 'notNull':
                $query->whereNotNull($field);
                break;
            default:
                // Default to text-based search for unknown operators
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') LIKE UPPER(?)', ['%' . $value . '%']);
                } else {
                    $query->where($field, '=', $value);
                }
        }
    }

    /**
     * Parse between operator values from string to array.
     * Handles comma-separated values like "2025-05-01, 2025-05-02"
     */
    private function parseBetweenValue($value)
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value) && strpos($value, ',') !== false) {
            $parts = array_map('trim', explode(',', $value));
            if (count($parts) === 2) {
                return $parts;
            }
        }

        return null;
    }

    /**
     * Apply react-querybuilder JSON to the Eloquent query, supporting AND/OR and nested relations.
     */
    protected function applyQueryBuilderJson($builder, array $group, $parentCombinator = 'and')
    {
        $combinator = $group['combinator'] ?? 'and';
        $rules = $group['rules'] ?? [];

        $methodGroup = $parentCombinator === 'or' ? 'orWhere' : 'where';

        $builder->$methodGroup(function($q) use ($rules, $combinator) {
            foreach ($rules as $ruleIndex => $rule) {
                if (isset($rule['rules'])) {
                    // Nested group
                    $this->applyQueryBuilderJson($q, $rule, $combinator);
                    continue;
                }

                $field = $rule['field'] ?? '';
                $operator = $rule['operator'] ?? '=';
                $value = $rule['value'] ?? null;

                // Skip if no value provided (except for null/notNull operators)
                if (($value === null || $value === '') && !in_array($operator, ['null', 'notNull'])) {
                    continue;
                }

                $isOr = ($combinator === 'or');
                $whereMethod = $isOr ? 'orWhere' : 'where';

                // Map specific fields to relations/columns
                if ($field === 'nomordaftar') {
                    // Handle PIB number searches with various operators
                    switch ($operator) {
                        case '=':
                        case 'equals':
                            $q->$whereMethod('bc20_header.nomordaftar', '=', $value);
                            break;
                        case 'contains':
                        case 'like':
                            $q->$whereMethod('bc20_header.nomordaftar', 'LIKE', '%' . $value . '%');
                            break;
                        case 'beginsWith':
                            $q->$whereMethod('bc20_header.nomordaftar', 'LIKE', $value . '%');
                            break;
                        case 'endsWith':
                            $q->$whereMethod('bc20_header.nomordaftar', 'LIKE', '%' . $value);
                            break;
                        default:
                            $q->$whereMethod('bc20_header.nomordaftar', 'LIKE', $value . '%');
                    }
                } elseif ($field === 'tanggaldaftar') {
                    // Date comparisons
                    switch ($operator) {
                        case '=':
                            $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '=', $value);
                            break;
                        case '>=':
                            $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '>=', $value);
                            break;
                        case '<=':
                            $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '<=', $value);
                            break;
                        case 'between':
                            $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                            if (is_array($betweenValues) && count($betweenValues) === 2) {
                                $inner = $isOr ? 'orWhereBetween' : 'whereBetween';
                                $q->$inner(DB::raw('DATE(bc20_header.tanggaldaftar)'), $betweenValues);
                            }
                            break;
                        case 'notBetween':
                            $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                            if (is_array($betweenValues) && count($betweenValues) === 2) {
                                $inner = $isOr ? 'orWhereNotBetween' : 'whereNotBetween';
                                $q->$inner(DB::raw('DATE(bc20_header.tanggaldaftar)'), $betweenValues);
                            }
                            break;
                        default:
                            $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '=', $value);
                    }
                } elseif ($field === 'kodejalur') {
                    $q->$whereMethod('bc20_header.kodejalur', '=', $value);
                } elseif (strpos($field, 'kontainer.') === 0) {
                    // Handle all kontainer fields generically
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('kontainer', function($qc) use ($value, $operator, $field) {
                        $subField = str_replace('kontainer.', '', $field);
                        $textFields = ['nomorkontainer', 'namaukurankontainer', 'namajeniskontainer'];
                        $numericFields = ['serikontainer'];
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
                    });
                } elseif (strpos($field, 'barang.') === 0) {
                    // Handle all barang fields generically
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('barang', function($qc) use ($value, $operator, $field) {
                        $subField = str_replace('barang.', '', $field);
                        $textFields = ['postarif', 'uraian', 'kodebarang', 'kodesatuanbarang', 'kodejeniskemasan', 'namajeniskemasan', 'namasatuanbarang', 'namakondisibarang', 'namakategoribarang', 'namanegaraasal', 'namadaerahasal', 'namaperhitungan', 'merk', 'tipe', 'spesifikasilain', 'ukuran', 'bahanbaku', 'barangpemilik', 'barangspekkhusus'];
                        $numericFields = ['jumlahsatuan', 'cif', 'fob', 'freight', 'asuransi', 'hargaekspor', 'hargapenyerahan', 'nilaijasa', 'netto', 'bruto', 'volume', 'seribarang', 'jumlahkemasan'];
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
                    });
                } elseif (strpos($field, 'importir.') === 0) {
                    // Handle importir fields
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('entitas', function($qc) use ($value, $operator, $field) {
                        $qc->where('kodeentitas', '1'); // Importir
                        $subField = str_replace('importir.', '', $field);
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, ['namaentitas', 'alamatentitas', 'namanegara'], []);
                    });
                } elseif (strpos($field, 'ppjk.') === 0) {
                    // Handle PPJK fields
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('entitas', function($qc) use ($value, $operator, $field) {
                        $qc->where('kodeentitas', '4'); // PPJK
                        $subField = str_replace('ppjk.', '', $field);
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, ['namaentitas', 'alamatentitas', 'namanegara'], []);
                    });
                } elseif (strpos($field, 'penjual.') === 0) {
                    // Handle penjual fields
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('entitas', function($qc) use ($value, $operator, $field) {
                        $qc->where('kodeentitas', '10'); // Penjual
                        $subField = str_replace('penjual.', '', $field);
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, ['namaentitas', 'alamatentitas', 'namanegara'], []);
                    });
                } elseif (strpos($field, 'pengirim.') === 0) {
                    // Handle pengirim fields
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('entitas', function($qc) use ($value, $operator, $field) {
                        $qc->where('kodeentitas', '9'); // Pengirim
                        $subField = str_replace('pengirim.', '', $field);
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, ['namaentitas', 'alamatentitas', 'namanegara'], []);
                    });
                } elseif (strpos($field, 'pemilik.') === 0) {
                    // Handle pemilik fields
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('entitas', function($qc) use ($value, $operator, $field) {
                        $qc->where('kodeentitas', '7'); // Pemilik
                        $subField = str_replace('pemilik.', '', $field);
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, ['namaentitas', 'alamatentitas', 'namanegara'], []);
                    });
                } elseif (strpos($field, 'data.') === 0) {
                    // Handle all data fields generically
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('data', function($qc) use ($value, $operator, $field) {
                        $subField = str_replace('data.', '', $field);
                        $textFields = ['kodepelmuat', 'namapelabuhanmuat', 'kodepeltransit', 'namapelabuhantransit', 'kodetps', 'namatpswajib', 'kodekantor', 'namakantorpendek', 'kodevaluta'];
                        $numericFields = ['netto', 'bruto', 'cif', 'ndpbm', 'nilaipabean', 'fob', 'freight', 'asuransi', 'volume', 'vd', 'uangmuka', 'nilaijasa', 'nilaikurs', 'ppnpajak', 'ppnbmpajak', 'tarifppnpajak', 'tarifppnbmpajak', 'biayapenambah', 'biayapengurang', 'dasarpengenaanpajak', 'hargapenyerahan', 'hargaperolehan', 'nilaimaklon'];
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
                    });
                } elseif (strpos($field, 'pengangkut.') === 0) {
                    // Handle all pengangkut fields generically
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('pengangkut', function($qc) use ($value, $operator, $field) {
                        $subField = str_replace('pengangkut.', '', $field);
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, ['namapengangkut', 'nomorpengangkut', 'kodebendera', 'namanegara'], []);
                    });
                } elseif (strpos($field, 'dokumen.') === 0) {
                    // Handle all dokumen fields generically
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('dokumen', function($qc) use ($value, $operator, $field) {
                        $subField = str_replace('dokumen.', '', $field);
                        $textFields = ['namadokumen', 'nomordokumen', 'namafasilitas', 'kodefasilitas'];
                        $numericFields = ['seridokumen'];
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
                    });
                } elseif (strpos($field, 'pungutan.') === 0) {
                    // Handle all pungutan fields generically
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('pungutan', function($qc) use ($value, $operator, $field) {
                        $subField = str_replace('pungutan.', '', $field);
                        $textFields = ['keterangan'];
                        $numericFields = ['dibayar'];
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
                    });
                } elseif (strpos($field, 'kemasan.') === 0) {
                    // Handle all kemasan fields generically
                    $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                    $q->$hasMethod('kemasan', function($qc) use ($value, $operator, $field) {
                        $subField = str_replace('kemasan.', '', $field);
                        $textFields = ['kodejeniskemasan', 'namakemasan'];
                        $numericFields = ['jumlahkemasan', 'serikemasan'];
                        $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
                    });
                } else {
                    // Fallback: try to match header columns or use contains for text
                    if (in_array($field, ['nomordaftar', 'tanggaldaftar', 'kodejalur', 'nomoraju'])) {
                        $column = 'bc20_header.' . $field;
                        if ($operator === 'contains' || $operator === 'like') {
                            $q->$whereMethod($column, 'LIKE', '%' . $value . '%');
                        } elseif ($operator === 'between') {
                            $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                            if (is_array($betweenValues) && count($betweenValues) === 2) {
                                $inner = $isOr ? 'orWhereBetween' : 'whereBetween';
                                $q->$inner($column, $betweenValues);
                            }
                        } elseif ($operator === 'notBetween') {
                            $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                            if (is_array($betweenValues) && count($betweenValues) === 2) {
                                $inner = $isOr ? 'orWhereNotBetween' : 'whereNotBetween';
                                $q->$inner($column, $betweenValues);
                            }
                        } elseif ($operator === '>=' || $operator === 'gte') {
                            $q->$whereMethod($column, '>=', $value);
                        } elseif ($operator === '<=' || $operator === 'lte') {
                            $q->$whereMethod($column, '<=', $value);
                        } elseif ($operator === '>' || $operator === 'gt') {
                            $q->$whereMethod($column, '>', $value);
                        } elseif ($operator === '<' || $operator === 'lt') {
                            $q->$whereMethod($column, '<', $value);
                        } elseif ($operator === '!=' || $operator === 'doesNotEqual') {
                            $q->$whereMethod($column, '!=', $value);
                        } else {
                            $q->$whereMethod($column, '=', $value);
                        }
                    } else {
                        // For unknown fields, handle operators
                        if ($operator === 'between') {
                            $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                            if (is_array($betweenValues) && count($betweenValues) === 2) {
                                $inner = $isOr ? 'orWhereBetween' : 'whereBetween';
                                $q->$inner($field, $betweenValues);
                            }
                        } elseif ($operator === 'notBetween') {
                            $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                            if (is_array($betweenValues) && count($betweenValues) === 2) {
                                $inner = $isOr ? 'orWhereNotBetween' : 'whereNotBetween';
                                $q->$inner($field, $betweenValues);
                            }
                        } else {
                            $q->$whereMethod($field, '=', $value);
                        }
                    }
                }
            }
        });
    }
    /**
     * Display the customs data management page.
     */
    public function index()
    {
        return Inertia::render('data/CustomsData');
    }

    /**
     * Get filtered customs data with pagination - OPTIMIZED TWO-PHASE APPROACH.
     */
    public function getData(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'nomordaftar' => 'nullable|numeric|digits_between:1,6',
            'kodejalur' => 'nullable|string|max:1',
            // Entity-based filters
            'namaimportir' => 'nullable|string|max:255',
            'namapenjual' => 'nullable|string|max:255',
            'namapengirim' => 'nullable|string|max:255',
            'namappjk' => 'nullable|string|max:255',
            'negaraasal' => 'nullable|string|max:2',
            // Goods-based filters
            'uraianbarang' => 'nullable|string|max:255',
            'hscode' => 'nullable|string|max:8',
            // Container-based filter
            'nomorkontainer' => 'nullable|string|max:255',
            // Port and transport filters
            'pelabuhan_muat' => 'nullable|string|max:6',
            'pelabuhan_transit' => 'nullable|string|max:6',
            'kode_tps' => 'nullable|string|max:255',
            'nama_pengangkut' => 'nullable|string|max:255',
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            // RESTRICTED: Only allow header column sorting
            'sort_by' => ['nullable', Rule::in(['nomordaftar', 'tanggaldaftar', 'kodejalur'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'query_json' => 'nullable|json',
            // Between operator support for legacy params
            'nomordaftar_not_between_min' => 'nullable|numeric',
            'nomordaftar_not_between_max' => 'nullable|numeric',
        ]);

        // PHASE 1: Get headers with basic filters only (FAST)
        $query = BC20Header::select([
            'idheader',        // needed for relationships
            'nomordaftar',     // PIB
            'tanggaldaftar',   // Tanggal
            'kodejalur'        // Jalur
        ]);

        // Apply header-level filters (indexed, fast)
        $this->applyHeaderFilters($query, $request);

        // Apply related filters as efficient subqueries (not expensive joins)
        $this->applyRelatedFiltersAsSubqueries($query, $request);

        // RESTRICTED SORTING: Only header columns allowed
        $this->applyHeaderSortingOnly($query, $request);

        // Paginate headers
        $perPage = $request->get('per_page', 20);
        $paginatedData = $query->paginate($perPage);
        $headerIds = $paginatedData->pluck('idheader')->toArray();

        // If no results, return early
        if (empty($headerIds)) {
            return response()->json($paginatedData);
        }

        // PHASE 2: Load ONLY display columns for visible rows (EFFICIENT)
        $entitiesData = $this->loadDisplayEntities($headerIds);
        $barangData = collect($this->loadDisplayBarang($headerIds))->keyBy('idheader');
        $kontainerData = $this->loadDisplayKontainer($headerIds);

        // Merge display data back into paginated results
        $paginatedData->getCollection()->transform(function ($header) use ($entitiesData, $barangData, $kontainerData) {
            $id = $header->idheader;

            // Add entity display columns (Nama Perusahaan, Nama PPJK, Nama Penjual)
            $entityRow = $entitiesData->get($id);
            $header->namaimportir = $entityRow?->namaimportir ?? null;
            $header->namappjk = $entityRow?->namappjk ?? null;
            $header->namapenjual = $entityRow?->namapenjual ?? null;

            // Add barang display columns (Barang count, HS, Uraian Barang)
            $barangRow = $barangData->get($id);
            $header->barang_count = $barangRow?->barang_count ?? 0;
            $header->hscode = $barangRow?->first_hscode ?? null;
            $header->uraianbarang = $barangRow?->first_uraian ?? null;

            // Add kontainer display columns (Kontainer count, TEUS sum)
            $kontainerRow = $kontainerData->get($id);
            $header->kontainer_count = $kontainerRow?->kontainer_count ?? 0;
            $header->teus_sum = $kontainerRow?->teus_sum ?? 0;

            return $header;
        });

        return response()->json($paginatedData);
    }

    /**
     * Apply header-level filters (fast, indexed filters only).
     */
    private function applyHeaderFilters($query, Request $request)
    {
        // Apply date range or default to today's date
        if ($request->filled('start_date') && $request->filled('end_date')) {
            // Use user-provided date range
            $query->dateRange($request->start_date, $request->end_date);
        } else {
            // Apply filters or default to today's date
            if ($request->filled('start_date') && $request->filled('end_date')) {
                // Use user-provided date range
                $query->dateRange($request->start_date, $request->end_date);
            } else {
                // Check if any meaningful filters are applied
                $hasFilters = $request->filled('nomordaftar') ||
                             $request->filled('kodejalur') ||
                             $request->filled('namaimportir') ||
                             $request->filled('namapenjual') ||
                             $request->filled('namapengirim') ||
                             $request->filled('namappjk') ||
                             $request->filled('negaraasal') ||
                             $request->filled('uraianbarang') ||
                             $request->filled('hscode') ||
                             $request->filled('nomorkontainer') ||
                             $request->filled('pelabuhan_muat') ||
                             $request->filled('pelabuhan_transit') ||
                             $request->filled('kode_tps') ||
                             $request->filled('nama_pengangkut');

                if (!$hasFilters) {
                    // No meaningful filters applied, default to today's data
                    $query->whereDate('tanggaldaftar', now()->toDateString());
                }
            }

        // Basic header filters (fast, indexed)
        if ($request->filled('nomordaftar')) {
            $query->byRegistrationNumber($request->nomordaftar);
        }

        if ($request->filled('kodejalur')) {
            $query->byCustomsRoute($request->kodejalur);
        }
    }

    /**
     * Apply related filters as efficient subqueries (not expensive joins).
     */
    private function applyRelatedFiltersAsSubqueries($query, Request $request)
    {
        // Entity-based filters using WHERE IN subqueries (much faster than whereHas)
        if ($request->filled('namaimportir')) {
            $subquery = DB::table('customs.bc20_entitas')
                ->select('idheader')
                ->where('kodeentitas', '1')
                ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->namaimportir . '%']);
            $query->whereIn('idheader', $subquery);
        }

        if ($request->filled('namappjk')) {
            $subquery = DB::table('customs.bc20_entitas')
                ->select('idheader')
                ->where('kodeentitas', '4')
                ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->namappjk . '%']);
            $query->whereIn('idheader', $subquery);
        }

        if ($request->filled('namapenjual')) {
            $subquery = DB::table('customs.bc20_entitas')
                ->select('idheader')
                ->where('kodeentitas', '10')
                ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->namapenjual . '%']);
            $query->whereIn('idheader', $subquery);
        }

        if ($request->filled('namapengirim')) {
            $subquery = DB::table('customs.bc20_entitas')
                ->select('idheader')
                ->where('kodeentitas', '9')
                ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->namapengirim . '%']);
            $query->whereIn('idheader', $subquery);
        }

        if ($request->filled('negaraasal')) {
            $subquery = DB::table('customs.bc20_entitas')
                ->select('idheader')
                ->where('kodeentitas', '9')
                ->whereRaw('UPPER(kodenegara) LIKE UPPER(?)', ['%' . $request->negaraasal . '%']);
            $query->whereIn('idheader', $subquery);
        }

        // Goods-based filters using subqueries
        if ($request->filled('uraianbarang')) {
            $subquery = DB::table('customs.bc20_barang')
                ->select('idheader')
                ->whereRaw('UPPER(uraian) LIKE UPPER(?)', ['%' . $request->uraianbarang . '%']);
            $query->whereIn('idheader', $subquery);
        }

        if ($request->filled('hscode')) {
            $subquery = DB::table('customs.bc20_barang')
                ->select('idheader')
                ->whereRaw('UPPER(postarif) LIKE UPPER(?)', [$request->hscode . '%']);
            $query->whereIn('idheader', $subquery);
        }

        // Container-based filter using subquery
        if ($request->filled('nomorkontainer')) {
            $subquery = DB::table('customs.bc20_kontainer')
                ->select('idheader')
                ->whereRaw('UPPER(nomorkontainer) LIKE UPPER(?)', [$request->nomorkontainer . '%']);
            $query->whereIn('idheader', $subquery);
        }

        // Port and transport filters using subqueries
        if ($request->filled('pelabuhan_muat')) {
            $subquery = DB::table('customs.bc20_data')
                ->select('idheader')
                ->whereRaw('UPPER(kodepelmuat) LIKE UPPER(?)', [$request->pelabuhan_muat . '%']);
            $query->whereIn('idheader', $subquery);
        }

        if ($request->filled('pelabuhan_transit')) {
            $subquery = DB::table('customs.bc20_data')
                ->select('idheader')
                ->whereRaw('UPPER(kodepeltransit) LIKE UPPER(?)', [$request->pelabuhan_transit . '%']);
            $query->whereIn('idheader', $subquery);
        }

        if ($request->filled('kode_tps')) {
            $subquery = DB::table('customs.bc20_data')
                ->select('idheader')
                ->whereRaw('UPPER(kodetps) LIKE UPPER(?)', ['%' . $request->kode_tps . '%']);
            $query->whereIn('idheader', $subquery);
        }

        if ($request->filled('nama_pengangkut')) {
            $subquery = DB::table('customs.bc20_pengangkut')
                ->select('idheader')
                ->whereRaw('UPPER(namapengangkut) LIKE UPPER(?)', ['%' . $request->nama_pengangkut . '%']);
            $query->whereIn('idheader', $subquery);
        }
    }

    /**
     * Apply sorting restricted to header columns only (fast).
     */
    private function applyHeaderSortingOnly($query, Request $request)
    {
        $sortBy = $request->get('sort_by', 'nomordaftar');
        $sortDirection = $request->get('sort_direction', 'asc');

        // ONLY allow header column sorting (no expensive joins)
        $allowedSorts = ['nomordaftar', 'tanggaldaftar', 'kodejalur'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            // Default fallback
            $query->orderBy('nomordaftar', 'asc');
        }
    }

    /**
     * Load entity display data (Nama Perusahaan, Nama PPJK, Nama Penjual) for visible rows only.
     */
    private function loadDisplayEntities(array $headerIds)
    {
        return DB::table('customs.bc20_entitas')
            ->select([
                'idheader',
                DB::raw("MAX(CASE WHEN kodeentitas = '1' THEN namaentitas END) as namaimportir"),
                DB::raw("MAX(CASE WHEN kodeentitas = '4' THEN namaentitas END) as namappjk"),
                DB::raw("MAX(CASE WHEN kodeentitas = '10' THEN namaentitas END) as namapenjual")
            ])
            ->whereIn('idheader', $headerIds)
            ->whereIn('kodeentitas', ['1', '4', '10'])
            ->groupBy('idheader')
            ->get()
            ->keyBy('idheader');
    }

    /**
     * Load barang display data (count, first HS, first uraian) for visible rows only.
     */
    private function loadDisplayBarang(array $headerIds)
    {
        return DB::select("
            SELECT
                idheader,
                COUNT(*) as barang_count,
                MIN(postarif) FILTER (WHERE rn = 1) as first_hscode,
                MIN(uraian) FILTER (WHERE rn = 1) as first_uraian
            FROM (
                SELECT
                    idheader,
                    postarif,
                    uraian,
                    ROW_NUMBER() OVER (PARTITION BY idheader ORDER BY seribarang) as rn
                FROM customs.bc20_barang
                WHERE idheader = ANY(?)
            ) ranked
            GROUP BY idheader
        ", [$headerIds]);
    }

    /**
     * Load kontainer display data (count, TEUS sum) for visible rows only.
     */
    private function loadDisplayKontainer(array $headerIds)
    {
        return DB::table('customs.bc20_kontainer')
            ->select([
                'idheader',
                DB::raw('COUNT(*) as kontainer_count'),
                DB::raw('COALESCE(SUM(teus), 0) as teus_sum')
            ])
            ->whereIn('idheader', $headerIds)
            ->groupBy('idheader')
            ->get()
            ->keyBy('idheader');
    }

    /**
     * Get detailed information for a specific customs record.
     */
    public function getDetail($idheader)
    {
        $header = BC20Header::with([
            'data',
            'barang',
            'dokumen',
            'entitas',
            'kontainer',
            'pengangkut',
            'pungutan'
        ])->find($idheader);

        if (!$header) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($header);
    }

    /**
     * Get autocomplete suggestions for registration numbers.
     */
    public function getRegistrationNumberSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = BC20Header::where('nomordaftar', 'like', $request->input('query') . '%')
            ->limit(10)
            ->pluck('nomordaftar')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }


    /**
     * Generate Excel export with multi-tab format based on selected sections.
     */
    private function generateExcelExport(Request $request, array $sections)
    {
        $query = $this->buildExportQuery($request, $sections);

        // Use multi-tab export with selected sections only
        $export = new \App\Exports\CustomsDataMultiTabExport($query, $sections);
        $filename = 'customs_data_multi_tab_' . date('Y-m-d_H-i-s') . '.xlsx';
        return $export->download($filename);
    }

    /**
     * Build export query with relationships based on selected sections.
     */
    private function buildExportQuery(Request $request, array $sections)
    {
        $query = BC20Header::query()
            ->select([
                'bc20_header.idheader',
                'bc20_header.nomordaftar',
                'bc20_header.tanggaldaftar',
                'bc20_header.kodejalur',
                'bc20_header.nomoraju'
            ]);

        // Only add kontainer/teus aggregation if 'basic' section is selected AND 'containers' section is NOT selected
        // (to avoid conflict between aggregated counts and relationship loading)
        if (in_array('basic', $sections) && !in_array('containers', $sections)) {
            $query->leftJoin(
                DB::raw('(
                    SELECT
                        bh.idheader,
                        COUNT(bk.nomorkontainer) AS kontainer,
                        SUM(
                            CASE bk.kodeukurankontainer
                                WHEN \'20\' THEN 1.0
                                WHEN \'40\' THEN 2.0
                                WHEN \'45\' THEN 2.25
                                WHEN \'60\' THEN 3.0
                                ELSE 0.0
                            END
                        ) AS teus
                    FROM customs.bc20_kontainer bk
                    JOIN customs.bc20_header bh ON bk.idheader = bh.idheader
                    GROUP BY bh.idheader
                ) as export_kontainer_agg'),
                'bc20_header.idheader', '=', 'export_kontainer_agg.idheader'
            )
            ->addSelect([
                'export_kontainer_agg.kontainer',
                'export_kontainer_agg.teus'
            ]);
        }

        // Load relationships based on selected sections
        $with = [];

        // Load entity data when general or basic section is selected
        if (in_array('general', $sections) || in_array('basic', $sections)) {
            $with['entitas'] = function($query) {
                $query->select('idheader', 'kodeentitas', 'namaentitas', 'nomoridentitas', 'alamatentitas', 'kodenegara', 'namanegara', 'kodestatus', 'kodejenisapi', 'nomorapi')
                      ->whereIn('kodeentitas', ['1', '4', '7', '9', '10']) // 1=Importir, 4=PPJK, 7=Pemilik, 9=Pengirim, 10=Penjual
                      ->orderBy('kodeentitas', 'asc');
            };
        }

        // Load data when values, bc11, or warehouse sections are selected
        if (in_array('values', $sections) || in_array('bc11', $sections) || in_array('warehouse', $sections)) {
            $with['data'] = function($query) {
                $query->select('idheader', 'netto', 'bruto', 'cif', 'ndpbm', 'kodevaluta', 'tanggaltiba', 'nomorbc11', 'tanggalbc11', 'posbc11', 'subposbc11', 'kodepelmuat', 'namapelabuhanmuat', 'kodepeltransit', 'namapelabuhantransit', 'kodetps', 'namatpswajib', 'kodekantor', 'namakantorpendek');
            };
        }

        // Load pengangkut when bc11 or warehouse sections are selected
        if (in_array('bc11', $sections) || in_array('warehouse', $sections)) {
            $with['pengangkut'] = function($query) {
                $query->select('idheader', 'namapengangkut', 'nomorpengangkut', 'kodebendera', 'namanegara');
            };
        }

        // Load barang when goods section is selected
        if (in_array('goods', $sections)) {
            $with['barang'] = function($query) {
                $query->select('idheader', 'seribarang', 'postarif', 'uraian', 'cif', 'jumlahsatuan', 'kodesatuanbarang', 'jumlahkemasan', 'kodejeniskemasan', 'namajeniskemasan')
                      ->orderBy('seribarang', 'asc');
            };
        }

        // Load dokumen when documents section is selected
        if (in_array('documents', $sections)) {
            $with['dokumen'] = function($query) {
                $query->select('idheader', 'seridokumen', 'namadokumen', 'nomordokumen', 'tanggaldokumen', 'namafasilitas', 'kodefasilitas')
                      ->orderBy('seridokumen', 'asc');
            };
        }

        // Always load kontainer relationship - needed for multiple sheets
        $with['kontainer'] = function($query) {
            $query->select('idheader', 'serikontainer', 'nomorkontainer', 'namaukurankontainer', 'namajeniskontainer', 'kodeukurankontainer')
                  ->orderBy('serikontainer', 'asc');
        };

        // Load pungutan when duties section is selected
        if (in_array('duties', $sections)) {
            $with['pungutan'] = function($query) {
                $query->select('idheader', 'keterangan', 'dibayar')
                      ->whereIn('keterangan', ['BM', 'PPH', 'PPN']);
            };
        }

        $query->with($with);

        // Apply all the same filters as the main getData method
        $this->applyFilters($query, $request);
        $this->applySorting($query, $request);

        return $query;
    }

    /**
     * Apply filters to the query (extracted from repeated code).
     */
    private function applyFilters($query, Request $request)
    {
        // Apply date range or default filters
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        } else {
            $hasFilters = $request->filled('nomordaftar') || $request->filled('kodejalur') ||
                         $request->filled('namaimportir') || $request->filled('namapenjual') ||
                         $request->filled('namapengirim') || $request->filled('namappjk') ||
                         $request->filled('negaraasal') || $request->filled('uraianbarang') ||
                         $request->filled('hscode') || $request->filled('nomorkontainer') ||
                         $request->filled('pelabuhan_muat') || $request->filled('pelabuhan_transit') ||
                         $request->filled('kode_tps') || $request->filled('nama_pengangkut');

            if (!$hasFilters) {
                $query->whereDate('tanggaldaftar', now()->toDateString());
            }
        }

        // Apply individual filters
        if ($request->filled('nomordaftar')) {
            $query->byRegistrationNumber($request->nomordaftar);
        }
        if ($request->filled('kodejalur')) {
            $query->byCustomsRoute($request->kodejalur);
        }
        if ($request->filled('namaimportir')) {
            $query->whereHas('entitas', function($q) use ($request) {
                $q->where('kodeentitas', '1')
                  ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->namaimportir . '%']);
            });
        }
        if ($request->filled('namapenjual')) {
            $query->whereHas('entitas', function($q) use ($request) {
                $q->where('kodeentitas', '10')
                  ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->namapenjual . '%']);
            });
        }
        if ($request->filled('namapengirim')) {
            $query->whereHas('entitas', function($q) use ($request) {
                $q->where('kodeentitas', '9')
                  ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->namapengirim . '%']);
            });
        }
        if ($request->filled('namappjk')) {
            $query->whereHas('entitas', function($q) use ($request) {
                $q->where('kodeentitas', '4')
                  ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->namappjk . '%']);
            });
        }
        if ($request->filled('negaraasal')) {
            $query->whereHas('entitas', function($q) use ($request) {
                $q->where('kodeentitas', '9')
                  ->whereRaw('UPPER(kodenegara) LIKE UPPER(?)', ['%' . $request->negaraasal . '%']);
            });
        }
        if ($request->filled('uraianbarang')) {
            $query->whereHas('barang', function($q) use ($request) {
                $q->whereRaw('UPPER(uraian) LIKE UPPER(?)', ['%' . $request->uraianbarang . '%']);
            });
        }
        if ($request->filled('hscode')) {
            $query->whereHas('barang', function($q) use ($request) {
                $q->whereRaw('UPPER(postarif) LIKE UPPER(?)', [$request->hscode . '%']);
            });
        }
        if ($request->filled('nomorkontainer')) {
            $query->whereHas('kontainer', function($q) use ($request) {
                $q->whereRaw('UPPER(nomorkontainer) LIKE UPPER(?)', [$request->nomorkontainer . '%']);
            });
        }
        if ($request->filled('pelabuhan_muat')) {
            $query->whereHas('data', function($q) use ($request) {
                $q->whereRaw('UPPER(kodepelmuat) LIKE UPPER(?)', [$request->pelabuhan_muat . '%']);
            });
        }
        if ($request->filled('pelabuhan_transit')) {
            $query->whereHas('data', function($q) use ($request) {
                $q->whereRaw('UPPER(kodepeltransit) LIKE UPPER(?)', [$request->pelabuhan_transit . '%']);
            });
        }
        if ($request->filled('kode_tps')) {
            $query->whereHas('data', function($q) use ($request) {
                $q->whereRaw('UPPER(kodetps) LIKE UPPER(?)', ['%' . $request->kode_tps . '%']);
            });
        }
        if ($request->filled('nama_pengangkut')) {
            $query->whereHas('pengangkut', function($q) use ($request) {
                $q->whereRaw('UPPER(namapengangkut) LIKE UPPER(?)', ['%' . $request->nama_pengangkut . '%']);
            });
        }

        // Handle between/notBetween operators for legacy URL parameters
        if ($request->filled('nomordaftar_not_between_min') && $request->filled('nomordaftar_not_between_max')) {
            $query->whereNotBetween('bc20_header.nomordaftar', [
                $request->nomordaftar_not_between_min,
                $request->nomordaftar_not_between_max
            ]);
        }
    }

    /**
     * Apply sorting to the query (extracted from repeated code).
     */
    private function applySorting($query, Request $request)
    {
        $sortBy = $request->get('sort_by', 'nomordaftar');
        $sortDirection = $request->get('sort_direction', 'asc');

        switch ($sortBy) {
            case 'nomordaftar':
            case 'tanggaldaftar':
            case 'kodejalur':
                $query->orderBy($sortBy, $sortDirection);
                break;
            case 'namaimportir':
                $query->leftJoin('customs.bc20_entitas as sort_importir', function($join) {
                    $join->on('bc20_header.idheader', '=', 'sort_importir.idheader')
                         ->where('sort_importir.kodeentitas', '=', '1');
                })
                ->orderBy('sort_importir.namaentitas', $sortDirection);
                break;
            case 'namappjk':
                $query->leftJoin('customs.bc20_entitas as sort_ppjk', function($join) {
                    $join->on('bc20_header.idheader', '=', 'sort_ppjk.idheader')
                         ->where('sort_ppjk.kodeentitas', '=', '4');
                })
                ->orderBy('sort_ppjk.namaentitas', $sortDirection);
                break;
            case 'namapenjual':
                $query->leftJoin('customs.bc20_entitas as sort_penjual', function($join) {
                    $join->on('bc20_header.idheader', '=', 'sort_penjual.idheader')
                         ->where('sort_penjual.kodeentitas', '=', '10');
                })
                ->orderBy('sort_penjual.namaentitas', $sortDirection);
                break;
            case 'kontainer':
                $query->orderBy('export_kontainer_agg.kontainer', $sortDirection);
                break;
            case 'teus':
                $query->orderBy('export_kontainer_agg.teus', $sortDirection);
                break;
            case 'hscode':
                $query->leftJoin('customs.bc20_barang as sort_barang_hs', function($join) {
                    $join->on('bc20_header.idheader', '=', 'sort_barang_hs.idheader')
                         ->where('sort_barang_hs.seribarang', '=', 1);
                })
                ->orderBy('sort_barang_hs.postarif', $sortDirection);
                break;
            case 'uraianbarang':
                $query->leftJoin('customs.bc20_barang as sort_barang_uraian', function($join) {
                    $join->on('bc20_header.idheader', '=', 'sort_barang_uraian.idheader')
                         ->where('sort_barang_uraian.seribarang', '=', 1);
                })
                ->orderBy('sort_barang_uraian.uraian', $sortDirection);
                break;
            default:
                $query->orderBy('nomordaftar', 'asc');
        }
    }

    /**
     * Get autocomplete suggestions for company names.
     */
    public function getCompanyNameSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = BC20Header::where('namaperusahaan', 'like', '%' . $request->input('query') . '%')
            ->limit(10)
            ->pluck('namaperusahaan')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for office names.
     */
    public function getOfficeNameSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = BC20Header::where('namakantor', 'like', '%' . $request->input('query') . '%')
            ->limit(10)
            ->pluck('namakantor')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get dropdown options for document codes.
     */
    public function getDocumentCodes()
    {
        $codes = BC20Header::select('kodedokumen', 'namadokumen')
            ->whereNotNull('kodedokumen')
            ->whereNotNull('namadokumen')
            ->groupBy('kodedokumen', 'namadokumen')
            ->orderBy('kodedokumen')
            ->get()
            ->map(function ($item) {
                return [
                    'value' => $item->kodedokumen,
                    'label' => $item->kodedokumen . ' - ' . $item->namadokumen,
                ];
            });

        return response()->json($codes);
    }

    /**
     * Get dropdown options for process codes.
     */
    public function getProcessCodes()
    {
        $codes = BC20Header::select('kodeproses', 'namaproses')
            ->whereNotNull('kodeproses')
            ->whereNotNull('namaproses')
            ->groupBy('kodeproses', 'namaproses')
            ->orderBy('kodeproses')
            ->get()
            ->map(function ($item) {
                return [
                    'value' => $item->kodeproses,
                    'label' => $item->kodeproses . ' - ' . $item->namaproses,
                ];
            });

        return response()->json($codes);
    }

    /**
     * Get dropdown options for customs routes.
     */
    public function getCustomsRoutes()
    {
        $routes = [
            ['value' => 'H', 'label' => 'H - Hijau (Green Lane)'],
            ['value' => 'M', 'label' => 'M - Merah (Red Lane)'],
            ['value' => 'K', 'label' => 'K - Kuning (Yellow Lane)'],
            ['value' => 'P', 'label' => 'P - Prioritas (Priority Lane)'],
        ];

        return response()->json($routes);
    }

    /**
     * Get dropdown options for response statuses.
     */
    public function getResponseStatuses()
    {
        $statuses = BC20Header::select('namarespon')
            ->whereNotNull('namarespon')
            ->groupBy('namarespon')
            ->orderBy('namarespon')
            ->pluck('namarespon')
            ->map(function ($item) {
                return [
                    'value' => $item,
                    'label' => $item,
                ];
            });

        return response()->json($statuses);
    }


    /**
     * Export customs data to Excel with configurable sections.
     */
    public function exportExcel(Request $request)
    {
        // Validate including the new sections parameter
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'nomordaftar' => 'nullable|numeric|digits_between:1,6',
            'kodejalur' => 'nullable|string|max:1',
            'namaimportir' => 'nullable|string|max:255',
            'namapenjual' => 'nullable|string|max:255',
            'namapengirim' => 'nullable|string|max:255',
            'namappjk' => 'nullable|string|max:255',
            'negaraasal' => 'nullable|string|max:2',
            'uraianbarang' => 'nullable|string|max:255',
            'hscode' => 'nullable|string|max:8',
            'nomorkontainer' => 'nullable|string|max:255',
            'pelabuhan_muat' => 'nullable|string|max:6',
            'pelabuhan_transit' => 'nullable|string|max:6',
            'kode_tps' => 'nullable|string|max:255',
            'nama_pengangkut' => 'nullable|string|max:255',
            'sort_by' => ['nullable', Rule::in(['nomordaftar', 'tanggaldaftar', 'kodejalur', 'namaimportir', 'namappjk', 'namapenjual', 'kontainer', 'teus', 'hscode', 'uraianbarang'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'sections' => 'nullable|string', // Comma-separated list of sections
        ]);

        // Parse selected sections
        $sections = $request->filled('sections') ? explode(',', $request->sections) : ['basic'];

        return $this->generateExcelExport($request, $sections);
    }


    /**
     * Get autocomplete suggestions for importir names.
     */
    public function getImportirSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Entitas::where('kodeentitas', '1')
            ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->limit(10)
            ->pluck('namaentitas')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for penjual names.
     */
    public function getPenjualSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Entitas::where('kodeentitas', '10')
            ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->limit(10)
            ->pluck('namaentitas')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for pengirim names.
     */
    public function getPengirimSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Entitas::where('kodeentitas', '9')
            ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->limit(10)
            ->pluck('namaentitas')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for PPJK names.
     */
    public function getPpjkSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Entitas::where('kodeentitas', '4')
            ->whereRaw('UPPER(namaentitas) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->limit(10)
            ->pluck('namaentitas')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for negara asal.
     */
    public function getNegaraAsalSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Entitas::where('kodeentitas', '9')
            ->whereRaw('UPPER(kodenegara) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->limit(10)
            ->pluck('kodenegara')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for uraian barang.
     */
    public function getUraianBarangSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Barang::whereRaw('UPPER(uraian) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->limit(10)
            ->pluck('uraian')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for HS code.
     */
    public function getHsCodeSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Barang::whereRaw('UPPER(postarif) LIKE UPPER(?)', [$request->input('query') . '%'])
            ->limit(10)
            ->pluck('postarif')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for nomor kontainer.
     */
    public function getNomorKontainerSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Kontainer::whereRaw('UPPER(nomorkontainer) LIKE UPPER(?)', [$request->input('query') . '%'])
            ->limit(10)
            ->pluck('nomorkontainer')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for pelabuhan muat (port of loading).
     */
    public function getPelabuhanMuatSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Data::whereRaw('UPPER(kodepelmuat) LIKE UPPER(?)', [$request->input('query') . '%'])
            ->whereNotNull('kodepelmuat')
            ->where('kodepelmuat', '!=', '')
            ->limit(10)
            ->pluck('kodepelmuat')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for pelabuhan transit (transit port).
     */
    public function getPelabuhanTransitSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Data::whereRaw('UPPER(kodepeltransit) LIKE UPPER(?)', [$request->input('query') . '%'])
            ->whereNotNull('kodepeltransit')
            ->where('kodepeltransit', '!=', '')
            ->limit(10)
            ->pluck('kodepeltransit')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Get autocomplete suggestions for kode TPS (TPS code).
     */
    public function getKodeTpsSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Data::whereRaw('UPPER(kodetps) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->whereNotNull('kodetps')
            ->where('kodetps', '!=', '')
            ->limit(10)
            ->pluck('kodetps')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Export complete customs data with all sections included (Excel only).
     * This is a shortcut method that exports all available data sections.
     */
    public function exportCompleteData(Request $request)
    {
        // Validate basic filters
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'nomordaftar' => 'nullable|numeric|digits_between:1,6',
            'kodejalur' => 'nullable|string|max:1'
        ]);

        // Force all sections for complete export
        $request->merge([
            'sections' => 'general,values,bc11,warehouse,goods,documents,containers,duties'
        ]);

        // Always export as Excel (multi-tab format)
        return $this->exportExcel($request);
    }

    /**
     * Get autocomplete suggestions for nama pengangkut (carrier name).
     */
    public function getNamaPengangkutSuggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1|max:255',
        ]);

        $suggestions = \App\Models\BC20\BC20Pengangkut::whereRaw('UPPER(namapengangkut) LIKE UPPER(?)', ['%' . $request->input('query') . '%'])
            ->whereNotNull('namapengangkut')
            ->where('namapengangkut', '!=', '')
            ->limit(10)
            ->pluck('namapengangkut')
            ->unique()
            ->values();

        return response()->json($suggestions);
    }

    /**
     * Download PDF for a specific customs document via proxy.
     */
    public function downloadPdf($idheader)
    {
        try {
            // Get the BC20 header to extract nomor daftar and tanggal
            $header = BC20Header::where('idheader', $idheader)->first();

            if (!$header) {
                return response()->json(['error' => 'Header not found'], 404);
            }

            $client = new \GuzzleHttp\Client();

            $response = $client->get("https://apis-gw.beacukai.go.id/v2/report-service/formulir/20/{$idheader}", [
                'headers' => [
                    'accept' => 'application/json, text/plain, */*',
                    'accept-encoding' => 'gzip, deflate, br, zstd',
                    'beacukai-api-key' => '6222a75e-1dbb-493e-9461-27f721097e9c',
                    'host' => 'apis-gw.beacukai.go.id'
                ]
            ]);

            $pdfContent = $response->getBody()->getContents();

            // Format the date properly (YYYY-MM-DD)
            $date = \Carbon\Carbon::parse($header->tanggaldaftar)->format('Y-m-d');
            $filename = "{$header->nomordaftar}_{$date}.pdf";

            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename={$filename}",
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to download PDF: ' . $e->getMessage()], 500);
        }
    }
}
