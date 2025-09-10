# Customs Reference Data

This directory contains reference lookup tables for various customs codes used in CEISA 4.0 system.

## Structure

Each reference table should be in its own file with the following structure:

### File Template (`example.ts`)

```typescript
/**
 * Referensi [Name]
 * Tabel referensi [Description] pada sistem CEISA 4.0
 * 
 * Source: CEISA 4.0 Reference Documentation
 * Last Updated: YYYY-MM-DD
 */

export const [NAME]_REFERENCES: Record<string, string> = {
  // Support both single digit and zero-padded formats if needed
  '1': 'Full Name 1',
  '01': 'Full Name 1',
  
  '2': 'Full Name 2',
  '02': 'Full Name 2',
};

/**
 * Get [name] name by code
 * @param code - The [name] code
 * @returns The full name
 */
export const get[Name]Name = (code: string | null | undefined): string => {
  if (!code) return 'Unknown';
  return [NAME]_REFERENCES[code] || [NAME]_REFERENCES[code.padStart(2, '0')] || 'Unknown';
};

/**
 * Format code with [name] name
 * @param code - The [name] code
 * @returns Formatted string like "02 - Full Name 2"
 */
export const format[Name] = (code: string | null | undefined): string => {
  if (!code) return '-';
  const name = get[Name]Name(code);
  return `${code} - ${name}`;
};
```

## Current Reference Tables

1. **jenisApi.ts** - Jenis API (API Types)
   - Used for: `bc20_entitas.kodejenisapi`
   - Values: '1'/'01' (APIU), '2'/'02' (APIP), '4'/'04' (APIT)

## Future Reference Tables

You can add more reference tables for:

- **negara.ts** - Country codes and names
- **pelabuhan.ts** - Port codes and names  
- **mataUang.ts** - Currency codes and names
- **dokumen.ts** - Document types
- **entitas.ts** - Entity types
- **kondisiBarang.ts** - Goods condition codes
- **jenisKemasan.ts** - Packaging types
- **unitSatuan.ts** - Unit measurements

## How to Add New Reference Table

1. Create new file: `newReference.ts`
2. Follow the template structure above
3. Add import/export in `index.ts`:
   ```typescript
   import { NEW_REFERENCE } from './newReference';
   export { NEW_REFERENCE };
   ```
4. Use in components:
   ```typescript
   import { formatNewReference } from '@/utils/references/newReference';
   ```

## Notes

- Always support both single digit and zero-padded formats for numeric codes
- Include JSDoc comments for better developer experience
- Keep the source and last updated information
- Test with actual data to ensure all codes are covered
