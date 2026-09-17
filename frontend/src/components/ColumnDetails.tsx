/**
 * src/components/ColumnDetails.tsx
 *
 * Responsive table showing per-column profile details:
 *   Column | Type | Missing | Missing% | Unique | Min | Max | Mean | Median
 *
 * Numerical stats are only shown for numerical columns; other types show "—".
 * Type is displayed as a small colored badge.
 */

import type { DatasetProfile, ColumnProfile } from "@/types/dataset";
import { TableProperties } from "lucide-react";

interface ColumnDetailsProps {
  profile: DatasetProfile;
}

// ── Type badge colors ────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  numerical: "bg-blue-50 text-blue-600",
  categorical: "bg-emerald-50 text-emerald-600",
  boolean: "bg-purple-50 text-purple-600",
  datetime: "bg-orange-50 text-orange-600",
};

function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[type] || "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${style}`}>
      {type}
    </span>
  );
}

// ── Formatting helpers ───────────────────────────────────────────────────────

function fmtNum(value: number | null): string {
  if (value === null || value === undefined) return "—";
  // Show integers without decimals, floats with up to 4 decimals
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function fmtPct(value: number): string {
  if (value === 0) return "0%";
  if (value === 100) return "100%";
  return `${value.toFixed(1)}%`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ColumnDetails({ profile }: ColumnDetailsProps) {
  const columns = profile.columns;

  return (
    <div className="w-full space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <TableProperties className="w-4 h-4 text-accent" />
        <h2 className="text-[15px] font-semibold text-navy">
          Column Details
          <span className="text-slate-400 font-normal ml-1.5 text-[13px]">
            ({columns.length} columns)
          </span>
        </h2>
      </div>

      {/* Table container */}
      <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100">Column</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100">Type</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Missing</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Missing %</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Unique</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Min</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Max</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Mean</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Median</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col: ColumnProfile, idx: number) => (
                <tr
                  key={`${col.name}-${idx}`}
                  className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap max-w-[200px] truncate" title={col.name}>
                    {col.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <TypeBadge type={col.inferred_type} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                    {col.missing_count > 0 ? (
                      <span className="text-amber-600 font-medium">{col.missing_count.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                    {col.missing_percentage > 0 ? (
                      <span className="text-amber-600">{fmtPct(col.missing_percentage)}</span>
                    ) : (
                      <span className="text-slate-300">0%</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                    {col.unique_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                    {col.inferred_type === "numerical" ? fmtNum(col.min) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                    {col.inferred_type === "numerical" ? fmtNum(col.max) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                    {col.inferred_type === "numerical" ? fmtNum(col.mean) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">
                    {col.inferred_type === "numerical" ? fmtNum(col.median) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

