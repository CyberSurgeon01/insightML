/**
 * src/components/views/ProfileView.tsx
 */
"use client";

import { Database } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";
import ProfileSummary from "@/components/ProfileSummary";
import DataPreview from "@/components/DataPreview";

export default function ProfileView({ data }: { data: UploadResponse }) {
  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-5 h-5 text-indigo-500" />
        <h1 className="text-[20px] font-bold text-navy">Dataset Profile</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
        <ProfileSummary profile={data.profile} />
      </div>

      {/* Column Details Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-navy">Column Profiles</h3>
          <span className="text-[12px] font-medium px-2 py-1 bg-white border border-slate-200 rounded-md">
            {data.profile.columns.length} columns
          </span>
        </div>
        <div className="max-h-[500px] overflow-auto custom-scrollbar">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm text-slate-500 font-medium border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 border-r border-slate-100">Name</th>
                <th className="px-4 py-3 border-r border-slate-100">Type</th>
                <th className="px-4 py-3 border-r border-slate-100">Missing</th>
                <th className="px-4 py-3 border-r border-slate-100">Unique</th>
                <th className="px-4 py-3">Stats (Min - Mean - Max)</th>
              </tr>
            </thead>
            <tbody>
              {data.profile.columns.map((col, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-navy border-r border-slate-100 truncate max-w-[150px]" title={col.name}>{col.name}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize border-r border-slate-100">{col.inferred_type}</td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <span className={col.missing_count > 0 ? "text-amber-600 font-medium" : "text-slate-500"}>
                      {col.missing_count.toLocaleString()} ({col.missing_percentage}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{col.unique_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-[12px]">
                    {col.inferred_type === "numerical" && col.min !== null && col.max !== null 
                      ? `${col.min.toFixed(2)} — ${col.mean?.toFixed(2)} — ${col.max.toFixed(2)}`
                      : <span className="text-slate-300 italic">N/A</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <DataPreview data={data} />
      </div>

    </div>
  );
}
