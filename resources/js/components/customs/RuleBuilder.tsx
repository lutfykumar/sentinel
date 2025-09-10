import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, RotateCcw, Save, FolderOpen, Download } from 'lucide-react';
import {
  QueryBuilder,
  RuleGroupType,
  Field,
  Operator,
  defaultOperators,
  formatQuery,
  parseSQL,
} from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';
import '../../../css/querybuilder.css';
import useAuth from '@/hooks/useAuth';
import SaveRuleSetModal from './SaveRuleSetModal';
import LoadRuleSetModal from './LoadRuleSetModal';
import ExportModal from './ExportModal';

interface RuleBuilderProps {
  onQueryChange: (query: RuleGroupType) => void;
  onExecuteQuery: () => void;
  onReset: () => void;
  loading: boolean;
  hasResults: boolean;
  query: RuleGroupType;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onExport?: (format: 'excel', sections: string[]) => void;
}

// Comprehensive field definitions covering all customs data
const fields: Field[] = [
  // Basic Header Fields
  { name: 'nomordaftar', label: 'PIB Number', datatype: 'text' },
  { name: 'tanggaldaftar', label: 'PIB Date', datatype: 'date', valueEditorType: 'date' },
  { name: 'nomoraju', label: 'CAR Number', datatype: 'text' },
  { name: 'kodejalur', label: 'Route Code', datatype: 'text' },
  
  // Office & Processing
  { name: 'kodekantor', label: 'Office Code', datatype: 'text' },
  { name: 'namakantor', label: 'Office Name', datatype: 'text' },
  { name: 'namakantorpendek', label: 'Short Office Name', datatype: 'text' },
  { name: 'kodedokumen', label: 'Document Code', datatype: 'text' },
  { name: 'kodeproses', label: 'Process Code', datatype: 'text' },
  { name: 'namarespon', label: 'Response Name', datatype: 'text' },
  
  // Value & Financial Data (from bc20_data table)
  { name: 'data.netto', label: 'Net Weight', datatype: 'number' },
  { name: 'data.bruto', label: 'Gross Weight', datatype: 'number' },
  { name: 'data.cif', label: 'CIF Value', datatype: 'number' },
  { name: 'data.ndpbm', label: 'NDPBM Rate', datatype: 'number' },
  { name: 'data.kodevaluta', label: 'Currency Code', datatype: 'text' },
  { name: 'data.fob', label: 'FOB Value', datatype: 'number' },
  { name: 'data.freight', label: 'Freight Value', datatype: 'number' },
  { name: 'data.asuransi', label: 'Insurance Value', datatype: 'number' },
  { name: 'data.volume', label: 'Volume', datatype: 'number' },
  
  // Ports & Transportation
  { name: 'kodepelmuat', label: 'Loading Port Code', datatype: 'text' },
  { name: 'namapelabuhanmuat', label: 'Loading Port Name', datatype: 'text' },
  { name: 'kodepeltransit', label: 'Transit Port Code', datatype: 'text' },
  { name: 'namapelabuhantransit', label: 'Transit Port Name', datatype: 'text' },
  { name: 'tanggaltiba', label: 'Arrival Date', datatype: 'date', valueEditorType: 'date' },
  
  // BC 1.1 Data
  { name: 'nomorbc11', label: 'BC11 Number', datatype: 'text' },
  { name: 'tanggalbc11', label: 'BC11 Date', datatype: 'date', valueEditorType: 'date' },
  { name: 'posbc11', label: 'BC11 Position', datatype: 'text' },
  { name: 'subposbc11', label: 'BC11 Sub Position', datatype: 'text' },
  
  // Warehouse & TPS
  { name: 'kodetps', label: 'TPS Code', datatype: 'text' },
  { name: 'namatpswajib', label: 'TPS Name', datatype: 'text' },
  
  // Entity Fields (Importir, PPJK, Penjual, Pengirim, Pemilik)
  { name: 'importir.namaentitas', label: 'Importer Name', datatype: 'text' },
  { name: 'importir.nomoridentitas', label: 'Importer ID Number', datatype: 'text' },
  { name: 'importir.alamatentitas', label: 'Importer Address', datatype: 'text' },
  { name: 'importir.kodestatus', label: 'Importer Status', datatype: 'text' },
  { name: 'importir.kodejenisapi', label: 'Importer API Type', datatype: 'text' },
  { name: 'importir.nomorapi', label: 'Importer API Number', datatype: 'text' },
  { name: 'importir.kodenegara', label: 'Importer Country Code', datatype: 'text' },
  { name: 'importir.namanegara', label: 'Importer Country Name', datatype: 'text' },
  
  { name: 'ppjk.namaentitas', label: 'PPJK Name', datatype: 'text' },
  { name: 'ppjk.nomoridentitas', label: 'PPJK ID Number', datatype: 'text' },
  { name: 'ppjk.alamatentitas', label: 'PPJK Address', datatype: 'text' },
  
  { name: 'penjual.namaentitas', label: 'Seller Name', datatype: 'text' },
  { name: 'penjual.alamatentitas', label: 'Seller Address', datatype: 'text' },
  { name: 'penjual.kodenegara', label: 'Seller Country Code', datatype: 'text' },
  { name: 'penjual.namanegara', label: 'Seller Country Name', datatype: 'text' },
  
  { name: 'pengirim.namaentitas', label: 'Shipper Name', datatype: 'text' },
  { name: 'pengirim.alamatentitas', label: 'Shipper Address', datatype: 'text' },
  { name: 'pengirim.kodenegara', label: 'Shipper Country Code', datatype: 'text' },
  { name: 'pengirim.namanegara', label: 'Shipper Country Name', datatype: 'text' },
  
  { name: 'pemilik.namaentitas', label: 'Owner Name', datatype: 'text' },
  { name: 'pemilik.alamatentitas', label: 'Owner Address', datatype: 'text' },
  
  // Carrier/Transport Data
  { name: 'pengangkut.namapengangkut', label: 'Carrier Name', datatype: 'text' },
  { name: 'pengangkut.nomorpengangkut', label: 'Voyage/Flight Number', datatype: 'text' },
  { name: 'pengangkut.kodebendera', label: 'Flag Country Code', datatype: 'text' },
  { name: 'pengangkut.namanegara', label: 'Flag Country Name', datatype: 'text' },
  
  // Goods Data (from bc20_barang table)
  { name: 'barang.seribarang', label: 'Goods Serial Number', datatype: 'number' },
  { name: 'barang.postarif', label: 'HS Code', datatype: 'text' },
  { name: 'barang.uraian', label: 'Goods Description', datatype: 'text' },
  { name: 'barang.cif', label: 'Goods CIF Value', datatype: 'number' },
  { name: 'barang.fob', label: 'Goods FOB Value', datatype: 'number' },
  { name: 'barang.freight', label: 'Goods Freight Value', datatype: 'number' },
  { name: 'barang.asuransi', label: 'Goods Insurance Value', datatype: 'number' },
  { name: 'barang.bruto', label: 'Goods Gross Weight', datatype: 'number' },
  { name: 'barang.netto', label: 'Goods Net Weight', datatype: 'number' },
  { name: 'barang.volume', label: 'Goods Volume', datatype: 'number' },
  { name: 'barang.jumlahsatuan', label: 'Quantity', datatype: 'number' },
  { name: 'barang.kodesatuanbarang', label: 'Unit Code', datatype: 'text' },
  { name: 'barang.namasatuanbarang', label: 'Unit Name', datatype: 'text' },
  
  // Package Data (from bc20_kemasan table)
  { name: 'kemasan.jumlahkemasan', label: 'Package Quantity', datatype: 'number' },
  { name: 'kemasan.kodejeniskemasan', label: 'Package Type Code', datatype: 'text' },
  { name: 'kemasan.namakemasan', label: 'Package Type Name', datatype: 'text' },
  { name: 'kemasan.serikemasan', label: 'Package Serial', datatype: 'number' },
  
  // Container Data
  { name: 'kontainer.serikontainer', label: 'Container Serial', datatype: 'number' },
  { name: 'kontainer.nomorkontainer', label: 'Container Number', datatype: 'text' },
  { name: 'kontainer.namaukurankontainer', label: 'Container Size', datatype: 'text' },
  { name: 'kontainer.namajeniskontainer', label: 'Container Type', datatype: 'text' },
  
  // Calculated Fields
  { name: 'calculated.gross_weight_per_teus', label: 'Gross Weight per TEUS', datatype: 'number' },
  { name: 'calculated.items_count', label: 'Goods Count', datatype: 'number' },
  { name: 'calculated.total_paid', label: 'Total Paid', datatype: 'number' },
  
  // Document Data
  { name: 'dokumen.seridokumen', label: 'Document Serial', datatype: 'number' },
  { name: 'dokumen.namadokumen', label: 'Document Name', datatype: 'text' },
  { name: 'dokumen.nomordokumen', label: 'Document Number', datatype: 'text' },
  { name: 'dokumen.tanggaldokumen', label: 'Document Date', datatype: 'date', valueEditorType: 'date' },
  { name: 'dokumen.namafasilitas', label: 'Facility Name', datatype: 'text' },
  
  // Levy/Tax Data
  { name: 'pungutan.keterangan', label: 'Tax Type', datatype: 'text' },
  { name: 'pungutan.dibayar', label: 'Tax Amount Paid', datatype: 'number' },
];

