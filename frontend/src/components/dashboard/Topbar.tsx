/**
 * src/components/dashboard/Topbar.tsx
 */
"use client";

import { Menu, FileSpreadsheet, Download, RefreshCw } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";

interface TopbarProps {
  data: UploadResponse;
  filename: string;
  onReset: () => void;
  onMenuToggle: () => void;
  onChangeView: (view: string) => void;
}

export default function Topbar({ data, filename, onReset, onMenuToggle, onChangeView }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-navy rounded-lg hover:bg-slate-50"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 hidden sm:block" />
          <span className="text-[13px] font-bold text-navy max-w-[150px] sm:max-w-[300px] truncate">
            {filename}
          </span>
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 ml-2">
            <span className="text-[11px] font-medium text-slate-600">{data.rows.toLocaleString()} rows</span>
            <span className="text-slate-300 px-1">|</span>
            <span className="text-[11px] font-medium text-slate-600">{data.columns.toLocaleString()} cols</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChangeView("reports")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-navy transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Change Dataset</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </div>
    </header>
  );
}

