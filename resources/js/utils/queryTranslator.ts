import { RuleGroupType, Rule } from 'react-querybuilder';

export interface ApiQueryParams {
  [key: string]: string | number;
}

/**
 * Maps react-querybuilder field names to API parameter names
 * This handles nested fields and maps them to the appropriate API parameters
 */
const fieldMapping: Record<string, string> = {
  // Basic header fields - direct mapping
  'nomordaftar': 'nomordaftar',
  'tanggaldaftar': 'tanggaldaftar',
  'nomoraju': 'nomoraju',
  'kodejalur': 'kodejalur',
  
  // Entity mappings - map nested fields to the appropriate top-level filters
  'importir.namaentitas': 'namaimportir',
  'penjual.namaentitas': 'namapenjual',
  'pengirim.namaentitas': 'namapengirim',
  'ppjk.namaentitas': 'namappjk',
  
  // Nested fields that need special handling
  'barang.postarif': 'hscode',
  'barang.uraian': 'uraianbarang',
  'kontainer.nomorkontainer': 'nomorkontainer',
  
  // Calculated fields
  'calculated.items_count': 'barang',
  
  // Port and transportation - fixed mappings
  'kodepelmuat': 'pelabuhan_muat',
  'kodepeltransit': 'pelabuhan_transit', 
  'data.kodepelmuat': 'pelabuhan_muat',
  'data.kodepeltransit': 'pelabuhan_transit',
  'kodetps': 'kode_tps',
  'data.kodetps': 'kode_tps',
  'pengangkut.namapengangkut': 'nama_pengangkut',
  
  // Country mappings
  'penjual.kodenegara': 'negaraasal',
  'pengirim.kodenegara': 'negaraasal',
  
  // Data fields - these should NOT be mapped to different names for JSON queries
  // but need mapping for simple URL parameter queries
};

/**
 * Date field mappings for range queries
 */
const dateRangeFields: Record<string, { start: string; end: string }> = {
  'tanggaldaftar': { start: 'start_date', end: 'end_date' },
  'tanggaltiba': { start: 'start_arrival_date', end: 'end_arrival_date' },
  'tanggalbc11': { start: 'start_bc11_date', end: 'end_bc11_date' },
  'dokumen.tanggaldokumen': { start: 'start_doc_date', end: 'end_doc_date' },
};

/**
 * Converts a single rule to API query parameters
 */
function convertRule(rule: Rule): ApiQueryParams {
  const params: ApiQueryParams = {};
  const field = rule.field;
  const operator = rule.operator;
  const value = rule.value;

  // Skip empty values
  if (!value || value === '') {
    return params;
  }

  // Handle date range operators
  if (operator === 'between' && dateRangeFields[field]) {
    const dateRange = dateRangeFields[field];
    let betweenValues = value;
    
    // Parse comma-separated string values
    if (typeof value === 'string' && value.includes(',')) {
      betweenValues = value.split(',').map(v => v.trim());
    }
    
    if (Array.isArray(betweenValues) && betweenValues.length === 2) {
      params[dateRange.start] = betweenValues[0];
      params[dateRange.end] = betweenValues[1];
    }
    return params;
  }

  // Handle date comparison operators
  if (dateRangeFields[field]) {
    const dateRange = dateRangeFields[field];
    switch (operator) {
      case '>=':
      case '>':
        params[dateRange.start] = value;
        break;
      case '<=':
      case '<':
        params[dateRange.end] = value;
        break;
      case '=':
        params[dateRange.start] = value;
        params[dateRange.end] = value;
        break;
    }
    return params;
  }

  // Get the mapped field name or use the original if no mapping exists
  const mappedField = fieldMapping[field] || field;

  // Handle different operators
  switch (operator) {
    case '=':
    case 'equals':
      params[mappedField] = value;
      break;
    
    case 'contains':
    case 'like':
      // For text search, just use the value directly
      params[mappedField] = value;
      break;
    
    case 'beginsWith':
      // Use the value with implied startsWith behavior
      params[mappedField] = value;
      break;
    
    case 'endsWith':
      // Use the value with implied endsWith behavior  
      params[mappedField] = value;
      break;
    
    case 'in':
      if (Array.isArray(value)) {
        params[mappedField] = value.join(',');
      } else {
        params[mappedField] = value;
      }
      break;
    
    case '>=':
      params[`${mappedField}_min`] = value;
      break;
    
    case '<=':
      params[`${mappedField}_max`] = value;
      break;
    
    case '>':
      params[`${mappedField}_gt`] = value;
      break;
    
    case '<':
      params[`${mappedField}_lt`] = value;
      break;
    
    case 'between':
      let betweenValues = value;
      // Parse comma-separated string values
      if (typeof value === 'string' && value.includes(',')) {
        betweenValues = value.split(',').map(v => v.trim());
      }
      if (Array.isArray(betweenValues) && betweenValues.length === 2) {
        params[`${mappedField}_min`] = betweenValues[0];
        params[`${mappedField}_max`] = betweenValues[1];
      }
      break;
    
    case 'notBetween':
      let notBetweenValues = value;
      // Parse comma-separated string values
      if (typeof value === 'string' && value.includes(',')) {
        notBetweenValues = value.split(',').map(v => v.trim());
      }
      if (Array.isArray(notBetweenValues) && notBetweenValues.length === 2) {
        params[`${mappedField}_not_between_min`] = notBetweenValues[0];
        params[`${mappedField}_not_between_max`] = notBetweenValues[1];
      }
      break;
    
    case '!=':
    case 'doesNotEqual':
      params[`${mappedField}_not`] = value;
      break;
    
    case 'doesNotContain':
      params[`${mappedField}_not_contains`] = value;
      break;
    
    case 'null':
      params[`${mappedField}_null`] = 'true';
      break;
    
    case 'notNull':
      params[`${mappedField}_not_null`] = 'true';
      break;
    
    default:
      // Fallback to direct mapping for unknown operators
      params[mappedField] = value;
      break;
  }

  return params;
}

