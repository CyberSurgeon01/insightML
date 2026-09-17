/**
 * src/components/QualitySection.tsx
 *
 * Wrapper component for Phase 6 (Data Quality).
 */

import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { QualityResult } from "@/types/dataset";
import QualitySummary from "./QualitySummary";
import QualityList from "./QualityList";
import OutlierTable from "./OutlierTable";

export default function QualitySection({ quality }: { quality?: QualityResult }) {
  if (!quality) return null;

  return (
    <div className="w-full space-y-6 mt-4 pt-8 border-t border-slate-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {quality.total_warnings > 0 ? (
            <ShieldAlert className="w-5 h-5 text-accent" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          )}
          <h2 className="text-[17px] font-semibold text-navy">Data Quality & Recommendations</h2>
        </div>
        <div className="text-[12px] text-slate-500 italic">
          * Automated checks. Review in context before modifying data.
        </div>
      </div>

      {quality.total_warnings === 0 && quality.total_missing_cells === 0 && quality.total_duplicate_rows === 0 ? (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400" />
          <h3 className="text-emerald-800 font-semibold text-[16px]">Dataset Looks Clean!</h3>
          <p className="text-emerald-600 text-[14px] max-w-md">
            No critical issues, warnings, missing cells, duplicates, or extreme outliers were detected in this dataset.
          </p>
        </div>
      ) : (
        <>
          <QualitySummary quality={quality} />
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
            <QualityList warnings={quality.warnings} />
            <OutlierTable outliers={quality.outliers} />
          </div>
        </>
      )}

    </div>
  );
}
