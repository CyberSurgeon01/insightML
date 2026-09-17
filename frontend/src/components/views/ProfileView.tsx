/**
 * src/components/views/ProfileView.tsx
 */
"use client";

import { useState } from "react";
import { Database, BarChart3, AlertCircle } from "lucide-react";
import type { UploadResponse, ColumnProfile } from "@/types/dataset";
import ProfileSummary from "@/components/ProfileSummary";
import DataPreview from "@/components/DataPreview";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function ProfileView({ data }: { data: UploadResponse }) {
  const [selectedColumn, setSelectedColumn] = useState<ColumnProfile | null>(null);

  // Missing values chart data (top 10)
  const missingData = [...data.profile.columns]
    .filter(c => c.missing_count > 0)
    .sort((a, b) => b.missing_count - a.missing_count)
    .slice(0, 10)
    .map(c => ({ name: c.name, missing: c.missing_count, pct: c.missing_percentage }));

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-5 h-5 text-indigo-500" />
        <h1 className="text-[20px] font-bold text-navy">Dataset Profile</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
        <ProfileSummary profile={data.profile} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Missing Values Chart */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-[14px] font-bold text-navy">Top Missing Values</h3>
          </div>
          <div className="p-5 h-[300px] flex-1">
            {missingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.pct}%)`, "Missing"]}
                  />
                  <Bar dataKey="missing" radius={[0, 4, 4, 0]}>
                    {missingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pct > 50 ? '#ef4444' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[13px] text-emerald-600 font-medium">
                No missing values in this dataset!
              </div>
            )}
          </div>
        </div>

        {/* Column Distribution Explorer */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-[14px] font-bold text-navy">Distribution Explorer</h3>
            </div>
            {selectedColumn && (
              <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase">
                {selectedColumn.inferred_type}
              </span>
            )}
          </div>
          <div className="p-5 h-[300px] flex flex-col justify-center">
            {!selectedColumn ? (
              <div className="text-center text-slate-400 text-[13px]">
                Click a column in the table below to explore its distribution.
              </div>
            ) : selectedColumn.inferred_type === 'numerical' && selectedColumn.histogram ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedColumn.histogram} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis 
                    dataKey="bin_start" 
                    tickFormatter={(val) => val.toFixed(1)} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    labelFormatter={(label, payload) => payload.length ? `${payload[0].payload.bin_start.toFixed(2)} - ${payload[0].payload.bin_end.toFixed(2)}` : label}
                    formatter={(val) => [val, 'Count']}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : selectedColumn.value_counts ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedColumn.value_counts} layout="vertical" margin={{ left: 50, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-[13px]">
                No distribution data available for this column.
              </div>
            )}
            
            {selectedColumn && (
              <div className="mt-2 text-center text-[12px] font-bold text-navy truncate">
                {selectedColumn.name}
              </div>
            )}
          </div>
        </div>

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
                <th className="px-4 py-3 border-r border-slate-100">Outliers</th>
                <th className="px-4 py-3">Stats (Min - Mean - Max)</th>
              </tr>
            </thead>
            <tbody>
              {data.profile.columns.map((col, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedColumn(col)}
                  className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${selectedColumn?.name === col.name ? 'bg-indigo-50/50' : ''}`}
                >
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700 border-r border-slate-100 truncate max-w-[150px]" title={col.name}>{col.name}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize border-r border-slate-100">{col.inferred_type}</td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <span className={col.missing_count > 0 ? "text-amber-600 font-medium" : "text-slate-500"}>
                      {col.missing_count.toLocaleString()} ({col.missing_percentage}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 border-r border-slate-100">{col.unique_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                    {col.outlier_count != null ? (
                      <span className={col.outlier_count > 0 ? "text-rose-600 font-medium" : "text-slate-400"}>
                        {col.outlier_count}
                      </span>
                    ) : <span className="text-slate-300 italic">-</span>}
                  </td>
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
