/**
 * Referensi Jenis API
 * Tabel referensi Jenis API pada sistem CEISA 4.0
 * 
 * Source: CEISA 4.0 Reference Documentation
 * Last Updated: 2025-09-07
 */

export const JENIS_API_REFERENCES: Record<string, string> = {
  // Support both single digit and zero-padded formats
  '1': 'ANGKA PENGENAL IMPORTIR UMUM (APIU)',
  '01': 'ANGKA PENGENAL IMPORTIR UMUM (APIU)',
  
  '2': 'ANGKA PENGENAL IMPORTIR PERSEROAN (APIP)',
  '02': 'ANGKA PENGENAL IMPORTIR PERSEROAN (APIP)',
  
  '4': 'ANGKA PENGENAL IMPORTIR TERBATAS (APIT)',
  '04': 'ANGKA PENGENAL IMPORTIR TERBATAS (APIT)',
};

/**
 * Get Jenis API name by code
 * @param code - The API type code (e.g., '1', '01', '2', '02', '4', '04')
 * @returns The full name of the API type
 */
export const getJenisApiName = (code: string | null | undefined): string => {
  if (!code) return 'Unknown';
  return JENIS_API_REFERENCES[code] || JENIS_API_REFERENCES[code.padStart(2, '0')] || 'Unknown';
};

/**
 * Format code with Jenis API name
 * @param code - The API type code
 * @returns Formatted string like "02 - ANGKA PENGENAL IMPORTIR PERSEROAN (APIP)"
 */
export const formatJenisApi = (code: string | null | undefined): string => {
  if (!code) return '-';
  const name = getJenisApiName(code);
  return `${code} - ${name}`;
};
