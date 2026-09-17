/**
 * src/components/RelationshipsSection.tsx
 *
 * Wrapper component for Phase 4.
 */
"use client";

import { useState } from "react";
import { Network, X } from "lucide-react";
import type { RelationshipResult } from "@/types/dataset";
import TopRelationships from "./TopRelationships";
import RelationshipTable from "./RelationshipTable";
import CorrelationHeatmap from "./CorrelationHeatmap";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface RelationshipsSectionProps {
  relationships?: RelationshipResult;
}

export default function RelationshipsSection({ relationships }: RelationshipsSectionProps) {
  const [selectedPair, setSelectedPair] = useState<{colA: string, colB: string} | null>(null);

  if (!relationships) return null;

  const { columns_analyzed, skipped_columns, info_messages, pairs, top_relationships, correlation_matrix, scatter_samples } = relationships;

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

  const activePairDetails = selectedPair ? pairs.find(p => (p.feature_a === selectedPair.colA && p.feature_b === selectedPair.colB) || (p.feature_a === selectedPair.colB && p.feature_b === selectedPair.colA)) : null;
  const activeScatterData = selectedPair && scatter_samples ? scatter_samples[selectedPair.colA]?.[selectedPair.colB] : null;

  return (
    <div className="w-full space-y-8 mt-4 pt-8 border-t border-slate-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-500" />
          <h2 className="text-[18px] font-bold text-navy">Numerical Relationships</h2>
        </div>
        <span className="text-[12px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {pairs.length} pairs analyzed
        </span>
      </div>

      {info_messages.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-[13px] text-indigo-800">
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

      {/* Pair Explorer Overlay/Card */}
      {selectedPair && activePairDetails && activeScatterData && (
        <div className="bg-white border-2 border-indigo-500 rounded-xl shadow-lg p-5 relative">
          <button 
            onClick={() => setSelectedPair(null)} 
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h3 className="text-[15px] font-bold text-navy mb-1 flex items-center gap-2">
            Pair Explorer
            <span className="text-[12px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {activePairDetails.strength} Relationship
            </span>
          </h3>
          <p className="text-[13px] text-slate-500 font-mono mb-6">
            {selectedPair.colA} <span className="text-slate-300">vs</span> {selectedPair.colB}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-[250px] w-full bg-slate-50 rounded-lg border border-slate-100 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="x" name={selectedPair.colA} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="y" name={selectedPair.colB} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Scatter name="Sample" data={activeScatterData} fill="#6366f1" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="text-center text-[10px] text-slate-400 mt-1">Showing deterministic sample (max 100 points)</div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Pearson Correlation</div>
                <div className="text-[18px] font-bold text-navy">{activePairDetails.pearson.toFixed(3)}</div>
                <div className="text-[11px] text-slate-400">Linear trend</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Spearman Correlation</div>
                <div className="text-[18px] font-bold text-navy">{activePairDetails.spearman.toFixed(3)}</div>
                <div className="text-[11px] text-slate-400">Monotonic rank</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Mutual Information</div>
                <div className="text-[18px] font-bold text-navy">{activePairDetails.mutual_information.toFixed(3)}</div>
                <div className="text-[11px] text-slate-400">Nonlinear dependency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout for Heatmap and Guide */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Heatmap (takes most space) */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Correlation Matrix</h3>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <CorrelationHeatmap 
              matrix={correlation_matrix} 
              onCellClick={(colA, colB) => setSelectedPair({ colA, colB })}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">Click a cell to open Pair Explorer</p>
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

      <div className="pt-8 border-t border-slate-200">
        <RelationshipTable pairs={pairs} />
      </div>
    </div>
  );
}
