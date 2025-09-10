<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class DashboardController extends Controller
{
    /**
     * Get document summary data from bc20_jumlahdok materialized view
     */
    public function getDocumentSummary(): JsonResponse
    {
        try {
            $data = DB::table('bc20_jumlahdok')
                ->select('kodejalur', 'count')
                ->get();

            if ($data->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No data found in bc20_jumlahdok materialized view',
                    'data' => [],
                    'stats' => [
                        'total' => 0,
                        'green' => 0,
                        'red' => 0
                    ]
                ]);
            }

            // Calculate statistics
            $green = $data->where('kodejalur', 'H')->first()?->count ?? 0;
            $red = $data->where('kodejalur', 'M')->first()?->count ?? 0;
            $total = $green + $red;

            return response()->json([
                'success' => true,
                'data' => $data->toArray(),
                'stats' => [
                    'total' => $total,
                    'green' => $green,
                    'red' => $red
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching document summary: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch document summary data',
                'data' => [],
                'stats' => [
                    'total' => 0,
                    'green' => 0,
                    'red' => 0
                ]
            ], 500);
        }
    }

    /**
     * Get monthly document data from bc20_jumlahdok_bulan materialized view
     */
    public function getMonthlyDocuments(): JsonResponse
    {
        try {
            $data = DB::table('bc20_jumlahdok_bulan')
                ->select('month', 'count')
                ->orderBy('month')
                ->get()
                ->map(function ($item) {
                    // Format month for display (e.g., "2025-01" to "Jan 2025")
                    $formatted = date('M Y', strtotime($item->month . '-01'));
                    return [
                        'month' => $item->month,
                        'count' => $item->count,
                        'formatted_month' => $formatted
                    ];
                });

            if ($data->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No data found in bc20_jumlahdok_bulan materialized view',
                    'data' => []
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $data->toArray()
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching monthly documents: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch monthly document data',
                'data' => []
            ], 500);
        }
    }

    /**
     * Refresh bc20_jumlahdok materialized view
     */
    public function refreshDocumentSummary(): JsonResponse
    {
        try {
            DB::statement('REFRESH MATERIALIZED VIEW bc20_jumlahdok');
            
            Log::info('Successfully refreshed bc20_jumlahdok materialized view');
            
            return response()->json([
                'success' => true,
                'message' => 'Document summary materialized view refreshed successfully',
                'view_name' => 'bc20_jumlahdok'
            ]);
        } catch (Exception $e) {
            Log::error('Error refreshing bc20_jumlahdok materialized view: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh document summary materialized view: ' . $e->getMessage(),
                'view_name' => 'bc20_jumlahdok'
            ], 500);
        }
    }

    /**
     * Refresh bc20_jumlahdok_bulan materialized view
     */
    public function refreshMonthlyDocuments(): JsonResponse
    {
        try {
            DB::statement('REFRESH MATERIALIZED VIEW bc20_jumlahdok_bulan');
            
            Log::info('Successfully refreshed bc20_jumlahdok_bulan materialized view');
            
            return response()->json([
                'success' => true,
                'message' => 'Monthly documents materialized view refreshed successfully',
                'view_name' => 'bc20_jumlahdok_bulan'
            ]);
        } catch (Exception $e) {
            Log::error('Error refreshing bc20_jumlahdok_bulan materialized view: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh monthly documents materialized view: ' . $e->getMessage(),
                'view_name' => 'bc20_jumlahdok_bulan'
            ], 500);
        }
    }

    /**
     * Get import visualization data from bc20_globe materialized view
     */
    public function getImportVisualization(): JsonResponse
    {
        Log::info('getImportVisualization method called');
        
        try {
            Log::info('Attempting to query bc20_globe view from customs schema');
            $data = DB::table('customs.bc20_globe')
                ->select('country_code', 'count')
                ->orderBy('count', 'desc')
                ->get();

            if ($data->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No data found in bc20_globe materialized view',
                    'data' => [],
                    'top_countries' => []
                ]);
            }

            // Get top 10 countries for the side panel
            $topCountries = $data->take(10)->map(function ($item) {
                return [
                    'country_code' => $item->country_code,
                    'count' => $item->count,
                    'country_name' => $this->getCountryName($item->country_code)
                ];
            });

            // Map all data with country names
            $allData = $data->map(function ($item) {
                return [
                    'country_code' => $item->country_code,
                    'count' => $item->count,
                    'country_name' => $this->getCountryName($item->country_code)
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $allData->toArray(),
                'top_countries' => $topCountries->toArray(),
                'total_countries' => $data->count(),
                'total_imports' => $data->sum('count')
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching import visualization data: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch import visualization data',
                'data' => [],
                'top_countries' => []
            ], 500);
        }
    }

    /**
     * Refresh bc20_globe materialized view
     */
    public function refreshImportVisualization(): JsonResponse
    {
        try {
            DB::statement('REFRESH MATERIALIZED VIEW customs.bc20_globe');
            
            Log::info('Successfully refreshed bc20_globe materialized view');
            
            return response()->json([
                'success' => true,
                'message' => 'Import visualization materialized view refreshed successfully',
                'view_name' => 'bc20_globe'
            ]);
        } catch (Exception $e) {
            Log::error('Error refreshing bc20_globe materialized view: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh import visualization materialized view: ' . $e->getMessage(),
                'view_name' => 'bc20_globe'
            ], 500);
        }
    }

    /**
     * Get country name from country code
     */
    private function getCountryName(string $countryCode): string
    {
        $countries = [
            'AD' => 'Andorra',
            'AE' => 'United Arab Emirates',
            'AF' => 'Afghanistan',
            'AG' => 'Antigua and Barbuda',
            'AI' => 'Anguilla',
            'AL' => 'Albania',
            'AM' => 'Armenia',
            'AN' => 'Netherlands Antilles',
            'AO' => 'Angola',
            'AQ' => 'Antarctica',
            'AR' => 'Argentina',
            'AS' => 'American Samoa',
            'AT' => 'Austria',
            'AU' => 'Australia',
            'AW' => 'Aruba',
            'AX' => 'Aland Islands',
            'AZ' => 'Azerbaijan',
            'BA' => 'Bosnia and Herzegovina',
            'BB' => 'Barbados',
            'BD' => 'Bangladesh',
            'BE' => 'Belgium',
            'BF' => 'Burkina Faso',
            'BG' => 'Bulgaria',
            'BH' => 'Bahrain',
            'BI' => 'Burundi',
            'BJ' => 'Benin',
            'BL' => 'Saint Barthelemy',
            'BM' => 'Bermuda',
            'BN' => 'Brunei Darussalam',
            'BO' => 'Bolivia',
            'BQ' => 'Bonaire, Sint Eustatius and Saba',
            'BR' => 'Brazil',
            'BS' => 'Bahamas',
            'BT' => 'Bhutan',
            'BV' => 'Bouvet Island',
            'BW' => 'Botswana',
            'BY' => 'Belarus',
            'BZ' => 'Belize',
            'CA' => 'Canada',
            'CC' => 'Cocos (Keeling) Islands',
            'CD' => 'Congo, The Democratic Republic of the',
            'CF' => 'Central African Republic',
            'CG' => 'Congo',
            'CH' => 'Switzerland',
            'CI' => 'Cote D\'Ivoire',
            'CK' => 'Cook Islands',
            'CL' => 'Chile',
            'CM' => 'Cameroon',
            'CN' => 'China',
            'CO' => 'Colombia',
            'CR' => 'Costa Rica',
            'CS' => 'Former Czechoslovakia',
            'CU' => 'Cuba',
            'CV' => 'Cape Verde',
            'CW' => 'Curacao',
            'CX' => 'Christmas Island',
            'CY' => 'Cyprus',
            'CZ' => 'Czech Republic',
            'DE' => 'Germany',
            'DJ' => 'Djibouti',
            'DK' => 'Denmark',
            'DM' => 'Dominica',
            'DO' => 'Dominican Republic',
            'DZ' => 'Algeria',
            'EC' => 'Ecuador',
            'EE' => 'Estonia',
            'EG' => 'Egypt',
            'EH' => 'Western Sahara',
            'ER' => 'Eritrea',
            'ES' => 'Spain',
            'ET' => 'Ethiopia',
            'FI' => 'Finland',
            'FJ' => 'Fiji',
            'FK' => 'Falkland Islands (Malvinas)',
            'FM' => 'Micronesia, Federated States of',
            'FO' => 'Faroe Islands',
            'FR' => 'France',
            'GA' => 'Gabon',
            'GB' => 'United Kingdom',
            'GD' => 'Grenada',
            'GE' => 'Georgia',
            'GF' => 'French Guiana',
            'GG' => 'Guernsey',
            'GH' => 'Ghana',
            'GI' => 'Gibraltar',
            'GL' => 'Greenland',
            'GM' => 'Gambia',
            'GN' => 'Guinea',
            'GP' => 'Guadeloupe',
            'GQ' => 'Equatorial Guinea',
            'GR' => 'Greece',
            'GS' => 'South Georgia and the South Sandwich Isl',
            'GT' => 'Guatemala',
            'GU' => 'Guam',
            'GW' => 'Guinea-Bissau',
            'GY' => 'Guyana',
            'HK' => 'Hong Kong',
            'HM' => 'Heard Island and Mcdonald Islands',
            'HN' => 'Honduras',
            'HR' => 'Croatia',
            'HT' => 'Haiti',
            'HU' => 'Hungary',
            'ID' => 'Indonesia',
            'IE' => 'Ireland',
            'IL' => 'Israel',
            'IM' => 'Isle of Man',
            'IN' => 'India',
            'IO' => 'British Indian Ocean Territory',
            'IQ' => 'Iraq',
            'IR' => 'Iran, Islamic Republic of',
            'IS' => 'Iceland',
            'IT' => 'Italy',
            'JE' => 'Jersey',
            'JM' => 'Jamaica',
            'JO' => 'Jordan',
            'JP' => 'Japan',
            'KE' => 'Kenya',
            'KG' => 'Kyrgyzstan',
            'KH' => 'Cambodia',
            'KI' => 'Kiribati',
            'KM' => 'Comoros',
            'KN' => 'Saint Kitts and Nevis',
            'KP' => 'Korea, Democratic People\'s Republic of',
            'KR' => 'Korea, Republic of',
            'KW' => 'Kuwait',
            'KY' => 'Cayman Islands',
            'KZ' => 'Kazakstan',
            'LA' => 'Lao People\'s Democratic Republic',
            'LB' => 'Lebanon',
            'LC' => 'Saint Lucia',
            'LI' => 'Liechtenstein',
            'LK' => 'Sri Lanka',
            'LR' => 'Liberia',
            'LS' => 'Lesotho',
            'LT' => 'Lithuania',
            'LU' => 'Luxembourg',
            'LV' => 'Latvia',
            'LY' => 'Libyan Arab Jamahiriya',
            'MA' => 'Morocco',
            'MC' => 'Monaco',
            'MD' => 'Moldova, Republic of',
            'ME' => 'Montenegro',
            'MF' => 'Saint Martin (French Part)',
            'MG' => 'Madagascar',
            'MH' => 'Marshall Islands',
            'MK' => 'Macedonia, The Former Yugoslav Republic',
            'ML' => 'Mali',
            'MM' => 'Myanmar',
            'MN' => 'Mongolia',
            'MO' => 'Macau',
            'MP' => 'Northern Mariana Islands',
            'MQ' => 'Martinique',
            'MR' => 'Mauritania',
            'MS' => 'Montserrat',
            'MT' => 'Malta',
            'MU' => 'Mauritius',
            'MV' => 'Maldives',
            'MW' => 'Malawi',
            'MX' => 'Mexico',
            'MY' => 'Malaysia',
            'MZ' => 'Mozambique',
            'NA' => 'Namibia',
            'NC' => 'New Caledonia',
            'NE' => 'Niger',
            'NF' => 'Norfolk Island',
            'NG' => 'Nigeria',
            'NI' => 'Nicaragua',
            'NL' => 'Netherlands',
            'NO' => 'Norway',
            'NP' => 'Nepal',
            'NR' => 'Nauru',
            'NU' => 'Niue',
            'NZ' => 'New Zealand',
            'OM' => 'Oman',
            'PA' => 'Panama',
            'PE' => 'Peru',
            'PF' => 'French Polynesia',
            'PG' => 'Papua New Guinea',
            'PH' => 'Philippines',
            'PK' => 'Pakistan',
            'PL' => 'Poland',
            'PM' => 'Saint Pierre and Miquelon',
            'PN' => 'Pitcairn',
            'PR' => 'Puerto Rico',
            'PS' => 'Palestinian Territory, Occupied',
            'PT' => 'Portugal',
            'PW' => 'Palau',
            'PY' => 'Paraguay',
            'QA' => 'Qatar',
            'RE' => 'Reunion',
            'RO' => 'Romania',
            'RS' => 'Serbia',
            'RU' => 'Russian Federation',
            'RW' => 'Rwanda',
            'SA' => 'Saudi Arabia',
            'SB' => 'Solomon Islands',
            'SC' => 'Seychelles',
            'SD' => 'Sudan',
            'SE' => 'Sweden',
            'SG' => 'Singapore',
            'SH' => 'Saint Helena',
            'SI' => 'Slovenia',
            'SJ' => 'Svalbard and Jan Mayen',
            'SK' => 'Slovakia',
            'SL' => 'Sierra Leone',
            'SM' => 'San Marino',
            'SN' => 'Senegal',
            'SO' => 'Somalia',
            'SR' => 'Suriname',
            'SS' => 'South Sudan',
            'ST' => 'Sao Tome and Principe',
            'SV' => 'El Salvador',
            'SX' => 'Sint Maarten (Dutch Part)',
            'SY' => 'Syrian Arab Republic',
            'SZ' => 'Swaziland',
            'TC' => 'Turks and Caicos Islands',
            'TD' => 'Chad',
            'TF' => 'French Southern Territories',
            'TG' => 'Togo',
            'TH' => 'Thailand',
            'TJ' => 'Tajikistan',
            'TK' => 'Tokelau',
            'TL' => 'Timor-Leste',
            'TM' => 'Turkmenistan',
            'TN' => 'Tunisia',
            'TO' => 'Tonga',
            'TP' => 'East Timor',
            'TR' => 'Turkey',
            'TT' => 'Trinidad and Tobago',
            'TV' => 'Tuvalu',
            'TW' => 'Taiwan, Province of China',
            'TZ' => 'Tanzania, United Republic of',
            'UA' => 'Ukraine',
            'UG' => 'Uganda',
            'UM' => 'United States Minor Outlying Islands',
            'US' => 'United States',
            'UY' => 'Uruguay',
            'UZ' => 'Uzbekistan',
            'VA' => 'Holy See (Vatican City State)',
            'VC' => 'Saint Vincent and the Grenadines',
            'VE' => 'Venezuela',
            'VG' => 'Virgin Islands, British',
            'VI' => 'Virgin Islands, U.S.',
            'VN' => 'Viet Nam',
            'VU' => 'Vanuatu',
            'WF' => 'Wallis and Futuna',
            'WS' => 'Samoa',
            'XZ' => 'Kosovo',
            'YE' => 'Yemen',
            'YT' => 'Mayotte',
            'YU' => 'Yugoslavia',
            'ZA' => 'South Africa',
            'ZM' => 'Zambia',
            'ZW' => 'Zimbabwe',
        ];

        return $countries[$countryCode] ?? $countryCode;
    }

    /**
     * Refresh both materialized views
     */
    public function refreshAllViews(): JsonResponse
    {
        try {
            DB::statement('REFRESH MATERIALIZED VIEW bc20_jumlahdok');
            DB::statement('REFRESH MATERIALIZED VIEW bc20_jumlahdok_bulan');
            DB::statement('REFRESH MATERIALIZED VIEW customs.bc20_globe');
            
            Log::info('Successfully refreshed all materialized views');
            
            return response()->json([
                'success' => true,
                'message' => 'All materialized views refreshed successfully',
                'views' => ['bc20_jumlahdok', 'bc20_jumlahdok_bulan', 'bc20_globe']
            ]);
        } catch (Exception $e) {
            Log::error('Error refreshing materialized views: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh materialized views: ' . $e->getMessage()
            ], 500);
        }
    }
}