/**
 * Converts a rule group to API query parameters
 * Note: This implementation focuses on AND logic primarily
 * OR logic is complex to translate to simple query params and may need backend support
 */
function convertRuleGroup(group: RuleGroupType): ApiQueryParams {
  const params: ApiQueryParams = {};

  for (const rule of group.rules) {
    if ('rules' in rule) {
      // Nested rule group - recursively convert
      const nestedParams = convertRuleGroup(rule as RuleGroupType);
      Object.assign(params, nestedParams);
    } else {
      // Individual rule
      const ruleParams = convertRule(rule as Rule);
      Object.assign(params, ruleParams);
    }
  }

  return params;
}

/**
 * Check if query is simple enough for query params (only AND operations)
 */
function isSimpleQuery(query: RuleGroupType): boolean {
  // If top level is OR, it's complex
  if (query.combinator !== 'and') {
    return false;
  }
  
  for (const rule of query.rules) {
    if ('rules' in rule) {
      // Has nested groups - any nested groups make it complex
      // because URL params can't handle grouped OR logic properly
      return false;
    }
  }
    
  // Simple AND-only queries with no nested groups can use URL params
  return true;
}

/**
 * Main function to convert react-querybuilder query to API parameters
 */
export function translateQueryToApiParams(query: RuleGroupType): ApiQueryParams {
  if (!query || !query.rules || query.rules.length === 0) {
    return {};
  }

  // For complex queries with OR logic, send as JSON
  const simple = isSimpleQuery(query);
  
  if (!simple) {
    const jsonQuery = {
      query_json: JSON.stringify(query)
    };
    return jsonQuery;
  }

  // For simple AND-only queries, use the legacy parameter approach
  const params = convertRuleGroup(query);
  
  // Filter out empty values
  const filteredParams: ApiQueryParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      filteredParams[key] = value;
    }
  }

  return filteredParams;
}

/**
 * Process query rules to ensure proper operator handling
 */
function processQueryRules(query: RuleGroupType): RuleGroupType {
  const processedQuery = JSON.parse(JSON.stringify(query)); // Deep clone
  
  function processRules(group: any): void {
    if (group.rules) {
      group.rules.forEach((rule: any) => {
        if (rule.rules) {
          // Nested group, process recursively
          processRules(rule);
        } else {
          // Individual rule - convert 'like' to 'beginsWith' for certain fields
          if (rule.operator === 'like' && 
              (rule.field === 'kodepelmuat' || rule.field === 'kodepeltransit' || 
               rule.field === 'data.kodepelmuat' || rule.field === 'data.kodepeltransit')) {
            rule.operator = 'beginsWith';
            // Remove any % wildcards since beginsWith adds them automatically
            if (typeof rule.value === 'string') {
              rule.value = rule.value.replace(/^%|%$/g, '');
            }
          }
        }
      });
    }
  }
  
  processRules(processedQuery);
  return processedQuery;
}

/**
 * RuleSet-specific function that always uses JSON format for dedicated controller
 */
export function translateQueryToRuleSetParams(query: RuleGroupType): ApiQueryParams {
  if (!query || !query.rules || query.rules.length === 0) {
    return {};
  }

  // Process the query to ensure proper operators
  const processedQuery = processQueryRules(query);
  
  // Always use JSON format for RuleSet queries to ensure compatibility with dedicated controller
  const jsonQuery = {
    query_json: JSON.stringify(processedQuery)
  };
  
  return jsonQuery;
}

/**
 * Helper function to build URL search params from the translated parameters
 */
export function buildApiUrl(baseUrl: string, query: RuleGroupType, additionalParams: Record<string, string | number> = {}): string {
  const queryParams = translateQueryToApiParams(query);
  const allParams = { ...queryParams, ...additionalParams };
  
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(allParams)) {
    if (value !== '' && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
  
  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * RuleSet-specific URL builder that always uses JSON format
 */
export function buildRuleSetApiUrl(baseUrl: string, query: RuleGroupType, additionalParams: Record<string, string | number> = {}): string {
  const queryParams = translateQueryToRuleSetParams(query);
  const allParams = { ...queryParams, ...additionalParams };
  
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(allParams)) {
    if (value !== '' && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
  
  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Validation function to check if a query is valid and can be translated
 */
export function validateQuery(query: RuleGroupType): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!query || !query.rules || query.rules.length === 0) {
    errors.push('Query is empty');
    return { valid: false, errors };
  }

  // Add validation logic here as needed
  // For example, check for unsupported field combinations
  
  return { valid: errors.length === 0, errors };
}

/**
 * Helper to get supported fields for the query builder
 */
export function getSupportedFields(): string[] {
  return Object.keys(fieldMapping);
}

/**
 * Debug function to log the query translation
 */
export function debugTranslation(query: RuleGroupType): void {
  // Debug function removed for production
}
