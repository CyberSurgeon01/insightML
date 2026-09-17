/**
 * src/components/TopRelationships.tsx
 *
 * Displays cards for the strongest numerical relationships.
 */

import { TrendingUp } from "lucide-react";
import type { RelationshipPair } from "@/types/dataset";

interface TopRelationshipsProps {
  pairs: RelationshipPair[];
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

export default function TopRelationships({ pairs }: TopRelationshipsProps) {
  if (!pairs || pairs.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Top Relationships</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {pairs.map((p, idx) => (
          <div key={idx} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-navy truncate" title={p.feature_a}>{p.feature_a}</span>
              <TrendingUp className="w-4 h-4 text-slate-300 shrink-0 mx-2" />
              <span className="text-[14px] font-bold text-navy truncate text-right" title={p.feature_b}>{p.feature_b}</span>
            </div>
            
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-500">Pearson:</span>
                <span className="font-medium text-navy tabular-nums">{p.pearson.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-500">Spearman:</span>
                <span className="font-medium text-navy tabular-nums">{p.spearman.toFixed(2)}</span>
              </div>
            </div>
            
            <StrengthBar strength={p.strength} />
          </div>
        ))}
      </div>
    </div>
  );
}

