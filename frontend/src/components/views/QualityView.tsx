/**
 * src/components/views/QualityView.tsx
 */
"use client";

import { ShieldAlert } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";
import QualitySection from "@/components/QualitySection";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

export default function QualityView({ data }: { data: UploadResponse }) {
  const severityData = [
    { name: "Critical", count: data.quality.warnings.filter(w => w.severity === "Critical").length, fill: "#ef4444" },
    { name: "Warning", count: data.quality.warnings.filter(w => w.severity === "Warning").length, fill: "#f59e0b" },
    { name: "Info", count: data.quality.warnings.filter(w => w.severity === "Info").length, fill: "#3b82f6" },
  ].filter(d => d.count > 0);

  const outlierData = data.profile.columns
    .filter(c => (c.outlier_count || 0) > 0)
    .sort((a, b) => (b.outlier_count || 0) - (a.outlier_count || 0))
    .slice(0, 10)
    .map(c => ({ name: c.name, outliers: c.outlier_count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-5 h-5 text-indigo-500" />
        <h1 className="text-[20px] font-bold text-navy">Data Quality</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Severity Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col">
          <h3 className="text-[14px] font-bold text-navy mb-4">Issue Severity</h3>
          <div className="h-[250px] w-full">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="none">
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[13px] text-emerald-600 font-medium">
                No issues detected!
              </div>
            )}
          </div>
        </div>

        {/* Outlier Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col">
          <h3 className="text-[14px] font-bold text-navy mb-4">Top Columns with Outliers</h3>
          <div className="h-[250px] w-full">
            {outlierData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outlierData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="outliers" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[13px] text-emerald-600 font-medium">
                No outliers detected in numerical columns.
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="-mt-2">
        <QualitySection quality={data.quality} />
      </div>
    </div>
  );
}
