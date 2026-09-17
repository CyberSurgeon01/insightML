/**
 * src/components/CatCatTable.tsx
 *
 * Displays top categorical associations and a sortable table.
 */

"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Link2 } from "lucide-react";
import type { CatCatPair } from "@/types/dataset";

interface CatCatTableProps {
  pairs: CatCatPair[];
  topPairs: CatCatPair[];
}

type SortKey = "feature_a" | "feature_b" | "cramers_v" | "p_value" | "valid_rows";
type SortOrder = "asc" | "desc";

function StrengthBadge({ strength }: { strength: string }) {
  const styles = {
    Strong: "bg-accent/10 text-accent",
    Moderate: "bg-blue-50 text-blue-600",
    Weak: "bg-slate-100 text-slate-600",
    Negligible: "bg-slate-50 text-slate-400"
  }[strength] || "bg-slate-100 text-slate-500";

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${styles}`}>
      {strength}
    </span>
  );
}

function StrengthBar({ strength }: { strength: string }) {
  const bars = {
    Strong: "w-full bg-accent",
    Moderate: "w-2/3 bg-blue-400",
    Weak: "w-1/3 bg-blue-300",
    Negligible: "w-1/6 bg-slate-300"
  }[strength] || "w-0";

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bars}`} />
      </div>
      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{strength}</span>
    </div>
  );
}

export default function CatCatTable({ pairs, topPairs }: CatCatTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("cramers_v");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedPairs = useMemo(() => {
    return [...pairs].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [pairs, sortKey, sortOrder]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  }

  function Th({ label, sortKey: key, right = false }: { label: string; sortKey: SortKey; right?: boolean }) {
    const isActive = sortKey === key;
    return (
      <th 
        className={`px-4 py-3 whitespace-nowrap border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors ${right ? "text-right" : ""}`}
        onClick={() => handleSort(key)}
      >
        <div className={`flex items-center gap-1.5 ${right ? "justify-end" : ""}`}>
          <span className={isActive ? "text-navy font-semibold" : ""}>{label}</span>
          <ArrowUpDown className={`w-3 h-3 ${isActive ? "text-accent" : "text-slate-300"}`} />
        </div>
      </th>
    );
  }

  if (pairs.length === 0) return null;

  return (
    <div className="w-full space-y-6">
      {/* Top Cards */}
      <div className="w-full">
        <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Top Categorical Associations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {topPairs.map((p, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-navy truncate" title={p.feature_a}>{p.feature_a}</span>
                <Link2 className="w-4 h-4 text-slate-300 shrink-0 mx-2" />
                <span className="text-[14px] font-bold text-navy truncate text-right" title={p.feature_b}>{p.feature_b}</span>
              </div>
              
              <div className="flex flex-col gap-0.5 mt-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-500">Cramér's V:</span>
                  <span className="font-medium text-navy tabular-nums">{p.cramers_v.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px] text-slate-400">
                  <span>n={p.valid_rows.toLocaleString()}</span>
                  <span>p={p.p_value < 0.001 ? "<0.001" : p.p_value.toFixed(3)}</span>
                </div>
              </div>
              
              <StrengthBar strength={p.strength} />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider text-[11px] sticky top-0 z-10 shadow-sm">
              <tr>
                <Th label="Feature A" sortKey="feature_a" />
                <Th label="Feature B" sortKey="feature_b" />
                <Th label="Cramér's V" sortKey="cramers_v" right />
                <Th label="P-value" sortKey="p_value" right />
                <Th label="Valid Rows" sortKey="valid_rows" right />
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Strength</th>
              </tr>
            </thead>
            <tbody>
              {sortedPairs.map((p, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap">{p.feature_a}</td>
                  <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap">{p.feature_b}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{p.cramers_v.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{p.p_value < 0.0001 ? "<0.0001" : p.p_value.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{p.valid_rows.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right"><StrengthBadge strength={p.strength} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

