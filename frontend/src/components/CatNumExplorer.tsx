/**
 * src/components/CatNumExplorer.tsx
 *
 * Interactive explorer for Category vs Numeric relationships.
 */

"use client";

import { useState, useMemo } from "react";
import type { CatNumPair } from "@/types/dataset";

interface CatNumExplorerProps {
  pairs: CatNumPair[];
  catColumns: string[];
  numColumns: string[];
}

export default function CatNumExplorer({ pairs, catColumns, numColumns }: CatNumExplorerProps) {
  const [selectedCat, setSelectedCat] = useState<string>(catColumns[0] || "");
  const [selectedNum, setSelectedNum] = useState<string>(numColumns[0] || "");

  // Find the selected pair data
  const currentPair = useMemo(() => {
    return pairs.find(p => p.categorical_feature === selectedCat && p.numerical_feature === selectedNum);
  }, [pairs, selectedCat, selectedNum]);

  // For the chart scale
  const maxMean = useMemo(() => {
    if (!currentPair) return 1;
    return Math.max(...currentPair.groups.map(g => g.mean));
  }, [currentPair]);

  if (pairs.length === 0 || catColumns.length === 0 || numColumns.length === 0) {
    return null; // Nothing to explore
  }

  return (
    <div className="w-full">
      <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Category vs Numeric Explorer</h3>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-6">
        
        {/* Selectors */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[12px] font-semibold text-slate-500 uppercase">Categorical Feature</label>
            <select 
              value={selectedCat} 
              onChange={e => setSelectedCat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-navy text-[14px] rounded-lg px-3 py-2 outline-none focus:border-accent"
            >
              {catColumns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[12px] font-semibold text-slate-500 uppercase">Numerical Feature</label>
            <select 
              value={selectedNum} 
              onChange={e => setSelectedNum(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-navy text-[14px] rounded-lg px-3 py-2 outline-none focus:border-accent"
            >
              {numColumns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
        </div>

        {/* Results Area */}
        {currentPair ? (
          <div className="space-y-6">
            
            {/* Meta stats */}
            <div className="flex flex-wrap items-center gap-4 py-3 border-y border-slate-100">
              <div className="text-[13px]">
                <span className="text-slate-500 mr-1.5">Eta-Squared:</span>
                <span className="font-semibold text-navy">{currentPair.eta_squared.toFixed(3)}</span>
                <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">{currentPair.strength} Effect</span>
              </div>
              <div className="text-[13px]">
                <span className="text-slate-500 mr-1.5">ANOVA p-value:</span>
                <span className="font-semibold text-navy">{currentPair.p_value < 0.0001 ? "<0.0001" : currentPair.p_value.toFixed(4)}</span>
              </div>
            </div>

            {/* Two column layout: Chart and Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* CSS Bar Chart */}
              <div>
                <h4 className="text-[12px] font-semibold text-slate-500 uppercase mb-4">Mean {currentPair.numerical_feature} by {currentPair.categorical_feature}</h4>
                <div className="space-y-3">
                  {[...currentPair.groups].sort((a,b) => b.mean - a.mean).map((g, i) => {
                    const widthPct = maxMean > 0 ? (g.mean / maxMean) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-navy font-medium truncate pr-2" title={g.category}>{g.category}</span>
                          <span className="text-slate-500 tabular-nums">{g.mean.toLocaleString(undefined, {maximumFractionDigits: 1})}</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 rounded overflow-hidden flex">
                          <div 
                            className="h-full bg-accent transition-all duration-500 ease-out" 
                            style={{ width: `${Math.max(0, widthPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grouped Stats Table */}
              <div>
                <h4 className="text-[12px] font-semibold text-slate-500 uppercase mb-4">Group Statistics</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-[12px] text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-3 py-2 border-b border-slate-200">Group</th>
                        <th className="px-3 py-2 border-b border-slate-200 text-right">Count</th>
                        <th className="px-3 py-2 border-b border-slate-200 text-right">Mean</th>
                        <th className="px-3 py-2 border-b border-slate-200 text-right">Median</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPair.groups.map((g, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-2 text-navy font-medium truncate max-w-[100px]" title={g.category}>{g.category}</td>
                          <td className="px-3 py-2 text-slate-600 text-right tabular-nums">{g.count.toLocaleString()}</td>
                          <td className="px-3 py-2 text-slate-600 text-right tabular-nums">{g.mean.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                          <td className="px-3 py-2 text-slate-600 text-right tabular-nums">{g.median.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="py-8 text-center text-[13px] text-slate-500">
            No valid relationship data found for this pair. (Insufficient variance or rows).
          </div>
        )}
        
      </div>
    </div>
  );
}

