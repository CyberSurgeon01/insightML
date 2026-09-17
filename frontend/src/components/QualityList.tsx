/**
 * src/components/QualityList.tsx
 *
 * Renders the warning cards with severity filters.
 */

"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { QualityWarning } from "@/types/dataset";

interface QualityListProps {
  warnings: QualityWarning[];
}

export default function QualityList({ warnings }: QualityListProps) {
  const [filter, setFilter] = useState<"All" | "Critical" | "Warning" | "Info">("All");

  const filteredWarnings = warnings.filter(w => filter === "All" || w.severity === filter);

  function FilterButton({ label, count, colorClass }: { label: string; count: number; colorClass: string }) {
    const active = filter === label;
    return (
      <button
        onClick={() => setFilter(label as any)}
        className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
          active 
            ? `${colorClass} shadow-sm` 
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
      >
        {label} ({count})
      </button>
    );
  }

  function getIcon(severity: string) {
    if (severity === "Critical") return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (severity === "Warning") return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  }

  function getBorderClass(severity: string) {
    if (severity === "Critical") return "border-red-200 bg-red-50/30";
    if (severity === "Warning") return "border-amber-200 bg-amber-50/30";
    return "border-blue-200 bg-blue-50/30";
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterButton label="All" count={warnings.length} colorClass="bg-navy text-white" />
        <FilterButton label="Critical" count={warnings.filter(w => w.severity === "Critical").length} colorClass="bg-red-600 text-white" />
        <FilterButton label="Warning" count={warnings.filter(w => w.severity === "Warning").length} colorClass="bg-amber-500 text-white" />
        <FilterButton label="Info" count={warnings.filter(w => w.severity === "Info").length} colorClass="bg-blue-500 text-white" />
      </div>

      {/* List */}
      {filteredWarnings.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-[14px]">
          No issues found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWarnings.map(w => (
            <div key={w.warning_id} className={`rounded-xl border p-5 flex flex-col gap-3 ${getBorderClass(w.severity)}`}>
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">{getIcon(w.severity)}</div>
                <div className="space-y-1 w-full">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-navy text-[15px]">{w.issue_title}</h4>
                    <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-white/60 px-2 py-0.5 rounded">
                      {w.category}
                    </span>
                  </div>
                  <p className="text-[13.5px] text-slate-700 leading-relaxed">
                    {w.explanation}
                  </p>
                </div>
              </div>

              {w.affected_columns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 ml-8">
                  {w.affected_columns.map(col => (
                    <span key={col} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[12px] font-medium rounded shadow-sm">
                      {col}
                    </span>
                  ))}
                </div>
              )}

              <div className="ml-8 mt-2 bg-white/60 rounded-lg p-3 flex gap-2.5 items-start">
                <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[13px] font-medium text-navy">Recommendation</p>
                  <p className="text-[13px] text-slate-600">{w.recommendation}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
