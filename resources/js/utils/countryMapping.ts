import { getNames, getData } from 'country-list';

// Get all country data with codes and names
const countryData = getData();

export interface Country {
  code: string;
  name: string;
}

// Create a mapping from country code to country name
export const countryCodeToName: Record<string, string> = countryData.reduce((acc, country) => {
  acc[country.code] = country.name;
  return acc;
}, {} as Record<string, string>);

// Additional country codes that might not be in the standard list
const additionalCountries: Record<string, string> = {
  'AQ': 'Antarctica',
  'XK': 'Kosovo',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'MO': 'Macao',
  'PS': 'Palestine',
  'EH': 'Western Sahara',
  // Add more as needed
};

// Merge with additional countries
export const completeCountryMapping = {
  ...countryCodeToName,
  ...additionalCountries,
};

/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
  return completeCountryMapping[countryCode.toUpperCase()] || countryCode;
}

/**
 * Get all countries as array
 */
export function getAllCountries(): Country[] {
  return Object.entries(completeCountryMapping).map(([code, name]) => ({
    code,
    name,
  }));
}

/**
 * Search countries by name or code
 */
export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase();
  return getAllCountries().filter(
    (country) =>
      country.name.toLowerCase().includes(lowerQuery) ||
      country.code.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get country coordinates (center of country) - Complete dataset
 */
export const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  'AD': { lat: 42.546245, lng: 1.601554 }, // Andorra
  'AE': { lat: 23.424076, lng: 53.847818 }, // United Arab Emirates
  'AF': { lat: 33.93911, lng: 67.709953 }, // Afghanistan
  'AG': { lat: 17.060816, lng: -61.796428 }, // Antigua and Barbuda
  'AI': { lat: 18.220554, lng: -63.068615 }, // Anguilla
  'AL': { lat: 41.153332, lng: 20.168331 }, // Albania
  'AM': { lat: 40.069099, lng: 45.038189 }, // Armenia
  'AN': { lat: 12.226079, lng: -69.060087 }, // Netherlands Antilles
  'AO': { lat: -11.202692, lng: 17.873887 }, // Angola
  'AQ': { lat: -75.250973, lng: -0.071389 }, // Antarctica
  'AR': { lat: -38.416097, lng: -63.616672 }, // Argentina
  'AS': { lat: -14.270972, lng: -170.132217 }, // American Samoa
  'AT': { lat: 47.516231, lng: 14.550072 }, // Austria
  'AU': { lat: -25.274398, lng: 133.775136 }, // Australia
  'AW': { lat: 12.52111, lng: -69.968338 }, // Aruba
  'AZ': { lat: 40.143105, lng: 47.576927 }, // Azerbaijan
  'BA': { lat: 43.915886, lng: 17.679076 }, // Bosnia and Herzegovina
  'BB': { lat: 13.193887, lng: -59.543198 }, // Barbados
  'BD': { lat: 23.684994, lng: 90.356331 }, // Bangladesh
  'BE': { lat: 50.503887, lng: 4.469936 }, // Belgium
  'BF': { lat: 12.238333, lng: -1.561593 }, // Burkina Faso
  'BG': { lat: 42.733883, lng: 25.48583 }, // Bulgaria
  'BH': { lat: 25.930414, lng: 50.637772 }, // Bahrain
  'BI': { lat: -3.373056, lng: 29.918886 }, // Burundi
  'BJ': { lat: 9.30769, lng: 2.315834 }, // Benin
  'BM': { lat: 32.321384, lng: -64.75737 }, // Bermuda
  'BN': { lat: 4.535277, lng: 114.727669 }, // Brunei
  'BO': { lat: -16.290154, lng: -63.588653 }, // Bolivia
  'BR': { lat: -14.235004, lng: -51.92528 }, // Brazil
  'BS': { lat: 25.03428, lng: -77.39628 }, // Bahamas
  'BT': { lat: 27.514162, lng: 90.433601 }, // Bhutan
  'BV': { lat: -54.423199, lng: 3.413194 }, // Bouvet Island
  'BW': { lat: -22.328474, lng: 24.684866 }, // Botswana
  'BY': { lat: 53.709807, lng: 27.953389 }, // Belarus
  'BZ': { lat: 17.189877, lng: -88.49765 }, // Belize
  'CA': { lat: 56.130366, lng: -106.346771 }, // Canada
  'CC': { lat: -12.164165, lng: 96.870956 }, // Cocos [Keeling] Islands
  'CD': { lat: -4.038333, lng: 21.758664 }, // Congo [DRC]
  'CF': { lat: 6.611111, lng: 20.939444 }, // Central African Republic
  'CG': { lat: -0.228021, lng: 15.827659 }, // Congo [Republic]
  'CH': { lat: 46.818188, lng: 8.227512 }, // Switzerland
  'CI': { lat: 7.539989, lng: -5.54708 }, // Côte d'Ivoire
  'CK': { lat: -21.236736, lng: -159.777671 }, // Cook Islands
  'CL': { lat: -35.675147, lng: -71.542969 }, // Chile
  'CM': { lat: 7.369722, lng: 12.354722 }, // Cameroon
  'CN': { lat: 35.86166, lng: 104.195397 }, // China
  'CO': { lat: 4.570868, lng: -74.297333 }, // Colombia
  'CR': { lat: 9.748917, lng: -83.753428 }, // Costa Rica
  'CU': { lat: 21.521757, lng: -77.781167 }, // Cuba
  'CV': { lat: 16.002082, lng: -24.013197 }, // Cape Verde
  'CX': { lat: -10.447525, lng: 105.690449 }, // Christmas Island
  'CY': { lat: 35.126413, lng: 33.429859 }, // Cyprus
  'CZ': { lat: 49.817492, lng: 15.472962 }, // Czech Republic
  'DE': { lat: 51.165691, lng: 10.451526 }, // Germany
  'DJ': { lat: 11.825138, lng: 42.590275 }, // Djibouti
  'DK': { lat: 56.26392, lng: 9.501785 }, // Denmark
  'DM': { lat: 15.414999, lng: -61.370976 }, // Dominica
  'DO': { lat: 18.735693, lng: -70.162651 }, // Dominican Republic
  'DZ': { lat: 28.033886, lng: 1.659626 }, // Algeria
  'EC': { lat: -1.831239, lng: -78.183406 }, // Ecuador
  'EE': { lat: 58.595272, lng: 25.013607 }, // Estonia
  'EG': { lat: 26.820553, lng: 30.802498 }, // Egypt
  'EH': { lat: 24.215527, lng: -12.885834 }, // Western Sahara
  'ER': { lat: 15.179384, lng: 39.782334 }, // Eritrea
  'ES': { lat: 40.463667, lng: -3.74922 }, // Spain
  'ET': { lat: 9.145, lng: 40.489673 }, // Ethiopia
  'FI': { lat: 61.92411, lng: 25.748151 }, // Finland
  'FJ': { lat: -16.578193, lng: 179.414413 }, // Fiji
  'FK': { lat: -51.796253, lng: -59.523613 }, // Falkland Islands [Islas Malvinas]
  'FM': { lat: 7.425554, lng: 150.550812 }, // Micronesia
  'FO': { lat: 61.892635, lng: -6.911806 }, // Faroe Islands
  'FR': { lat: 46.227638, lng: 2.213749 }, // France
  'GA': { lat: -0.803689, lng: 11.609444 }, // Gabon
  'GB': { lat: 55.378051, lng: -3.435973 }, // United Kingdom
  'GD': { lat: 12.262776, lng: -61.604171 }, // Grenada
  'GE': { lat: 42.315407, lng: 43.356892 }, // Georgia
  'GF': { lat: 3.933889, lng: -53.125782 }, // French Guiana
  'GG': { lat: 49.465691, lng: -2.585278 }, // Guernsey
  'GH': { lat: 7.946527, lng: -1.023194 }, // Ghana
  'GI': { lat: 36.137741, lng: -5.345374 }, // Gibraltar
  'GL': { lat: 71.706936, lng: -42.604303 }, // Greenland
  'GM': { lat: 13.443182, lng: -15.310139 }, // Gambia
  'GN': { lat: 9.945587, lng: -9.696645 }, // Guinea
  'GP': { lat: 16.995971, lng: -62.067641 }, // Guadeloupe
  'GQ': { lat: 1.650801, lng: 10.267895 }, // Equatorial Guinea
  'GR': { lat: 39.074208, lng: 21.824312 }, // Greece
  'GS': { lat: -54.429579, lng: -36.587909 }, // South Georgia and the South Sandwich Islands
  'GT': { lat: 15.783471, lng: -90.230759 }, // Guatemala
  'GU': { lat: 13.444304, lng: 144.793731 }, // Guam
  'GW': { lat: 11.803749, lng: -15.180413 }, // Guinea-Bissau
  'GY': { lat: 4.860416, lng: -58.93018 }, // Guyana
  'GZ': { lat: 31.354676, lng: 34.308825 }, // Gaza Strip
  'HK': { lat: 22.396428, lng: 114.109497 }, // Hong Kong
  'HM': { lat: -53.08181, lng: 73.504158 }, // Heard Island and McDonald Islands
  'HN': { lat: 15.199999, lng: -86.241905 }, // Honduras
  'HR': { lat: 45.1, lng: 15.2 }, // Croatia
  'HT': { lat: 18.971187, lng: -72.285215 }, // Haiti
  'HU': { lat: 47.162494, lng: 19.503304 }, // Hungary
  'ID': { lat: -0.789275, lng: 113.921327 }, // Indonesia
  'IE': { lat: 53.41291, lng: -8.24389 }, // Ireland
  'IL': { lat: 31.046051, lng: 34.851612 }, // Israel
  'IM': { lat: 54.236107, lng: -4.548056 }, // Isle of Man
  'IN': { lat: 20.593684, lng: 78.96288 }, // India
  'IO': { lat: -6.343194, lng: 71.876519 }, // British Indian Ocean Territory
  'IQ': { lat: 33.223191, lng: 43.679291 }, // Iraq
  'IR': { lat: 32.427908, lng: 53.688046 }, // Iran
  'IS': { lat: 64.963051, lng: -19.020835 }, // Iceland
  'IT': { lat: 41.87194, lng: 12.56738 }, // Italy
  'JE': { lat: 49.214439, lng: -2.13125 }, // Jersey
  'JM': { lat: 18.109581, lng: -77.297508 }, // Jamaica
  'JO': { lat: 30.585164, lng: 36.238414 }, // Jordan
  'JP': { lat: 36.204824, lng: 138.252924 }, // Japan
  'KE': { lat: -0.023559, lng: 37.906193 }, // Kenya
  'KG': { lat: 41.20438, lng: 74.766098 }, // Kyrgyzstan
  'KH': { lat: 12.565679, lng: 104.990963 }, // Cambodia
  'KI': { lat: -3.370417, lng: -168.734039 }, // Kiribati
  'KM': { lat: -11.875001, lng: 43.872219 }, // Comoros
  'KN': { lat: 17.357822, lng: -62.782998 }, // Saint Kitts and Nevis
  'KP': { lat: 40.339852, lng: 127.510093 }, // North Korea
  'KR': { lat: 35.907757, lng: 127.766922 }, // South Korea
  'KW': { lat: 29.31166, lng: 47.481766 }, // Kuwait
  'KY': { lat: 19.513469, lng: -80.566956 }, // Cayman Islands
  'KZ': { lat: 48.019573, lng: 66.923684 }, // Kazakhstan
  'LA': { lat: 19.85627, lng: 102.495496 }, // Laos
  'LB': { lat: 33.854721, lng: 35.862285 }, // Lebanon
  'LC': { lat: 13.909444, lng: -60.978893 }, // Saint Lucia
  'LI': { lat: 47.166, lng: 9.555373 }, // Liechtenstein
  'LK': { lat: 7.873054, lng: 80.771797 }, // Sri Lanka
  'LR': { lat: 6.428055, lng: -9.429499 }, // Liberia
  'LS': { lat: -29.609988, lng: 28.233608 }, // Lesotho
  'LT': { lat: 55.169438, lng: 23.881275 }, // Lithuania
  'LU': { lat: 49.815273, lng: 6.129583 }, // Luxembourg
  'LV': { lat: 56.879635, lng: 24.603189 }, // Latvia
  'LY': { lat: 26.3351, lng: 17.228331 }, // Libya
  'MA': { lat: 31.791702, lng: -7.09262 }, // Morocco
  'MC': { lat: 43.750298, lng: 7.412841 }, // Monaco
  'MD': { lat: 47.411631, lng: 28.369885 }, // Moldova
  'ME': { lat: 42.708678, lng: 19.37439 }, // Montenegro
  'MG': { lat: -18.766947, lng: 46.869107 }, // Madagascar
  'MH': { lat: 7.131474, lng: 171.184478 }, // Marshall Islands
  'MK': { lat: 41.608635, lng: 21.745275 }, // Macedonia [FYROM]
  'ML': { lat: 17.570692, lng: -3.996166 }, // Mali
  'MM': { lat: 21.913965, lng: 95.956223 }, // Myanmar [Burma]
  'MN': { lat: 46.862496, lng: 103.846656 }, // Mongolia
  'MO': { lat: 22.198745, lng: 113.543873 }, // Macau
  'MP': { lat: 17.33083, lng: 145.38469 }, // Northern Mariana Islands
  'MQ': { lat: 14.641528, lng: -61.024174 }, // Martinique
  'MR': { lat: 21.00789, lng: -10.940835 }, // Mauritania
  'MS': { lat: 16.742498, lng: -62.187366 }, // Montserrat
  'MT': { lat: 35.937496, lng: 14.375416 }, // Malta
  'MU': { lat: -20.348404, lng: 57.552152 }, // Mauritius
  'MV': { lat: 3.202778, lng: 73.22068 }, // Maldives
  'MW': { lat: -13.254308, lng: 34.301525 }, // Malawi
  'MX': { lat: 23.634501, lng: -102.552784 }, // Mexico
  'MY': { lat: 4.210484, lng: 101.975766 }, // Malaysia
  'MZ': { lat: -18.665695, lng: 35.529562 }, // Mozambique
  'NA': { lat: -22.95764, lng: 18.49041 }, // Namibia
  'NC': { lat: -20.904305, lng: 165.618042 }, // New Caledonia
  'NE': { lat: 17.607789, lng: 8.081666 }, // Niger
  'NF': { lat: -29.040835, lng: 167.954712 }, // Norfolk Island
  'NG': { lat: 9.081999, lng: 8.675277 }, // Nigeria
  'NI': { lat: 12.865416, lng: -85.207229 }, // Nicaragua
  'NL': { lat: 52.132633, lng: 5.291266 }, // Netherlands
  'NO': { lat: 60.472024, lng: 8.468946 }, // Norway
  'NP': { lat: 28.394857, lng: 84.124008 }, // Nepal
  'NR': { lat: -0.522778, lng: 166.931503 }, // Nauru
  'NU': { lat: -19.054445, lng: -169.867233 }, // Niue
  'NZ': { lat: -40.900557, lng: 174.885971 }, // New Zealand
  'OM': { lat: 21.512583, lng: 55.923255 }, // Oman
  'PA': { lat: 8.537981, lng: -80.782127 }, // Panama
  'PE': { lat: -9.189967, lng: -75.015152 }, // Peru
  'PF': { lat: -17.679742, lng: -149.406843 }, // French Polynesia
  'PG': { lat: -6.314993, lng: 143.95555 }, // Papua New Guinea
  'PH': { lat: 12.879721, lng: 121.774017 }, // Philippines
  'PK': { lat: 30.375321, lng: 69.345116 }, // Pakistan
  'PL': { lat: 51.919438, lng: 19.145136 }, // Poland
  'PM': { lat: 46.941936, lng: -56.27111 }, // Saint Pierre and Miquelon
  'PN': { lat: -24.703615, lng: -127.439308 }, // Pitcairn Islands
  'PR': { lat: 18.220833, lng: -66.590149 }, // Puerto Rico
  'PS': { lat: 31.952162, lng: 35.233154 }, // Palestinian Territories
  'PT': { lat: 39.399872, lng: -8.224454 }, // Portugal
  'PW': { lat: 7.51498, lng: 134.58252 }, // Palau
  'PY': { lat: -23.442503, lng: -58.443832 }, // Paraguay
  'QA': { lat: 25.354826, lng: 51.183884 }, // Qatar
  'RE': { lat: -21.115141, lng: 55.536384 }, // Réunion
  'RO': { lat: 45.943161, lng: 24.96676 }, // Romania
  'RS': { lat: 44.016521, lng: 21.005859 }, // Serbia
  'RU': { lat: 61.52401, lng: 105.318756 }, // Russia
  'RW': { lat: -1.940278, lng: 29.873888 }, // Rwanda
  'SA': { lat: 23.885942, lng: 45.079162 }, // Saudi Arabia
  'SB': { lat: -9.64571, lng: 160.156194 }, // Solomon Islands
  'SC': { lat: -4.679574, lng: 55.491977 }, // Seychelles
  'SD': { lat: 12.862807, lng: 30.217636 }, // Sudan
  'SE': { lat: 60.128161, lng: 18.643501 }, // Sweden
  'SG': { lat: 1.352083, lng: 103.819836 }, // Singapore
  'SH': { lat: -24.143474, lng: -10.030696 }, // Saint Helena
  'SI': { lat: 46.151241, lng: 14.995463 }, // Slovenia
  'SJ': { lat: 77.553604, lng: 23.670272 }, // Svalbard and Jan Mayen
  'SK': { lat: 48.669026, lng: 19.699024 }, // Slovakia
  'SL': { lat: 8.460555, lng: -11.779889 }, // Sierra Leone
  'SM': { lat: 43.94236, lng: 12.457777 }, // San Marino
  'SN': { lat: 14.497401, lng: -14.452362 }, // Senegal
  'SO': { lat: 5.152149, lng: 46.199616 }, // Somalia
  'SR': { lat: 3.919305, lng: -56.027783 }, // Suriname
  'ST': { lat: 0.18636, lng: 6.613081 }, // São Tomé and Príncipe
  'SV': { lat: 13.794185, lng: -88.89653 }, // El Salvador
  'SY': { lat: 34.802075, lng: 38.996815 }, // Syria
  'SZ': { lat: -26.522503, lng: 31.465866 }, // Swaziland
  'TC': { lat: 21.694025, lng: -71.797928 }, // Turks and Caicos Islands
  'TD': { lat: 15.454166, lng: 18.732207 }, // Chad
  'TF': { lat: -49.280366, lng: 69.348557 }, // French Southern Territories
  'TG': { lat: 8.619543, lng: 0.824782 }, // Togo
  'TH': { lat: 15.870032, lng: 100.992541 }, // Thailand
  'TJ': { lat: 38.861034, lng: 71.276093 }, // Tajikistan
  'TK': { lat: -8.967363, lng: -171.855881 }, // Tokelau
  'TL': { lat: -8.874217, lng: 125.727539 }, // Timor-Leste
  'TM': { lat: 38.969719, lng: 59.556278 }, // Turkmenistan
  'TN': { lat: 33.886917, lng: 9.537499 }, // Tunisia
  'TO': { lat: -21.178986, lng: -175.198242 }, // Tonga
  'TR': { lat: 38.963745, lng: 35.243322 }, // Turkey
  'TT': { lat: 10.691803, lng: -61.222503 }, // Trinidad and Tobago
  'TV': { lat: -7.109535, lng: 177.64933 }, // Tuvalu
  'TW': { lat: 23.69781, lng: 120.960515 }, // Taiwan
  'TZ': { lat: -6.369028, lng: 34.888822 }, // Tanzania
  'UA': { lat: 48.379433, lng: 31.16558 }, // Ukraine
  'UG': { lat: 1.373333, lng: 32.290275 }, // Uganda
  'US': { lat: 37.09024, lng: -95.712891 }, // United States
  'UY': { lat: -32.522779, lng: -55.765835 }, // Uruguay
  'UZ': { lat: 41.377491, lng: 64.585262 }, // Uzbekistan
  'VA': { lat: 41.902916, lng: 12.453389 }, // Vatican City
  'VC': { lat: 12.984305, lng: -61.287228 }, // Saint Vincent and the Grenadines
  'VE': { lat: 6.42375, lng: -66.58973 }, // Venezuela
  'VG': { lat: 18.420695, lng: -64.639968 }, // British Virgin Islands
  'VI': { lat: 18.335765, lng: -64.896335 }, // U.S. Virgin Islands
  'VN': { lat: 14.058324, lng: 108.277199 }, // Vietnam
  'VU': { lat: -15.376706, lng: 166.959158 }, // Vanuatu
  'WF': { lat: -13.768752, lng: -177.156097 }, // Wallis and Futuna
  'WS': { lat: -13.759029, lng: -172.104629 }, // Samoa
  'XK': { lat: 42.602636, lng: 20.902977 }, // Kosovo
  'YE': { lat: 15.552727, lng: 48.516388 }, // Yemen
  'YT': { lat: -12.8275, lng: 45.166244 }, // Mayotte
  'ZA': { lat: -30.559482, lng: 22.937506 }, // South Africa
  'ZM': { lat: -13.133897, lng: 27.849332 }, // Zambia
  'ZW': { lat: -19.015438, lng: 29.154857 }, // Zimbabwe
};

/**
 * Get coordinates for a country code
 */
export function getCountryCoordinates(countryCode: string): { lat: number; lng: number } | null {
  return countryCoordinates[countryCode.toUpperCase()] || null;
}

/**
 * Indonesia coordinates (our main destination)
 */
export const INDONESIA_COORDINATES = { lat: -0.7893, lng: 113.9213 };
