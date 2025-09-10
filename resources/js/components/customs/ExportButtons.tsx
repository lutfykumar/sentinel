import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';

interface FilterState {
  start_date: string;
  end_date: string;
  nomordaftar: string;
  namaimportir: string;
  namapenjual: string;
  namapengirim: string;
  namappjk: string;
  negaraasal: string;
  uraianbarang: string;
  hscode: string;
  nomorkontainer: string;
}

interface ExportButtonsProps {
  filters: FilterState;
}

export default function ExportButtons({ filters }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(format);
    
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value);
        }
      });

      // Determine the export endpoint
      let endpoint = '';
      let filename = '';
      let contentType = '';

      switch (format) {
        case 'excel':
          endpoint = '/data/api/export/excel';
          filename = `customs_data_${new Date().toISOString().split('T')[0]}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          // PDF export would need to be implemented separately
          console.log('PDF export not yet implemented');
          return;
        default:
          return;
      }

      // Make the export request
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      // You could add a toast notification here
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting !== null}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? `Exporting ${isExporting.toUpperCase()}...` : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleExport('excel')}
          disabled={isExporting !== null}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export to Excel
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={true} // Disable PDF for now
          className="opacity-50"
        >
          <File className="h-4 w-4 mr-2" />
          Export to PDF (Coming Soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
