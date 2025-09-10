// Customs reference data for lookups

export const JENIS_API_REFERENCES: Record<string, string> = {
  '1': 'ANGKA PENGENAL IMPORTIR UMUM (APIU)',
  '01': 'ANGKA PENGENAL IMPORTIR UMUM (APIU)',
  '2': 'ANGKA PENGENAL IMPORTIR PERSEROAN (APIP)',
  '02': 'ANGKA PENGENAL IMPORTIR PERSEROAN (APIP)',
  '4': 'ANGKA PENGENAL IMPORTIR TERBATAS (APIT)',
  '04': 'ANGKA PENGENAL IMPORTIR TERBATAS (APIT)',
};

export const KODE_ENTITAS_REFERENCES = {
  '1': 'Importir',
  '4': 'PPJK',
  '7': 'Pemilik',
  '9': 'Pengirim',
  '10': 'Penjual',
};

// Helper function to get entity data by code
export const getEntityByCode = (entitas: any[], kodeEntitas: string) => {
  return entitas?.find((entity: any) => entity.kodeentitas === kodeEntitas) || null;
};

// Helper function to format PIB number with date
export const formatPIB = (nomordaftar: string, tanggaldaftar: string) => {
  if (!nomordaftar || !tanggaldaftar) return '-';
  const date = new Date(tanggaldaftar);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${nomordaftar} / ${year}-${month}-${day}`;
};

// Helper function to format code with name
export const formatCodeWithName = (code: string | null, name: string | null) => {
  if (!code && !name) return '-';
  if (code && name) return `${code} - ${name}`;
  return code || name || '-';
};

// Helper function to format country code with name
export const formatCountryCodeWithName = (kodenegara: string | null, namanegara: string | null) => {
  if (!kodenegara && !namanegara) return '-';
  if (kodenegara && namanegara) return `${kodenegara} / ${namanegara.toUpperCase()}`;
  return kodenegara || namanegara || '-';
};

// Helper function to get reference value safely
export const getReferenceValue = (code: string | null | undefined, referenceTable: Record<string, string>): string => {
  if (!code) return '-';
  return referenceTable[code] || referenceTable[code.padStart(2, '0')] || 'Unknown';
};

// Helper function to format code with reference lookup
export const formatCodeWithReference = (code: string | null | undefined, referenceTable: Record<string, string>): string => {
  if (!code) return '-';
  const referenceName = getReferenceValue(code, referenceTable);
  return `${code} - ${referenceName}`;
};

// Helper function to format ID with first 16 digits + name (for entity IDs)
export const formatEntityIdWithName = (id: string | null, name: string | null): string => {
  if (!id && !name) return '-';
  if (!id) return name || '-';
  if (!name) return id.length > 16 ? id.substring(0, 16) : id;
  
  const truncatedId = id.length > 16 ? id.substring(0, 16) : id;
  return `${truncatedId} - ${name}`;
};
