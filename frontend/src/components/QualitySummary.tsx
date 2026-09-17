/**
 * src/components/QualitySummary.tsx
 *
 * KPI cards for data quality metrics.
 */

import { AlertTriangle, AlertCircle, Info, Copy, Ghost } from "lucide-react";
import type { QualityResult } from "@/types/dataset";

export default function QualitySummary({ quality }: { quality: QualityResult }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* Critical */}
      <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-[12px] font-bold uppercase tracking-wider">Critical</span>
        </div>
        <span className="text-2xl font-bold text-red-700">{quality.critical_count}</span>
      </div>

      {/* Warnings */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-[12px] font-bold uppercase tracking-wider">Warnings</span>
        </div>
        <span className="text-2xl font-bold text-amber-700">{quality.warning_count}</span>
      </div>

      {/* Info */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-600">
          <Info className="w-4 h-4" />
          <span className="text-[12px] font-bold uppercase tracking-wider">Info Notes</span>
        </div>
        <span className="text-2xl font-bold text-blue-700">{quality.info_count}</span>
      </div>

      {/* Missing Cells */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-500">
          <Ghost className="w-4 h-4" />
          <span className="text-[12px] font-bold uppercase tracking-wider">Missing Cells</span>
        </div>
        <span className="text-2xl font-bold text-navy">{quality.total_missing_cells.toLocaleString()}</span>
      </div>

      {/* Duplicate Rows */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-500">
          <Copy className="w-4 h-4" />
          <span className="text-[12px] font-bold uppercase tracking-wider">Dupes</span>
        </div>
        <span className="text-2xl font-bold text-navy">{quality.total_duplicate_rows.toLocaleString()}</span>
      </div>
    </div>
  );
}

