/**
 * src/components/views/OverviewView.tsx
 */
"use client";

import { LayoutDashboard, AlertTriangle, ArrowRight, Lightbulb, Rows, Columns, FileX, Copy } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";

interface OverviewViewProps {
  data: UploadResponse;
  onChangeView: (view: string) => void;
  qualityCount: number;
}

export default function OverviewView({ data, onChangeView, qualityCount }: OverviewViewProps) {
  
  const totalCells = data.rows * data.columns;
  const missingCells = data.profile.total_missing;
  const duplicateRows = data.quality.warnings.find(w => w.issue_title.includes("Duplicate"))?.count || 0;

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="w-5 h-5 text-indigo-500" />
        <h1 className="text-[20px] font-bold text-navy">Dataset Overview</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 text-[12px] font-semibold uppercase">
            <Rows className="w-4 h-4" /> Rows
          </div>
          <div className="text-[24px] font-black text-navy">{data.rows.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 text-[12px] font-semibold uppercase">
            <Columns className="w-4 h-4" /> Columns
          </div>
          <div className="text-[24px] font-black text-navy">{data.columns.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 text-[12px] font-semibold uppercase">
            <FileX className="w-4 h-4" /> Missing Cells
          </div>
          <div className="text-[24px] font-black text-navy">{missingCells.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400">{(missingCells / totalCells * 100).toFixed(1)}% of total</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 text-[12px] font-semibold uppercase">
            <Copy className="w-4 h-4" /> Duplicate Rows
          </div>
          <div className="text-[24px] font-black text-navy">{duplicateRows.toLocaleString()}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Insights (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-navy flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Top Smart Insights
            </h2>
            <button 
              onClick={() => onChangeView("insights")}
              className="text-[12px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex-1 space-y-3">
            {data.insights.insights.slice(0, 3).map((ins) => (
              <div key={ins.insight_id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    ins.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                    ins.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {ins.priority}
                  </span>
                  <h3 className="text-[13px] font-bold text-navy">{ins.title}</h3>
                </div>
                <p className="text-[12px] text-slate-600 mb-2">{ins.summary}</p>
                <div className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded inline-block">
                  Action: {ins.recommended_action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="space-y-4">
          <div 
            onClick={() => onChangeView("quality")}
            className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[14px] font-bold text-navy">Data Quality</h3>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            {qualityCount > 0 ? (
              <div className="flex items-center gap-2 text-rose-600 text-[13px] font-medium bg-rose-50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" /> {qualityCount} issues require attention
              </div>
            ) : (
              <div className="text-[13px] text-emerald-600 font-medium">Dataset is clean!</div>
            )}
          </div>

          <div 
            onClick={() => onChangeView("relationships")}
            className="group cursor-pointer bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[14px] font-bold text-navy">Relationships</h3>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <p className="text-[12px] text-slate-500">Explore correlations and categorical dependencies.</p>
          </div>

          <div 
            onClick={() => onChangeView("ml-readiness")}
            className="group cursor-pointer bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-white"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[14px] font-bold">ML Readiness</h3>
              <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:text-white transition-colors" />
            </div>
            <p className="text-[12px] text-indigo-100">Select a target and test baseline models.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
