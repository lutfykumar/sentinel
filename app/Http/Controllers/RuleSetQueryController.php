<?php

namespace App\Http\Controllers;

use App\Models\BC20\BC20Header;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class RuleSetQueryController extends Controller
{
    /**
     * Apply generic field operator for relationship queries in RuleSet context.
     * 
     * Supported operators:
     * - Equality: =, equals, !=, doesNotEqual
     * - Text: contains, like, beginsWith, endsWith, doesNotContain, notContains, notBeginsWith, notEndsWith
     * - Numeric: >, >=, <, <=, gt, gte, lt, lte
     * - Range: between, notBetween
     * - Lists: in, notIn
     * - Null/Empty checks: null, notNull, isEmpty, isNotEmpty
     */
    private function applyGenericFieldOperator($query, $field, $operator, $value, $textFields = [], $numericFields = [])
    {
        // Cast numeric values for numeric fields
        if (in_array($field, $numericFields) && is_string($value) && is_numeric($value)) {
            $value = (float) $value;
            Log::info("RULESET_DEBUG: Field '{$field}' operator '{$operator}' value {$value} (converted to float)");
        } else {
            Log::info("RULESET_DEBUG: Field '{$field}' operator '{$operator}' value " . json_encode($value));
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
            
            case 'in':
                // Handle IN operator - value can be array or comma-separated string
                $inValues = is_array($value) ? $value : array_map('trim', explode(',', $value));
                if (!empty($inValues)) {
                    if (in_array($field, $textFields)) {
                        // For text fields, use case-insensitive comparison
                        $query->whereIn(DB::raw('UPPER(' . $field . ')'), array_map('strtoupper', $inValues));
                    } else {
                        $query->whereIn($field, $inValues);
                    }
                }
                break;
            
            case 'notIn':
                // Handle NOT IN operator - value can be array or comma-separated string
                $notInValues = is_array($value) ? $value : array_map('trim', explode(',', $value));
                if (!empty($notInValues)) {
                    if (in_array($field, $textFields)) {
                        // For text fields, use case-insensitive comparison
                        $query->whereNotIn(DB::raw('UPPER(' . $field . ')'), array_map('strtoupper', $notInValues));
                    } else {
                        $query->whereNotIn($field, $notInValues);
                    }
                }
                break;
            
            case 'isEmpty':
                // Check if field is null or empty string
                $query->where(function($q) use ($field) {
                    $q->whereNull($field)->orWhere($field, '');
                });
                break;
            
            case 'isNotEmpty':
                // Check if field is not null and not empty string
                $query->whereNotNull($field)->where($field, '!=', '');
                break;
            
            case 'doesNotContain':
            case 'notContains':
                // NOT LIKE operator
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') NOT LIKE UPPER(?)', ['%' . $value . '%']);
                } else {
                    $query->where($field, 'NOT LIKE', '%' . $value . '%');
                }
                break;
            
            case 'notBeginsWith':
                // Does not start with
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') NOT LIKE UPPER(?)', [$value . '%']);
                } else {
                    $query->where($field, 'NOT LIKE', $value . '%');
                }
                break;
            
            case 'notEndsWith':
                // Does not end with
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') NOT LIKE UPPER(?)', ['%' . $value]);
                } else {
                    $query->where($field, 'NOT LIKE', '%' . $value);
                }
                break;
            
            default:
                // Default to equals for unknown operators
                if (in_array($field, $textFields)) {
                    $query->whereRaw('UPPER(' . $field . ') = UPPER(?)', [$value]);
                } else {
                    $query->where($field, '=', $value);
                }
        }
    }
    
    /**
     * Parse between operator values from string to array.
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
     * Apply react-querybuilder JSON to the Eloquent query, optimized for RuleSet queries.
     * CRITICAL: Ensures all data field conditions apply to the SAME data record.
     */
    protected function applyQueryBuilderJson($builder, array $group, $parentCombinator = 'and')
    {
        $combinator = $group['combinator'] ?? 'and';
        $rules = $group['rules'] ?? [];

        $methodGroup = $parentCombinator === 'or' ? 'orWhere' : 'where';

        // Group data field conditions to ensure they apply to the same data record
        $dataFields = [];
        $nonDataFields = [];
        
        foreach ($rules as $rule) {
            if (isset($rule['rules'])) {
                // Nested group - handle separately
                $nonDataFields[] = $rule;
            } else {
                $field = $rule['field'] ?? '';
                // Group data fields and direct port fields together
                // All these fields belong to the bc20_data table
                $dataTableFields = [
                    'kodepelmuat', 'namapelabuhanmuat', 'kodepeltransit', 'namapelabuhantransit', 
                    'kodetps', 'namatpswajib', 'kodekantor', 'namakantorpendek', 'kodevaluta',
                    'netto', 'bruto', 'cif', 'ndpbm', 'nilaipabean', 'fob', 'freight', 'asuransi', 'volume'
                ];
                
                if (strpos($field, 'data.') === 0 || in_array($field, $dataTableFields)) {
                    $dataFields[] = $rule;
                } else {
                    $nonDataFields[] = $rule;
                }
            }
        }

        $builder->$methodGroup(function($q) use ($dataFields, $nonDataFields, $combinator, $parentCombinator) {
            $isOr = ($combinator === 'or');
            $whereMethod = $isOr ? 'orWhere' : 'where';
            
            // Handle all data fields in a single whereHas to ensure same record
            if (!empty($dataFields)) {
                $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
                $q->$hasMethod('data', function($qc) use ($dataFields, $combinator) {
                    $dataIsOr = ($combinator === 'or');
                    $dataWhereMethod = $dataIsOr ? 'orWhere' : 'where';
                    
                    foreach ($dataFields as $rule) {
                        $field = $rule['field'] ?? '';
                        $operator = $rule['operator'] ?? '=';
                        $value = $rule['value'] ?? null;

                        // Skip if no value provided (except for operators that don't need values)
                        if (($value === null || $value === '') && !in_array($operator, ['null', 'notNull', 'isEmpty', 'isNotEmpty'])) {
                            continue;
                        }

                        // Convert data field references
                        $dataTableFields = [
                            'kodepelmuat', 'namapelabuhanmuat', 'kodepeltransit', 'namapelabuhantransit', 
                            'kodetps', 'namatpswajib', 'kodekantor', 'namakantorpendek', 'kodevaluta',
                            'netto', 'bruto', 'cif', 'ndpbm', 'nilaipabean', 'fob', 'freight', 'asuransi', 'volume'
                        ];
                        
                        if (in_array($field, $dataTableFields)) {
                            $field = $field; // Use as-is since we're already in data context
                        } else {
                            $field = str_replace('data.', '', $field); // Remove data. prefix
                        }
                        
                        $textFields = ['kodepelmuat', 'namapelabuhanmuat', 'kodepeltransit', 'namapelabuhantransit', 'kodetps', 'namatpswajib', 'kodekantor', 'namakantorpendek', 'kodevaluta'];
                        $numericFields = ['netto', 'bruto', 'cif', 'ndpbm', 'nilaipabean', 'fob', 'freight', 'asuransi', 'volume'];
                        
                        Log::info("RULESET_DEBUG: Processing data field '{$field}' with operator '{$operator}' and value: " . json_encode($value));
                        
                        // Apply condition within the same data record context
                        if ($dataIsOr && count($dataFields) > 1) {
                            $qc->orWhere(function($subQ) use ($field, $operator, $value, $textFields, $numericFields) {
                                $this->applyGenericFieldOperator($subQ, $field, $operator, $value, $textFields, $numericFields);
                            });
                        } else {
                            $this->applyGenericFieldOperator($qc, $field, $operator, $value, $textFields, $numericFields);
                        }
                    }
                });
            }
            
            // Handle non-data fields normally
            foreach ($nonDataFields as $rule) {
                if (isset($rule['rules'])) {
                    // Nested group
                    $this->applyQueryBuilderJson($q, $rule, $combinator);
                    continue;
                }

                $field = $rule['field'] ?? '';
                $operator = $rule['operator'] ?? '=';
                $value = $rule['value'] ?? null;

                // Skip if no value provided (except for operators that don't need values)
                if (($value === null || $value === '') && !in_array($operator, ['null', 'notNull', 'isEmpty', 'isNotEmpty'])) {
                    continue;
                }

                // Handle specific field types for RuleSet queries
                if ($field === 'tanggaldaftar') {
                    // Special handling needed for date fields (uses DATE() function)
                    $this->handleTanggalDaftarField($q, $operator, $value, $whereMethod, $isOr);
                } elseif (in_array($field, ['nomordaftar', 'kodejalur', 'nomoraju'])) {
                    // Direct header fields - use generic handling
                    $fullFieldName = 'bc20_header.' . $field;
                    $textFields = [$fullFieldName];  // Map full field name for text operations
                    $numericFields = [];
                    $this->applyGenericFieldOperator($q, $fullFieldName, $operator, $value, $textFields, $numericFields);
                } elseif (strpos($field, 'barang.') === 0) {
                    $this->handleBarangField($q, $field, $operator, $value, $isOr);
                } elseif (strpos($field, 'kontainer.') === 0) {
                    $this->handleKontainerField($q, $field, $operator, $value, $isOr);
                } elseif (strpos($field, 'importir.') === 0) {
                    $this->handleEntitasField($q, $field, $operator, $value, $isOr, '1');
                } elseif (strpos($field, 'ppjk.') === 0) {
                    $this->handleEntitasField($q, $field, $operator, $value, $isOr, '4');
                } elseif (strpos($field, 'penjual.') === 0) {
                    $this->handleEntitasField($q, $field, $operator, $value, $isOr, '10');
                } elseif (strpos($field, 'pengirim.') === 0) {
                    $this->handleEntitasField($q, $field, $operator, $value, $isOr, '9');
                } elseif (strpos($field, 'pemilik.') === 0) {
                    $this->handleEntitasField($q, $field, $operator, $value, $isOr, '7');
                } elseif (strpos($field, 'pengangkut.') === 0) {
                    $this->handlePengangkutField($q, $field, $operator, $value, $isOr);
                } elseif (strpos($field, 'dokumen.') === 0) {
                    $this->handleDokumenField($q, $field, $operator, $value, $isOr);
                } elseif (strpos($field, 'pungutan.') === 0) {
                    $this->handlePungutanField($q, $field, $operator, $value, $isOr);
                } elseif (strpos($field, 'kemasan.') === 0) {
                    $this->handleKemasanField($q, $field, $operator, $value, $isOr);
                } elseif (strpos($field, 'calculated.') === 0) {
                    $this->handleCalculatedField($q, $field, $operator, $value, $isOr);
                } else {
                    // Handle direct header fields
                    $this->handleHeaderField($q, $field, $operator, $value, $whereMethod);
                }
            }
        });
    }


    /**
     * Handle tanggaldaftar field queries
     */
    private function handleTanggalDaftarField($q, $operator, $value, $whereMethod, $isOr)
    {
        switch ($operator) {
            case '=':
            case 'equals':
                $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '=', $value);
                break;
            case '!=':
            case 'doesNotEqual':
                $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '!=', $value);
                break;
            case '>=':
            case 'gte':
                $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '>=', $value);
                break;
            case '<=':
            case 'lte':
                $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '<=', $value);
                break;
            case '>':
            case 'gt':
                $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '>', $value);
                break;
            case '<':
            case 'lt':
                $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '<', $value);
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
            case 'in':
                $inValues = is_array($value) ? $value : array_map('trim', explode(',', $value));
                if (!empty($inValues)) {
                    $q->whereIn(DB::raw('DATE(bc20_header.tanggaldaftar)'), $inValues);
                }
                break;
            case 'notIn':
                $notInValues = is_array($value) ? $value : array_map('trim', explode(',', $value));
                if (!empty($notInValues)) {
                    $q->whereNotIn(DB::raw('DATE(bc20_header.tanggaldaftar)'), $notInValues);
                }
                break;
            case 'null':
                $q->whereNull('bc20_header.tanggaldaftar');
                break;
            case 'notNull':
                $q->whereNotNull('bc20_header.tanggaldaftar');
                break;
            default:
                $q->$whereMethod(DB::raw('DATE(bc20_header.tanggaldaftar)'), '=', $value);
        }
    }

    /**
     * Handle data.* field queries (bruto, netto, cif, etc.)
     */
    private function handleDataField($q, $field, $operator, $value, $isOr)
    {
        $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
        $q->$hasMethod('data', function($qc) use ($value, $operator, $field) {
            $subField = str_replace('data.', '', $field);
            $textFields = ['kodepelmuat', 'namapelabuhanmuat', 'kodepeltransit', 'namapelabuhantransit', 'kodetps', 'namatpswajib', 'kodekantor', 'namakantorpendek', 'kodevaluta'];
            $numericFields = ['netto', 'bruto', 'cif', 'ndpbm', 'nilaipabean', 'fob', 'freight', 'asuransi', 'volume'];
            $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
        });
    }

    /**
     * Handle barang.* field queries
     */
    private function handleBarangField($q, $field, $operator, $value, $isOr)
    {
        $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
        $q->$hasMethod('barang', function($qc) use ($value, $operator, $field) {
            $subField = str_replace('barang.', '', $field);
            $textFields = ['postarif', 'uraian', 'kodebarang', 'kodesatuanbarang', 'namasatuanbarang'];
            $numericFields = ['jumlahsatuan', 'cif', 'fob', 'freight', 'asuransi', 'netto', 'bruto', 'volume', 'seribarang', 'jumlahkemasan'];
            $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
        });
    }

    /**
     * Handle kontainer.* field queries
     */
    private function handleKontainerField($q, $field, $operator, $value, $isOr)
    {
        $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
        $q->$hasMethod('kontainer', function($qc) use ($value, $operator, $field) {
            $subField = str_replace('kontainer.', '', $field);
            $textFields = ['nomorkontainer', 'namaukurankontainer', 'namajeniskontainer'];
            $numericFields = ['serikontainer'];
            $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
        });
    }

    /**
     * Handle entitas field queries (importir, ppjk, penjual, pengirim, pemilik)
     */
    private function handleEntitasField($q, $field, $operator, $value, $isOr, $kodeentitas)
    {
        $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
        $q->$hasMethod('entitas', function($qc) use ($value, $operator, $field, $kodeentitas) {
            $qc->where('kodeentitas', $kodeentitas);
            $subField = preg_replace('/^(importir|ppjk|penjual|pengirim|pemilik)\./', '', $field);
            $textFields = ['namaentitas', 'alamatentitas', 'namanegara', 'kodenegara'];
            $numericFields = [];
            $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
        });
    }

    /**
     * Handle pengangkut.* field queries
     */
    private function handlePengangkutField($q, $field, $operator, $value, $isOr)
    {
        $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
        $q->$hasMethod('pengangkut', function($qc) use ($value, $operator, $field) {
            $subField = str_replace('pengangkut.', '', $field);
            $textFields = ['namapengangkut', 'nomorpengangkut', 'kodebendera', 'namanegara'];
            $numericFields = [];
            $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
        });
    }

    /**
     * Handle dokumen.* field queries
     */
    private function handleDokumenField($q, $field, $operator, $value, $isOr)
    {
        $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
        $q->$hasMethod('dokumen', function($qc) use ($value, $operator, $field) {
            $subField = str_replace('dokumen.', '', $field);
            $textFields = ['namadokumen', 'nomordokumen', 'namafasilitas', 'kodefasilitas'];
            $numericFields = ['seridokumen'];
            $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
        });
    }

    /**
     * Handle pungutan.* field queries
     */
    private function handlePungutanField($q, $field, $operator, $value, $isOr)
    {
        $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
        $q->$hasMethod('pungutan', function($qc) use ($value, $operator, $field) {
            $subField = str_replace('pungutan.', '', $field);
            $textFields = ['keterangan'];
            $numericFields = ['dibayar'];
            $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
        });
    }

    /**
     * Handle kemasan.* field queries
     */
    private function handleKemasanField($q, $field, $operator, $value, $isOr)
    {
        $hasMethod = $isOr ? 'orWhereHas' : 'whereHas';
        $q->$hasMethod('kemasan', function($qc) use ($value, $operator, $field) {
            $subField = str_replace('kemasan.', '', $field);
            $textFields = ['kodejeniskemasan', 'namakemasan'];
            $numericFields = ['jumlahkemasan', 'serikemasan'];
            $this->applyGenericFieldOperator($qc, $subField, $operator, $value, $textFields, $numericFields);
        });
    }

    /**
     * Handle calculated field queries
     * 
     * This method supports computed fields that combine data from multiple tables.
     * Currently supports:
     * - calculated.gross_weight_per_teus: Calculates bruto weight divided by total TEUS
     *   Formula: COALESCE(bc20_data.bruto, 0) / COALESCE(teus_calculation, 1)
     *   Where teus_calculation is the sum of container sizes converted to TEUS units:
     *   - 20ft container = 1.0 TEUS
     *   - 40ft container = 2.0 TEUS  
     *   - 45ft container = 2.25 TEUS
     *   - 60ft container = 3.0 TEUS
     */
    private function handleCalculatedField($q, $field, $operator, $value, $isOr)
    {
        $whereMethod = $isOr ? 'orWhereRaw' : 'whereRaw';
        
        Log::info("RULESET_DEBUG: Processing calculated field '{$field}' with operator '{$operator}' and value: " . json_encode($value));
        
        $calculatedExpression = null;
        
        if ($field === 'calculated.gross_weight_per_teus') {
            // Define the calculated field expression
            $calculatedExpression = '(
                SELECT 
                    CASE 
                        WHEN COALESCE(kontainer_calc.teus, 0) > 0 
                        THEN COALESCE(data_calc.bruto, 0) / kontainer_calc.teus
                        ELSE 0
                    END
                FROM customs.bc20_data data_calc
                LEFT JOIN (
                    SELECT 
                        bh_calc.idheader,
                        SUM(
                            CASE bk_calc.kodeukurankontainer
                                WHEN \'20\' THEN 1.0
                                WHEN \'40\' THEN 2.0
                                WHEN \'45\' THEN 2.25
                                WHEN \'60\' THEN 3.0
                                ELSE 0.0
                            END
                        ) AS teus
                    FROM customs.bc20_kontainer bk_calc
                    JOIN customs.bc20_header bh_calc ON bk_calc.idheader = bh_calc.idheader
                    GROUP BY bh_calc.idheader
                ) as kontainer_calc ON data_calc.idheader = kontainer_calc.idheader
                WHERE data_calc.idheader = bc20_header.idheader
                LIMIT 1
            )';
        } elseif ($field === 'calculated.items_count') {
            // Define the calculated field expression for items count
            $calculatedExpression = '(
                SELECT 
                    COUNT(bb_calc.idbarang)
                FROM customs.bc20_barang bb_calc
                WHERE bb_calc.idheader = bc20_header.idheader
            )';
        } elseif ($field === 'calculated.total_paid') {
            // Define the calculated field expression for total paid (total bayar)
            $calculatedExpression = '(
                SELECT 
                    COALESCE(SUM(bp_calc.dibayar), 0)
                FROM customs.bc20_pungutan bp_calc
                WHERE bp_calc.idheader = bc20_header.idheader
            )';
        } else {
            // Unknown calculated field - log warning and skip
            Log::warning("RULESET_DEBUG: Unknown calculated field '{$field}' - skipping");
            return;
        }
        
        // Ensure we have a valid calculated expression
        if (!$calculatedExpression) {
            Log::error("RULESET_DEBUG: No calculated expression defined for field '{$field}'");
            return;
        }
            
        // Apply the operator directly using whereRaw (common for all calculated fields)
        switch ($operator) {
            case '=':
            case 'equals':
                $q->$whereMethod($calculatedExpression . ' = ?', [$value]);
                break;
            case '>=':
            case 'gte':
                $q->$whereMethod($calculatedExpression . ' >= ?', [$value]);
                break;
            case '<=':
            case 'lte':
                $q->$whereMethod($calculatedExpression . ' <= ?', [$value]);
                break;
            case '>':
            case 'gt':
                $q->$whereMethod($calculatedExpression . ' > ?', [$value]);
                break;
            case '<':
            case 'lt':
                $q->$whereMethod($calculatedExpression . ' < ?', [$value]);
                break;
            case '!=':
            case 'doesNotEqual':
                $q->$whereMethod($calculatedExpression . ' != ?', [$value]);
                break;
            case 'between':
                $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                if (is_array($betweenValues) && count($betweenValues) === 2) {
                    $q->$whereMethod($calculatedExpression . ' BETWEEN ? AND ?', $betweenValues);
                }
                break;
            case 'notBetween':
                $betweenValues = is_array($value) ? $value : $this->parseBetweenValue($value);
                if (is_array($betweenValues) && count($betweenValues) === 2) {
                    $q->$whereMethod($calculatedExpression . ' NOT BETWEEN ? AND ?', $betweenValues);
                }
                break;
            default:
                $q->$whereMethod($calculatedExpression . ' = ?', [$value]);
        }
    }
    
    /**
     * Handle unknown header field queries (fallback)
     * Note: Most header fields now use the generic approach above
     */
    private function handleHeaderField($q, $field, $operator, $value, $whereMethod)
    {
        // Fallback for any unmapped header fields
        $column = 'bc20_header.' . $field;
        $textFields = [$column];
        $numericFields = [];
        $this->applyGenericFieldOperator($q, $column, $operator, $value, $textFields, $numericFields);
    }

    /**
     * Execute a RuleSet query with advanced query builder support - OPTIMIZED VERSION.
     * Uses two-phase approach: fast header query + lazy loading for display data.
     */
    public function executeQuery(Request $request): JsonResponse
    {
        // Validate the request - make query_json optional for fallback compatibility
        $request->validate([
            'query_json' => 'nullable|json',
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'sort_by' => 'nullable|string',
            'sort_direction' => 'nullable|in:asc,desc',
        ]);

        // PHASE 1: Fast header-only query with filtering and pagination
        $headerQuery = BC20Header::query()
            ->select([
                'bc20_header.idheader',
                'bc20_header.nomordaftar',
                'bc20_header.tanggaldaftar',
                'bc20_header.kodejalur'
            ]);

        // Apply the optimized JSON query if provided
        if ($request->filled('query_json')) {
            Log::info('=== OPTIMIZED RULESET QUERY BUILDER ACTIVATED ===');
            Log::info('Query JSON: ' . $request->query_json);
            
            $queryData = json_decode($request->query_json, true);
            $this->applyOptimizedQueryBuilderJson($headerQuery, $queryData);
            
            Log::info('DEBUG: Generated SQL: ' . $headerQuery->toSql());
            Log::info('DEBUG: Query bindings: ' . json_encode($headerQuery->getBindings()));
        } else {
            Log::info('=== RULESET FALLBACK: No query_json provided ===');
            // Return empty result set if no query provided
            $headerQuery->whereRaw('1 = 0'); // This will return no results
        }

        // Apply header-only sorting (fast - no JOINs)
        $this->applyRulesetHeaderSorting($headerQuery, $request);
        
        // PHASE 1: Execute fast header query with pagination
        $perPage = $request->get('per_page', 20);
        $headerResults = $headerQuery->paginate($perPage);
        
        // If no results, return early
        if ($headerResults->isEmpty()) {
            return response()->json($headerResults);
        }
        
        // Extract header IDs from paginated results
        $headerIds = $headerResults->pluck('idheader')->toArray();
        
        // PHASE 2: Lazy load display data only for visible results
        $displayData = $this->loadRulesetDisplayData($headerIds);
        
        // Transform paginated results with lazy-loaded data
        $headerResults->getCollection()->transform(function ($item) use ($displayData) {
            $id = $item->idheader;
            
            // Add display data from lazy-loaded results
            $item->namaimportir = $displayData['entitas'][$id]['importir'] ?? null;
            $item->namappjk = $displayData['entitas'][$id]['ppjk'] ?? null;
            $item->namapenjual = $displayData['entitas'][$id]['penjual'] ?? null;
            $item->kontainer = $displayData['kontainer'][$id]['count'] ?? 0;
            $item->teus = $displayData['kontainer'][$id]['teus'] ?? 0.0;
            $item->barang = $displayData['barang'][$id]['count'] ?? 0;
            $item->hscode = $displayData['barang'][$id]['first_hscode'] ?? null;
            $item->uraianbarang = $displayData['barang'][$id]['first_uraian'] ?? null;
            
            return $item;
        });

        return response()->json($headerResults);
    }
    
    /**
     * Apply optimized query builder JSON using EXISTS subqueries instead of whereHas.
     */
    private function applyOptimizedQueryBuilderJson($builder, array $group, $parentCombinator = 'and')
    {
        $combinator = $group['combinator'] ?? 'and';
        $rules = $group['rules'] ?? [];

        $methodGroup = $parentCombinator === 'or' ? 'orWhere' : 'where';

        $builder->$methodGroup(function($q) use ($rules, $combinator) {
            foreach ($rules as $ruleIndex => $rule) {
                if (isset($rule['rules'])) {
                    // Nested group
                    $this->applyOptimizedQueryBuilderJson($q, $rule, $combinator);
                    continue;
                }

                $field = $rule['field'] ?? '';
                $operator = $rule['operator'] ?? '=';
                $value = $rule['value'] ?? null;

                // Skip if no value provided (except for null/notNull operators)
                if (($value === null || $value === '') && !in_array($operator, ['null', 'notNull', 'isEmpty', 'isNotEmpty'])) {
                    continue;
                }

                $isOr = ($combinator === 'or');
                $whereMethod = $isOr ? 'orWhere' : 'where';

                // Apply optimized field handling with EXISTS subqueries
                $this->applyOptimizedFieldFilter($q, $field, $operator, $value, $whereMethod, $isOr);
            }
        });
    }
    
    /**
     * Apply optimized field filters using EXISTS subqueries (faster than whereHas).
     * COMPREHENSIVE VERSION - handles ALL possible field types correctly.
     */
    private function applyOptimizedFieldFilter($q, $field, $operator, $value, $whereMethod, $isOr)
    {
        // Define data table fields that should use EXISTS subqueries instead of direct field access
        $dataTableFields = [
            'kodepelmuat', 'namapelabuhanmuat', 'kodepeltransit', 'namapelabuhantransit', 
            'kodetps', 'namatpswajib', 'kodekantor', 'namakantorpendek', 'kodevaluta',
            'netto', 'bruto', 'cif', 'ndpbm', 'nilaipabean', 'fob', 'freight', 'asuransi', 'volume',
            'tanggaltiba', 'nomorbc11', 'tanggalbc11', 'posbc11', 'subposbc11'
        ];
        
        // PRIORITY ORDER MATTERS - Most specific patterns first!
        if ($field === 'tanggaldaftar') {
            $this->handleTanggalDaftarField($q, $operator, $value, $whereMethod, $isOr);
        } elseif (strpos($field, 'calculated.') === 0) {
            // Handle calculated fields first (before checking other patterns)
            $this->handleCalculatedField($q, $field, $operator, $value, $isOr);
        } elseif (strpos($field, 'importir.') === 0) {
            $this->applyOptimizedEntitasFilter($q, $field, $operator, $value, '1', $isOr);
        } elseif (strpos($field, 'ppjk.') === 0) {
            $this->applyOptimizedEntitasFilter($q, $field, $operator, $value, '4', $isOr);
        } elseif (strpos($field, 'penjual.') === 0) {
            $this->applyOptimizedEntitasFilter($q, $field, $operator, $value, '10', $isOr);
        } elseif (strpos($field, 'pengirim.') === 0) {
            $this->applyOptimizedEntitasFilter($q, $field, $operator, $value, '9', $isOr);
        } elseif (strpos($field, 'pemilik.') === 0) {
            $this->applyOptimizedEntitasFilter($q, $field, $operator, $value, '7', $isOr);
        } elseif (strpos($field, 'barang.') === 0) {
            $this->applyOptimizedBarangFilter($q, $field, $operator, $value, $isOr);
        } elseif (strpos($field, 'kontainer.') === 0) {
            $this->applyOptimizedKontainerFilter($q, $field, $operator, $value, $isOr);
        } elseif (strpos($field, 'data.') === 0) {
            $this->applyOptimizedDataFilter($q, $field, $operator, $value, $isOr);
        } elseif (strpos($field, 'pengangkut.') === 0) {
            $this->applyOptimizedPengangkutFilter($q, $field, $operator, $value, $isOr);
        } elseif (strpos($field, 'dokumen.') === 0) {
            $this->applyOptimizedDokumenFilter($q, $field, $operator, $value, $isOr);
        } elseif (strpos($field, 'pungutan.') === 0) {
            $this->applyOptimizedPungutanFilter($q, $field, $operator, $value, $isOr);
        } elseif (strpos($field, 'kemasan.') === 0) {
            $this->applyOptimizedKemasanFilter($q, $field, $operator, $value, $isOr);
        } elseif (in_array($field, $dataTableFields)) {
            // Direct data table field (without prefix) - treat as data.field
            $this->applyOptimizedDataFilter($q, 'data.' . $field, $operator, $value, $isOr);
        } elseif (in_array($field, ['nomordaftar', 'kodejalur', 'nomoraju'])) {
            // Header table fields
            $fullFieldName = 'bc20_header.' . $field;
            $textFields = [$fullFieldName];
            $this->applyGenericFieldOperator($q, $fullFieldName, $operator, $value, $textFields, []);
        } else {
            // Fallback: Handle as direct header field
            $this->handleHeaderField($q, $field, $operator, $value, $whereMethod);
        }
    }
    
    /**
     * Apply optimized entitas filter using EXISTS (faster than whereHas).
     */
    private function applyOptimizedEntitasFilter($q, $field, $operator, $value, $kodeentitas, $isOr)
    {
        $existsMethod = $isOr ? 'orWhereExists' : 'whereExists';
        $subField = preg_replace('/^(importir|ppjk|penjual|pengirim|pemilik)\./', '', $field);
        
        $q->$existsMethod(function ($subQ) use ($kodeentitas, $subField, $operator, $value) {
            $subQ->select(DB::raw(1))
                 ->from('customs.bc20_entitas')
                 ->whereColumn('bc20_entitas.idheader', 'bc20_header.idheader')
                 ->where('kodeentitas', $kodeentitas);
            
            $textFields = ['namaentitas', 'alamatentitas', 'namanegara', 'kodenegara'];
            $this->applyGenericFieldOperator($subQ, $subField, $operator, $value, $textFields, []);
        });
    }
    
    /**
     * Apply optimized barang filter using EXISTS (faster than whereHas).
     */
    private function applyOptimizedBarangFilter($q, $field, $operator, $value, $isOr)
    {
        $existsMethod = $isOr ? 'orWhereExists' : 'whereExists';
        $subField = str_replace('barang.', '', $field);
        
        $q->$existsMethod(function ($subQ) use ($subField, $operator, $value) {
            $subQ->select(DB::raw(1))
                 ->from('customs.bc20_barang')
                 ->whereColumn('bc20_barang.idheader', 'bc20_header.idheader');
            
            $textFields = ['postarif', 'uraian', 'kodebarang', 'kodesatuanbarang', 'namasatuanbarang'];
            $numericFields = ['jumlahsatuan', 'cif', 'fob', 'freight', 'asuransi', 'netto', 'bruto', 'volume', 'seribarang', 'jumlahkemasan'];
            $this->applyGenericFieldOperator($subQ, $subField, $operator, $value, $textFields, $numericFields);
        });
    }
    
    /**
     * Apply optimized kontainer filter using EXISTS (faster than whereHas).
     */
    private function applyOptimizedKontainerFilter($q, $field, $operator, $value, $isOr)
    {
        $existsMethod = $isOr ? 'orWhereExists' : 'whereExists';
        $subField = str_replace('kontainer.', '', $field);
        
        $q->$existsMethod(function ($subQ) use ($subField, $operator, $value) {
            $subQ->select(DB::raw(1))
                 ->from('customs.bc20_kontainer')
                 ->whereColumn('bc20_kontainer.idheader', 'bc20_header.idheader');
            
            $textFields = ['nomorkontainer', 'namaukurankontainer', 'namajeniskontainer'];
            $numericFields = ['serikontainer'];
            $this->applyGenericFieldOperator($subQ, $subField, $operator, $value, $textFields, $numericFields);
        });
    }
    
    /**
     * Apply optimized data filter using EXISTS (faster than whereHas).
     */
    private function applyOptimizedDataFilter($q, $field, $operator, $value, $isOr)
    {
        $existsMethod = $isOr ? 'orWhereExists' : 'whereExists';
        $subField = str_replace('data.', '', $field);
        
        $q->$existsMethod(function ($subQ) use ($subField, $operator, $value) {
            $subQ->select(DB::raw(1))
                 ->from('customs.bc20_data')
                 ->whereColumn('bc20_data.idheader', 'bc20_header.idheader');
            
            $textFields = ['kodepelmuat', 'namapelabuhanmuat', 'kodepeltransit', 'namapelabuhantransit', 'kodetps', 'namatpswajib', 'kodekantor', 'namakantorpendek', 'kodevaluta'];
            $numericFields = ['netto', 'bruto', 'cif', 'ndpbm', 'nilaipabean', 'fob', 'freight', 'asuransi', 'volume'];
            $this->applyGenericFieldOperator($subQ, $subField, $operator, $value, $textFields, $numericFields);
        });
    }
    
    /**
     * Apply optimized pengangkut filter using EXISTS (faster than whereHas).
     */
    private function applyOptimizedPengangkutFilter($q, $field, $operator, $value, $isOr)
    {
        $existsMethod = $isOr ? 'orWhereExists' : 'whereExists';
        $subField = str_replace('pengangkut.', '', $field);
        
        $q->$existsMethod(function ($subQ) use ($subField, $operator, $value) {
            $subQ->select(DB::raw(1))
                 ->from('customs.bc20_pengangkut')
                 ->whereColumn('bc20_pengangkut.idheader', 'bc20_header.idheader');
            
            $textFields = ['namapengangkut', 'nomorpengangkut', 'kodebendera', 'namanegara'];
            $this->applyGenericFieldOperator($subQ, $subField, $operator, $value, $textFields, []);
        });
    }
    
    /**
     * Apply optimized dokumen filter using EXISTS (faster than whereHas).
     */
    private function applyOptimizedDokumenFilter($q, $field, $operator, $value, $isOr)
    {
        $existsMethod = $isOr ? 'orWhereExists' : 'whereExists';
        $subField = str_replace('dokumen.', '', $field);
        
        $q->$existsMethod(function ($subQ) use ($subField, $operator, $value) {
            $subQ->select(DB::raw(1))
                 ->from('customs.bc20_dokumen')
                 ->whereColumn('bc20_dokumen.idheader', 'bc20_header.idheader');
            
            $textFields = ['namadokumen', 'nomordokumen', 'namafasilitas', 'kodefasilitas'];
            $numericFields = ['seridokumen'];
            $this->applyGenericFieldOperator($subQ, $subField, $operator, $value, $textFields, $numericFields);
        });
    }
    
    /**
     * Apply optimized pungutan filter using EXISTS (faster than whereHas).
     */
    private function applyOptimizedPungutanFilter($q, $field, $operator, $value, $isOr)
    {
        $existsMethod = $isOr ? 'orWhereExists' : 'whereExists';
        $subField = str_replace('pungutan.', '', $field);
        
        $q->$existsMethod(function ($subQ) use ($subField, $operator, $value) {
            $subQ->select(DB::raw(1))
                 ->from('customs.bc20_pungutan')
                 ->whereColumn('bc20_pungutan.idheader', 'bc20_header.idheader');
            
            $textFields = ['keterangan'];
            $numericFields = ['dibayar'];
            $this->applyGenericFieldOperator($subQ, $subField, $operator, $value, $textFields, $numericFields);
        });
    }
    
    /**
     * Apply optimized kemasan filter using EXISTS (faster than whereHas).
     */
    private function applyOptimizedKemasanFilter($q, $field, $operator, $value, $isOr)
    {
        $existsMethod = $isOr ? 'orWhereExists' : 'whereExists';
        $subField = str_replace('kemasan.', '', $field);
        
        $q->$existsMethod(function ($subQ) use ($subField, $operator, $value) {
            $subQ->select(DB::raw(1))
                 ->from('customs.bc20_kemasan')
                 ->whereColumn('bc20_kemasan.idheader', 'bc20_header.idheader');
            
            $textFields = ['kodejeniskemasan', 'namakemasan'];
            $numericFields = ['jumlahkemasan', 'serikemasan'];
            $this->applyGenericFieldOperator($subQ, $subField, $operator, $value, $textFields, $numericFields);
        });
    }
    
    /**
     * Apply header-only sorting (fast - no JOINs on main table).
     */
    private function applyRulesetHeaderSorting($query, Request $request)
    {
        $sortBy = $request->get('sort_by', 'nomordaftar');
        $sortDirection = $request->get('sort_direction', 'asc');
        
        // Only allow sorting by header columns for optimal performance
        switch ($sortBy) {
            case 'nomordaftar':
            case 'tanggaldaftar':
            case 'kodejalur':
                $query->orderBy('bc20_header.' . $sortBy, $sortDirection);
                break;
            default:
                // Default sort by PIB ascending
                $query->orderBy('bc20_header.nomordaftar', 'asc');
        }
    }
    
    /**
     * Lazy load display data for visible headers only (PHASE 2) - RuleSet version.
     */
    private function loadRulesetDisplayData(array $headerIds)
    {
        // Load entity data using optimized queries
        $entitasData = $this->loadDisplayEntitas($headerIds);
        
        // Load kontainer data using optimized queries
        $kontainerData = $this->loadDisplayKontainer($headerIds);
        
        // Load barang data using optimized queries  
        $barangData = $this->loadDisplayBarang($headerIds);
        
        return [
            'entitas' => $entitasData,
            'kontainer' => $kontainerData,
            'barang' => $barangData
        ];
    }
    
    /**
     * Load entity display data (importir, ppjk, penjual names) for visible rows only.
     */
    private function loadDisplayEntitas(array $headerIds)
    {
        // Use PostgreSQL-optimized DISTINCT ON for fastest results
        $results = DB::select("
            SELECT DISTINCT ON (idheader, kodeentitas) 
                   idheader, kodeentitas, namaentitas
            FROM customs.bc20_entitas 
            WHERE idheader = ANY(?) 
            AND kodeentitas IN ('1', '4', '10')
            ORDER BY idheader, kodeentitas, namaentitas
        ", ['{' . implode(',', $headerIds) . '}']);
        
        $entitasData = [];
        foreach ($results as $row) {
            $headerId = $row->idheader;
            if (!isset($entitasData[$headerId])) {
                $entitasData[$headerId] = [];
            }
            
            switch ($row->kodeentitas) {
                case '1':
                    $entitasData[$headerId]['importir'] = $row->namaentitas;
                    break;
                case '4':
                    $entitasData[$headerId]['ppjk'] = $row->namaentitas;
                    break;
                case '10':
                    $entitasData[$headerId]['penjual'] = $row->namaentitas;
                    break;
            }
        }
        
        return $entitasData;
    }
    
    /**
     * Load barang display data (first HS code, description, count) for visible rows only.
     */
    private function loadDisplayBarang(array $headerIds)
    {
        // PostgreSQL-optimized: use DISTINCT ON for first item + COUNT aggregation
        $firstBarang = DB::select("
            SELECT DISTINCT ON (idheader) 
                   idheader, postarif, uraian
            FROM customs.bc20_barang 
            WHERE idheader = ANY(?) 
            ORDER BY idheader, seribarang ASC
        ", ['{' . implode(',', $headerIds) . '}']);
        
        $barangCounts = DB::table('customs.bc20_barang')
            ->select('idheader', DB::raw('COUNT(*) as barang_count'))
            ->whereIn('idheader', $headerIds)
            ->groupBy('idheader')
            ->pluck('barang_count', 'idheader');
        
        $barangData = [];
        foreach ($headerIds as $id) {
            $firstItem = collect($firstBarang)->where('idheader', $id)->first();
            $barangData[$id] = [
                'count' => $barangCounts[$id] ?? 0,
                'first_hscode' => $firstItem->postarif ?? null,
                'first_uraian' => $firstItem->uraian ?? null,
            ];
        }
        
        return $barangData;
    }
    
    /**
     * Load kontainer display data (count, TEUS sum) for visible rows only.
     */
    private function loadDisplayKontainer(array $headerIds)
    {
        $kontainerData = DB::table('customs.bc20_kontainer')
            ->select([
                'idheader',
                DB::raw('COUNT(*) as kontainer_count'),
                DB::raw('COALESCE(SUM(
                    CASE kodeukurankontainer
                        WHEN \'20\' THEN 1.0
                        WHEN \'40\' THEN 2.0
                        WHEN \'45\' THEN 2.25
                        WHEN \'60\' THEN 3.0
                        ELSE 0.0
                    END
                ), 0) as teus_sum')
            ])
            ->whereIn('idheader', $headerIds)
            ->groupBy('idheader')
            ->get()
            ->keyBy('idheader');
        
        $results = [];
        foreach ($headerIds as $id) {
            $data = $kontainerData->get($id);
            $results[$id] = [
                'count' => $data ? (int)$data->kontainer_count : 0,
                'teus' => $data ? (float)$data->teus_sum : 0.0,
            ];
        }
        
        return $results;
    }

    /**
     * Get detailed information for a specific customs record from RuleSet context.
     */
    public function getDetail($idheader): JsonResponse
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
     * Export ruleset query results to Excel with configurable sections.
     */
    public function exportExcel(Request $request)
    {
        // Validate the request including the new sections parameter
        $request->validate([
            'query_json' => 'required|json',
            'sort_by' => 'nullable|string',
            'sort_direction' => 'nullable|in:asc,desc',
            'sections' => 'nullable|string', // Comma-separated list of sections
        ]);
        
        // Parse selected sections
        $sections = $request->filled('sections') ? explode(',', $request->sections) : ['basic'];
        
        return $this->generateRulesetExcelExport($request, $sections);
    }
    
    /**
     * Generate Excel export for ruleset queries with multi-tab format based on selected sections.
     */
    private function generateRulesetExcelExport(Request $request, array $sections)
    {
        $query = $this->buildRulesetExportQuery($request, $sections);
        
        // Use multi-tab export with selected sections only
        $export = new \App\Exports\CustomsDataMultiTabExport($query, $sections);
        $filename = 'ruleset_export_' . date('Y-m-d_H-i-s') . '.xlsx';
        return $export->download($filename);
    }
    
    /**
     * Build export query with relationships based on selected sections for ruleset queries.
     */
    private function buildRulesetExportQuery(Request $request, array $sections)
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
        
        // Apply the JSON query if provided
        if ($request->filled('query_json')) {
            $queryData = json_decode($request->query_json, true);
            $this->applyQueryBuilderJson($query, $queryData);
        }
        
        // Apply sorting
        $this->applyRulesetSorting($query, $request);
        
        return $query;
    }
    
    /**
     * Apply sorting to the ruleset export query.
     */
    private function applyRulesetSorting($query, Request $request)
    {
        $sortBy = $request->get('sort_by', 'nomordaftar');
        $sortDirection = $request->get('sort_direction', 'asc');
        
        switch ($sortBy) {
            case 'nomordaftar':
            case 'tanggaldaftar':
            case 'kodejalur':
                $query->orderBy('bc20_header.' . $sortBy, $sortDirection);
                break;
            case 'kontainer':
                $query->orderBy('export_kontainer_agg.kontainer', $sortDirection);
                break;
            case 'teus':
                $query->orderBy('export_kontainer_agg.teus', $sortDirection);
                break;
            default:
                $query->orderBy('bc20_header.nomordaftar', 'asc');
        }
    }
}
