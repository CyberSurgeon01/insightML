/**
 * src/components/ReadinessSection.tsx
 *
 * Phase 9: ML Readiness
 */

"use client";

import { useState } from "react";
import { Target, CheckCircle2, XCircle, AlertTriangle, Info, Play, Loader2, ArrowRight } from "lucide-react";
import type { UploadResponse, MLReadinessResponse } from "@/types/dataset";
import { assessMlReadiness } from "@/lib/api";
import BaselineSection from "./BaselineSection";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

interface ReadinessSectionProps {
  data: UploadResponse;
  file: File;
}

export default function ReadinessSection({ data, file }: ReadinessSectionProps) {
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [taskType, setTaskType] = useState<string>("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [readiness, setReadiness] = useState<MLReadinessResponse | null>(null);

  const handleAssess = async () => {
    if (!targetColumn) return;
    setIsLoading(true);
    setErrorMsg("");
    setReadiness(null);
    try {
      const res = await assessMlReadiness(file, targetColumn, taskType);
      setReadiness(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Assessment failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "Good") return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === "Warning") return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="w-full space-y-6 mt-8 mb-10 pt-8 border-t border-slate-200">
      
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-500" />
        <h2 className="text-[17px] font-semibold text-navy">Target Selection & ML Readiness</h2>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-end gap-4">
          
          <div className="w-full md:w-1/3 flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-navy">Target Column</label>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-[13px] rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-400"
            >
              <option value="" disabled>Select a column to predict...</option>
              {data.column_names.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/3 flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-navy">Task Type</label>
            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
              {["auto", "classification", "regression"].map(t => (
                <button
                  key={t}
                  onClick={() => setTaskType(t)}
                  className={`flex-1 text-[12px] font-medium py-1.5 rounded-md capitalize transition-colors ${
                    taskType === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-navy"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAssess}
            disabled={!targetColumn || isLoading}
            className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Assess Readiness
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[13px]">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Results */}
      {!readiness && !isLoading && (
        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-[13px] text-slate-500">Select a target column above to assess ML readiness.</p>
        </div>
      )}

      {readiness && (
        <div className="space-y-6">
          <p className="text-[12px] text-slate-500 italic">
            This assessment prepares your dataset for modelling. It does not train or evaluate a model.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target Health Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-navy">Target Health</h3>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                  <StatusIcon status={readiness.target.health_status} />
                  <span className="text-[12px] font-semibold text-slate-700">{readiness.target.health_status}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 text-[13px]">
                <div className="text-slate-500">Target</div>
                <div className="font-semibold text-navy truncate">{readiness.target.target_name}</div>
                
                <div className="text-slate-500">Inferred Task</div>
                <div className="font-semibold text-indigo-600 capitalize">{readiness.target.inferred_task_type}</div>
                
                <div className="text-slate-500">Missing Values</div>
                <div className="font-medium text-navy">{readiness.target.missing_values.toLocaleString()}</div>
                
                <div className="text-slate-500">Unique Values</div>
                <div className="font-medium text-navy">{readiness.target.unique_values.toLocaleString()}</div>
              </div>

              {readiness.target.blocking_issues.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-[12px] font-bold text-red-800 mb-1">Blocking Issues</p>
                  <ul className="list-disc list-inside text-[12px] text-red-700 space-y-1">
                    {readiness.target.blocking_issues.map((i, idx) => <li key={idx}>{i}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Task Details Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-[14px] font-bold text-navy mb-4 capitalize">
                {(readiness.target.user_selected_task_type === 'auto' ? readiness.target.inferred_task_type : readiness.target.user_selected_task_type)} Details
              </h3>
              
              {readiness.classification && (
                <div className="space-y-4 text-[13px]">
                  {readiness.classification.class_counts && (
                    <div className="h-[120px] w-full bg-slate-50 border border-slate-100 rounded-lg p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(readiness.classification.class_counts).map(([name, count]) => ({ name, count }))} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Majority Class Share</span>
                      <span className="font-medium text-navy">{(readiness.classification.majority_class_percentage * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Minority Class Count</span>
                      <span className="font-medium text-navy">{readiness.classification.minority_class_count} rows</span>
                    </div>
                    
                    {readiness.classification.imbalance_warning && (
                      <div className="flex items-start gap-2 mt-2 text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="text-[12px]">Severe class imbalance detected.</span>
                      </div>
                    )}
                    {readiness.classification.rare_class_warning && (
                      <div className="flex items-start gap-2 mt-2 text-red-700 bg-red-50 p-2 rounded border border-red-200">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="text-[12px]">Some classes have &lt;5 examples.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {readiness.regression && (
                <div className="space-y-4 text-[13px]">
                  {readiness.regression.target_histogram && (
                    <div className="h-[120px] w-full bg-slate-50 border border-slate-100 rounded-lg p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={readiness.regression.target_histogram} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                          <XAxis dataKey="bin_start" tickFormatter={val => val.toFixed(1)} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <RechartsTooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} 
                            labelFormatter={(label, payload) => payload.length ? `${payload[0].payload.bin_start.toFixed(2)} - ${payload[0].payload.bin_end.toFixed(2)}` : label}
                            formatter={(val) => [val, 'Count']}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Mean / Median</span>
                      <span className="font-medium text-navy">{readiness.regression.mean.toFixed(2)} / {readiness.regression.median.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Range</span>
                      <span className="font-medium text-navy">{readiness.regression.minimum.toFixed(2)} to {readiness.regression.maximum.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-slate-500">Outliers (IQR)</span>
                      <span className="font-medium text-navy">{readiness.regression.outlier_summary}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Features and Leakage */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-navy">Feature Readiness</h3>
              <span className="text-[12px] font-medium px-2 py-1 bg-white border border-slate-200 rounded-md">
                {readiness.features.recommended_features.length} / {data.columns} columns ready
              </span>
            </div>
            
            <div className="p-5 space-y-6">
              
              {/* Leakage */}
              {readiness.leakage.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-[13px] font-bold text-red-800 flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Possible Leakage (Review Manually)
                  </h4>
                  <ul className="space-y-2">
                    {readiness.leakage.map((l, i) => (
                      <li key={i} className="text-[12px] text-red-700 flex flex-col">
                        <span className="font-mono font-bold">{l.column}</span>
                        <span>{l.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-700 mb-2">Excluded Features</h4>
                  {readiness.features.excluded_features.length === 0 ? (
                    <p className="text-[12px] text-slate-500 italic">No features excluded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {readiness.features.excluded_features.map((f, i) => (
                        <li key={i} className="text-[12px] flex items-start gap-2 bg-slate-50 p-2 rounded">
                          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono font-bold text-navy block">{f.column}</span>
                            <span className="text-slate-500">{f.reason}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-[13px] font-bold text-slate-700 mb-2">Next Steps</h4>
                  <ul className="space-y-2">
                    {readiness.recommendations.map((r, i) => (
                      <li key={i} className="text-[12px] flex items-start gap-2 bg-indigo-50/50 p-2 rounded border border-indigo-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700">{r.action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
            </div>
          </div>

        </div>
      )}

      {readiness && <BaselineSection data={data} file={file} readiness={readiness} />}

    </div>
  );
}

