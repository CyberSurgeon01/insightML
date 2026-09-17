/**
 * src/components/RelationshipsSection.tsx
 *
 * Wrapper component for Phase 4.
 */

import { Network, Info } from "lucide-react";
import type { RelationshipResult } from "@/types/dataset";
import TopRelationships from "./TopRelationships";
import RelationshipTable from "./RelationshipTable";
import CorrelationHeatmap from "./CorrelationHeatmap";

interface RelationshipsSectionProps {
  relationships?: RelationshipResult;
}

export default function RelationshipsSection({ relationships }: RelationshipsSectionProps) {
  if (!relationships) return null;

  const { columns_analyzed, skipped_columns, info_messages, pairs, top_relationships, correlation_matrix } = relationships;

  if (columns_analyzed.length < 2) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-8 text-center">
        <Network className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-[15px] font-semibold text-navy mb-1">Not enough numerical columns</h3>
        <p className="text-[13px] text-slate-500 max-w-md mx-auto">
          Relationship analysis requires at least two numerical columns. 
          Found {columns_analyzed.length} valid numerical column(s).
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 mt-4 pt-8 border-t border-slate-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-accent" />
          <h2 className="text-[17px] font-semibold text-navy">Feature Relationships</h2>
        </div>
      </div>

      {/* Info messages (sampling, limits, skipped) */}
      {(info_messages.length > 0 || skipped_columns.length > 0) && (
        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex items-start gap-3 text-[13px] text-slate-600">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            {info_messages.map((msg, i) => (
              <p key={`info-${i}`}>{msg}</p>
            ))}
            {skipped_columns.length > 0 && (
              <p>
                <span className="font-medium text-slate-700">Skipped columns: </span>
                {skipped_columns.map(sc => `${sc.name} (${sc.reason})`).join(", ")}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Top Cards */}
      <TopRelationships pairs={top_relationships} />

      {/* Two-column layout for Heatmap and Guide */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Heatmap (takes most space) */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Correlation Matrix</h3>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <CorrelationHeatmap matrix={correlation_matrix} />
          </div>
        </div>
        
        {/* How to read this */}
        <div className="w-full lg:w-72 shrink-0">
          <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">How to read this</h3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 text-[13px] text-slate-600">
            <div>
              <strong className="text-navy block mb-0.5">Pearson</strong>
              <p>Measures linear relationships (-1 to 1). Best for continuous variables with straight-line trends.</p>
            </div>
            <div>
              <strong className="text-navy block mb-0.5">Spearman</strong>
              <p>Measures monotonic relationships (-1 to 1). Better for ranked data or curves that always go up or down.</p>
            </div>
            <div>
              <strong className="text-navy block mb-0.5">Mutual Information (MI)</strong>
              <p>Detects any dependency, including complex nonlinear relationships. Higher is stronger.</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-slate-500 italic">Note: Correlation does not imply causation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Table */}
      <RelationshipTable pairs={pairs} />

    </div>
  );
}

