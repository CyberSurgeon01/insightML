/**
 * src/components/ExportSection.tsx
 *
 * Phase 8: Analysis Exports
 * Buttons for generating JSON, CSVs, and PDF summaries.
 */

"use client";

import { useState } from "react";
import { Download, FileText, FileJson, FileSpreadsheet, Loader2, ChevronDown } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";
import { exportReportJson, exportReportCsv, exportReportPdf } from "@/lib/api";

interface ExportSectionProps {
  data: UploadResponse;
}

export default function ExportSection({ data }: ExportSectionProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState<string | null>(null);
  const [showCsvMenu, setShowCsvMenu] = useState(false);

  const handlePdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportReportPdf(data);
    } catch (e) {
      alert("Failed to export PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleJson = async () => {
    setIsExportingJson(true);
    try {
      await exportReportJson(data);
    } catch (e) {
      alert("Failed to export JSON.");
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleCsv = async (type: string) => {
    setExportingCsv(type);
    try {
      await exportReportCsv(data, type);
    } catch (e) {
      alert(`Failed to export ${type} CSV.`);
    } finally {
      setExportingCsv(null);
      setShowCsvMenu(false);
    }
  };

  const csvOptions = [
    { type: "profile", label: "Column Profile" },
    { type: "numerical", label: "Numerical Relationships" },
    { type: "categorical", label: "Categorical Relationships" },
    { type: "quality", label: "Data Quality Warnings" },
    { type: "insights", label: "Smart Insights" },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div className="flex flex-col">
        <h3 className="text-[15px] font-bold text-navy flex items-center gap-2">
          <Download className="w-4 h-4 text-slate-500" />
          Export Analysis Reports
        </h3>
        <p className="text-[13px] text-slate-500 mt-1">
          Exports contain analysis results, not your original uploaded dataset.
        </p>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        
        {/* CSV Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowCsvMenu(!showCsvMenu)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-100 transition-colors"
          >
            {exportingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            <span>CSV Data</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </button>
          
          {showCsvMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCsvMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden py-1">
                {csvOptions.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => handleCsv(opt.type)}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 hover:text-navy transition-colors flex items-center justify-between"
                  >
                    {opt.label}
                    {exportingCsv === opt.type && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* JSON Button */}
        <button 
          onClick={handleJson}
          disabled={isExportingJson}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          {isExportingJson ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
          <span className="hidden sm:inline">Full JSON</span>
        </button>
        
        {/* PDF Button */}
        <button 
          onClick={handlePdf}
          disabled={isExportingPdf}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-[13px] font-medium shadow-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span>Executive PDF</span>
        </button>

      </div>
    </div>
  );
}