// Enhanced operators for better query building
const operators: Operator[] = [
  ...defaultOperators.filter(op => 
    ['=', '!=', '<', '<=', '>', '>=', 'contains', 'beginsWith', 'endsWith', 'doesNotContain', 'null', 'notNull', 'in', 'notIn', 'between', 'notBetween'].includes(op.name)
  ),
];

// Default query structure
const initialQuery: RuleGroupType = {
  combinator: 'and',
  rules: []
};

export default function RuleBuilder({
  onQueryChange,
  onExecuteQuery,
  onReset,
  loading,
  hasResults,
  query,
  onSuccess,
  onError,
  onExport
}: RuleBuilderProps) {
  const { hasPermission } = useAuth();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleQueryChange = (newQuery: RuleGroupType) => {
    onQueryChange(newQuery);
  };

  const handleReset = () => {
    onQueryChange(initialQuery);
    onReset();
  };

  const handleLoadRuleSet = (rules: RuleGroupType, name: string) => {
    onQueryChange(rules);
  };

  const handleSuccess = (message: string) => {
    if (onSuccess) {
      onSuccess(message);
    }
  };

  const handleError = (message: string) => {
    if (onError) {
      onError(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Query Builder */}
      <div className="border-2 rounded-lg p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
            Level 0 (Main)
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-4"></span>
            Level 1
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full ml-2"></span>
            Level 2
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-2"></span>
            Level 3
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full ml-2"></span>
            Level 4+
          </div>
        </div>
        <QueryBuilder
          fields={fields}
          operators={operators}
          query={query}
          onQueryChange={handleQueryChange}
          controlClassnames={{
            queryBuilder: 'query-builder-custom',
            ruleGroup: 'rule-group-custom',
            rule: 'rule-custom',
            combinatorSelector: 'combinator-selector-custom',
            fieldSelector: 'field-selector-custom',
            operatorSelector: 'operator-selector-custom',
            valueEditor: 'value-editor-custom',
            addRule: 'add-rule-custom',
            addGroup: 'add-group-custom',
            cloneRule: 'clone-rule-custom',
            cloneGroup: 'clone-group-custom',
            removeRule: 'remove-rule-custom',
            removeGroup: 'remove-group-custom',
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:flex-wrap sm:gap-3">
        <Button
          variant="outline"
          onClick={onExecuteQuery}
          disabled={loading}
          className="flex items-center gap-2 border-blue-300 dark:border-blue-500 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 px-6 py-2 font-semibold border-2 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-4 w-4" />
          {loading ? 'Executing Query...' : 'Execute Query'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-2 border-red-300 dark:border-red-500 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 px-6 py-2 font-semibold border-2 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Query
        </Button>

        {/* Save Rule Set - Only show if user has create permission */}
        {hasPermission('rulesets.create') && (
          <Button
            variant="outline"
            onClick={() => setSaveModalOpen(true)}
            disabled={loading || !query.rules || query.rules.length === 0}
            className="flex items-center gap-2 border-green-300 dark:border-green-500 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 px-6 py-2 font-semibold border-2 rounded-lg hover:shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Rule Set
          </Button>
        )}

        {/* Load Rule Set - Show if user has view permission */}
        {hasPermission('rulesets.view') && (
          <Button
            variant="outline"
            onClick={() => setLoadModalOpen(true)}
            disabled={loading}
            className="flex items-center gap-2 border-purple-300 dark:border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 px-6 py-2 font-semibold border-2 rounded-lg hover:shadow-md disabled:opacity-50"
          >
            <FolderOpen className="h-4 w-4" />
            Load Rule Set
          </Button>
        )}

        {/* Export Results - Show when there are results and onExport is provided */}
        {hasResults && onExport && hasPermission('data.export') && (
          <Button
            variant="outline"
            onClick={() => setExportModalOpen(true)}
            disabled={loading}
            className="flex items-center gap-2 border-green-300 dark:border-green-500 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 px-6 py-2 font-semibold border-2 rounded-lg hover:shadow-md disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        )}

      </div>

      {/* Query Preview */}
      {query.rules.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/10">
          <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Query Preview:</h4>
          <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
            {formatQuery(query, 'sql')}
          </pre>
        </div>
      )}

      {/* Save Rule Set Modal */}
      <SaveRuleSetModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSuccess={handleSuccess}
        onError={handleError}
        query={query}
      />

      {/* Load Rule Set Modal */}
      <LoadRuleSetModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        onLoad={handleLoadRuleSet}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Export Modal */}
      {onExport && (
        <ExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onExport={onExport}
          hasResults={hasResults}
        />
      )}
    </div>
  );
}
