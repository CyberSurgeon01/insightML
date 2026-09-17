/**
 * src/components/RelationshipTable.tsx
 *
 * Sortable table for all pairwise relationships.
 */

"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import type { RelationshipPair } from "@/types/dataset";

interface RelationshipTableProps {
  pairs: RelationshipPair[];
}

type SortKey = "feature_a" | "feature_b" | "pearson" | "spearman" | "mutual_information" | "valid_rows";
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

export default function RelationshipTable({ pairs }: RelationshipTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("pearson");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedPairs = useMemo(() => {
    return [...pairs].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      
      // Sort correlations by absolute value for magnitude
      if (sortKey === "pearson" || sortKey === "spearman") {
        valA = Math.abs(valA as number);
        valB = Math.abs(valB as number);
      }
      
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

  return (
    <div className="w-full">
      <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">All Relationships</h3>
      <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider text-[11px] sticky top-0 z-10 shadow-sm">
              <tr>
                <Th label="Feature A" sortKey="feature_a" />
                <Th label="Feature B" sortKey="feature_b" />
                <Th label="Pearson" sortKey="pearson" right />
                <Th label="Spearman" sortKey="spearman" right />
                <Th label="Mutual Info" sortKey="mutual_information" right />
                <Th label="Valid Rows" sortKey="valid_rows" right />
                <th className="px-4 py-3 whitespace-nowrap border-b border-slate-100 text-right">Strength</th>
              </tr>
            </thead>
            <tbody>
              {sortedPairs.map((p, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap">{p.feature_a}</td>
                  <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap">{p.feature_b}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{p.pearson.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{p.spearman.toFixed(4)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{p.mutual_information.toFixed(4)}</td>
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

