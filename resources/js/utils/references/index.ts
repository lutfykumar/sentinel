// Centralized reference data for customs lookups
// This structure allows for easy addition of new reference tables

// Import individual reference tables
import { JENIS_API_REFERENCES } from './jenisApi';
// Future imports:
// import { NEGARA_REFERENCES } from './negara';
// import { PELABUHAN_REFERENCES } from './pelabuhan';
// import { MATA_UANG_REFERENCES } from './mataUang';

// Export all reference tables
export {
  JENIS_API_REFERENCES,
  // Future exports:
  // NEGARA_REFERENCES,
  // PELABUHAN_REFERENCES,
  // MATA_UANG_REFERENCES,
};

// Re-export helper functions from main customsReferences
export {
  getEntityByCode,
  formatPIB,
  formatCodeWithName,
  formatCountryCodeWithName,
  getReferenceValue,
  formatCodeWithReference,
  KODE_ENTITAS_REFERENCES,
} from '../customsReferences';
