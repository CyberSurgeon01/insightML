/**
 * src/components/BaselineSection.tsx
 *
 * Phase 10: Baseline Model Training and Evaluation.
 */

"use client";

import { useState } from "react";
import { BrainCircuit, Play, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { UploadResponse, MLReadinessResponse, BaselineModelResponse, MetricComparison } from "@/types/dataset";
import { trainBaselineModel } from "@/lib/api";

interface BaselineSectionProps {
  data: UploadResponse;
  file: File;
  readiness: MLReadinessResponse;
}

export default function BaselineSection({ data, file, readiness }: BaselineSectionProps) {
  const [baseline, setBaseline] = useState<BaselineModelResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [leakageConfirmed, setLeakageConfirmed] = useState(false);

  const hasLeakage = readiness.leakage.length > 0;
  const features = readiness.features.recommended_features;

  const handleTrain = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setBaseline(null);
    try {
      const res = await trainBaselineModel(
        file,
        readiness.target.target_name,
        readiness.target.inferred_task_type,
        features,
        leakageConfirmed
      );
      setBaseline(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Model training failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const MetricCard = ({ metric }: { metric: MetricComparison }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-1">
      <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{metric.metric_name}</div>
      <div className="flex items-end gap-2">
        <span className="text-[20px] font-bold text-navy">{metric.baseline_score.toFixed(3)}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
        <span className={metric.is_better ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
          vs Dummy: {metric.dummy_score.toFixed(3)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6 mt-8 mb-10 pt-8 border-t border-slate-200">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-500" />
          <h2 className="text-[17px] font-semibold text-navy">Baseline Model Training</h2>
        </div>
      </div>

      {!baseline && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-slate-600">
              Ready to train a baseline <span className="font-bold text-indigo-600">{readiness.target.inferred_task_type}</span> model predicting <span className="font-bold font-mono">{readiness.target.target_name}</span>.
            </div>
            <div className="text-[12px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
              <span className="font-bold text-navy">{features.length}</span> features selected
            </div>
          </div>

          {hasLeakage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-[13px] font-bold text-red-800">Possible Leakage Detected</p>
                <p className="text-[12px] text-red-700">
                  We found features that are highly correlated or exact duplicates of the target.
                  Including these can result in artificially perfect model performance that will fail in real life.
                </p>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={leakageConfirmed}
                    onChange={(e) => setLeakageConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-[12px] font-medium text-red-800">I understand the risk and want to proceed anyway.</span>
                </label>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleTrain}
              disabled={isLoading || features.length === 0 || (hasLeakage && !leakageConfirmed)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Baseline Model
            </button>
            {errorMsg && <div className="text-[12px] text-red-600">{errorMsg}</div>}
          </div>
        </div>
      )}

      {baseline && (
        <div className="space-y-6">
          
          {/* Outcome Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${baseline.outperformed_dummy ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            {baseline.outperformed_dummy ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`text-[14px] font-bold ${baseline.outperformed_dummy ? 'text-emerald-800' : 'text-amber-800'}`}>
                {baseline.outperformed_dummy ? "Baseline outperformed the dummy!" : "Baseline did not beat the dummy."}
              </h3>
              <p className={`text-[12px] mt-1 ${baseline.outperformed_dummy ? 'text-emerald-700' : 'text-amber-700'}`}>
                {baseline.model_name} compared against {baseline.dummy_model_name}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {baseline.classification_metrics && (
              <>
                <MetricCard metric={baseline.classification_metrics.accuracy} />
                <MetricCard metric={baseline.classification_metrics.f1} />
                <MetricCard metric={baseline.classification_metrics.precision} />
                <MetricCard metric={baseline.classification_metrics.recall} />
              </>
            )}
            {baseline.regression_metrics && (
              <>
                <MetricCard metric={baseline.regression_metrics.r2} />
                <MetricCard metric={baseline.regression_metrics.rmse} />
                <MetricCard metric={baseline.regression_metrics.mae} />
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-center text-[11px] text-slate-500 space-y-1">
                  <div><span className="font-semibold text-navy">Train:</span> {baseline.training_rows.toLocaleString()} rows</div>
                  <div><span className="font-semibold text-navy">Test:</span> {baseline.test_rows.toLocaleString()} rows</div>
                  {baseline.excluded_rows > 0 && <div><span className="font-semibold text-red-500">Excluded:</span> {baseline.excluded_rows.toLocaleString()} rows (missing target)</div>}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Visuals */}
            {baseline.classification_metrics && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-navy mb-4">Confusion Matrix (Test Set)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] text-center border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border-b-2 border-r-2 border-slate-100 bg-slate-50 text-slate-500 font-medium">True \ Pred</th>
                        {baseline.classification_metrics.classes.map(c => (
                          <th key={c} className="p-2 border-b-2 border-slate-100 bg-slate-50 text-navy font-bold truncate max-w-[80px]" title={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {baseline.classification_metrics.confusion_matrix.map((row, i) => (
                        <tr key={i}>
                          <th className="p-2 border-r-2 border-b border-slate-100 bg-slate-50 text-navy font-bold truncate max-w-[80px]" title={baseline.classification_metrics!.classes[i]}>
                            {baseline.classification_metrics!.classes[i]}
                          </th>
                          {row.map((val, j) => (
                            <td key={j} className={`p-2 border-b border-slate-50 ${i === j ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-600'}`}>
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {baseline.regression_metrics && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-navy mb-4">Actual vs Predicted (Test Sample)</h3>
                <div className="w-full h-[250px] bg-slate-50 rounded border border-slate-100 relative">
                  {/* SVG Scatter Plot */}
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Perfect fit line */}
                    <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" />
                    {(() => {
                      const pts = baseline.regression_metrics.actual_vs_predicted;
                      if (!pts.length) return null;
                      
                      const minVal = Math.min(...pts.map(p => Math.min(p.actual, p.predicted)));
                      const maxVal = Math.max(...pts.map(p => Math.max(p.actual, p.predicted)));
                      const range = (maxVal - minVal) || 1;

                      return pts.map((p, i) => {
                        const cx = ((p.actual - minVal) / range) * 90 + 5;
                        const cy = 100 - (((p.predicted - minVal) / range) * 90 + 5);
                        return <circle key={i} cx={cx} cy={cy} r="1.5" fill="#6366f1" opacity="0.6" />;
                      });
                    })()}
                  </svg>
                  <div className="absolute bottom-2 right-2 text-[10px] font-medium text-slate-400">Actual (X) vs Pred (Y)</div>
                </div>
              </div>
            )}

            {/* Preprocessing Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-[14px] font-bold text-navy mb-4">Pipeline Summary</h3>
              <ul className="space-y-3">
                {baseline.preprocessing_summary.map((p, i) => (
                  <li key={i} className="text-[13px] text-slate-600 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
              
              {baseline.classification_metrics && (
                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div><span className="font-semibold text-navy">Train Size:</span> {baseline.training_rows.toLocaleString()} rows</div>
                  <div><span className="font-semibold text-navy">Test Size:</span> {baseline.test_rows.toLocaleString()} rows</div>
                  {baseline.excluded_rows > 0 && <div><span className="font-semibold text-red-500">Excluded:</span> {baseline.excluded_rows.toLocaleString()} missing targets</div>}
                </div>
              )}
            </div>
            
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-slate-500 italic">
              {baseline.caveat} We apply standard imputation, scaling, and encoding on the training set to prevent data leakage.
            </p>
          </div>
          
        </div>
      )}

    </div>
  );
}
