import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, FileSpreadsheet, FileText, Database, Truck, Calculator } from 'lucide-react';

interface ExportSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

interface ExportPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  sections: string[];
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'excel', sections: string[]) => void;
  hasResults: boolean;
}

const exportSections: ExportSection[] = [
  {
    id: 'basic',
    label: 'Basic Information',
    icon: <FileText className="h-4 w-4" />,
    description: 'PIB, Date, Route, Company, PPJK, Seller',
    enabled: true, // Always enabled as it's the base data
  },
  {
    id: 'general',
    label: 'General Data (Data Umum)',
    icon: <Database className="h-4 w-4" />,
    description: 'Office details, Importers, Sellers, Port information',
    enabled: false,
  },
  {
    id: 'values',
    label: 'Value Data (Data Nilai)',
    icon: <Calculator className="h-4 w-4" />,
    description: 'NETTO, BRUTO, CIF, NDPBM, Customs Value',
    enabled: false,
  },
  {
    id: 'bc11',
    label: 'BC 1.1 & Arrival Data',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Arrival dates, BC11 numbers, Position details',
    enabled: false,
  },
  {
    id: 'warehouse',
    label: 'Warehouse & Transport',
    icon: <Truck className="h-4 w-4" />,
    description: 'TPS details, Carrier information, Voyage/Flight numbers',
    enabled: false,
  },
  {
    id: 'goods',
    label: 'Goods Details',
    icon: <FileText className="h-4 w-4" />,
    description: 'Per-item breakdown, HS codes, quantities, unit prices (Multiple rows per PIB)',
    enabled: false,
  },
  {
    id: 'documents',
    label: 'Documents (Data Lampiran)',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Invoice, packing lists, certificates (Multiple rows per PIB)',
    enabled: false,
  },
  {
    id: 'containers',
    label: 'Container Information',
    icon: <Database className="h-4 w-4" />,
    description: 'Container numbers, sizes, types (Multiple rows per PIB)',
    enabled: false,
  },
  {
    id: 'duties',
    label: 'Tax/Duties (Data Pungutan)',
    icon: <Calculator className="h-4 w-4" />,
    description: 'BM, PPH, PPN, Total amounts payable',
    enabled: false,
  },
];

const exportPresets: ExportPreset[] = [
  {
    id: 'basic',
    name: 'Basic Report',
    description: 'Essential information for general overview',
    icon: <FileText className="h-5 w-5" />,
    sections: ['basic', 'general'],
  },
  {
    id: 'financial',
    name: 'Financial Report',
    description: 'Values, taxes, and financial details',
    icon: <Calculator className="h-5 w-5" />,
    sections: ['basic', 'values', 'duties'],
  },
  {
    id: 'logistics',
    name: 'Logistics Report',
    description: 'Transport, containers, and goods movement',
    icon: <Truck className="h-5 w-5" />,
    sections: ['basic', 'warehouse', 'goods', 'containers'],
  },
  {
    id: 'complete',
    name: 'Complete Report',
    description: 'All available data (largest file size)',
    icon: <Database className="h-5 w-5" />,
    sections: ['basic', 'general', 'values', 'bc11', 'warehouse', 'goods', 'documents', 'containers', 'duties'],
  },
];

export default function ExportModal({ open, onClose, onExport, hasResults }: ExportModalProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(['basic']);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: ExportPreset) => {
    setActivePreset(preset.id);
    setSelectedSections(preset.sections);
  };

  const handleSectionToggle = (sectionId: string, enabled: boolean) => {
    setActivePreset(null); // Clear active preset when manually changing sections
    if (sectionId === 'basic') return; // Basic is always required
    
    if (enabled) {
      setSelectedSections(prev => [...prev, sectionId]);
    } else {
      setSelectedSections(prev => prev.filter(id => id !== sectionId));
    }
  };

  const handleExport = (format: 'excel') => {
    onExport(format, selectedSections);
    onClose();
  };

  const getSelectedSectionsCount = () => selectedSections.length;
  const getEstimatedRows = () => {
    // Base estimation logic - you can adjust based on your data
    if (selectedSections.includes('containers')) {
      return "Multiple rows per PIB (container-level detail)";
    }
    if (selectedSections.includes('goods')) {
      return "Multiple rows per PIB (goods-level detail)";
    }
    if (selectedSections.includes('documents')) {
      return "Multiple rows per PIB (document-level detail)";
    }
    return "One row per PIB";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] lg:w-[90vw] xl:w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Download className="h-6 w-6" />
            Export Configuration
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose what data to include in your export. Selected data will be exported with container-level detail when applicable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div>
            <h3 className="text-lg font-semibold mb-4">📋 Quick Presets</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {exportPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md min-h-[120px] ${
                    activePreset === preset.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {preset.icon}
                    <span className="font-medium text-base">{preset.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{preset.description}</p>
                  <div className="mt-3 text-xs text-primary font-medium">
                    {preset.sections.length} sections
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">⚙️ Custom Selection</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {exportSections.map((section) => {
                const isSelected = selectedSections.includes(section.id);
                const isDisabled = section.id === 'basic'; // Basic is always required
                
                return (
                  <div
                    key={section.id}
                    className={`p-4 border rounded-lg transition-all min-h-[80px] ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    } ${isDisabled ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={section.id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => 
                          handleSectionToggle(section.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={section.id} 
                          className="flex items-center gap-2 font-medium cursor-pointer text-base"
                        >
                          {section.icon}
                          {section.label}
                          {isDisabled && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-muted/30 p-5 rounded-lg">
            <h4 className="font-semibold mb-3 text-base">📊 Export Summary</h4>
            <div className="text-sm space-y-2">
              <div>Selected sections: <strong>{getSelectedSectionsCount()}</strong></div>
              <div>Data structure: <strong>{getEstimatedRows()}</strong></div>
              <div className="text-muted-foreground mt-3 text-xs">
                ℹ️ Container and goods details will create multiple rows per PIB for detailed analysis.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button
            onClick={() => handleExport('excel')}
            disabled={!hasResults}
            className="flex items-center gap-2 px-6"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
