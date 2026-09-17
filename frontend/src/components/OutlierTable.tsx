/**
 * src/components/OutlierTable.tsx
 *
 * Renders explicit numerical bounds for outliers.
 */

import type { OutlierDetail } from "@/types/dataset";

export default function OutlierTable({ outliers }: { outliers: OutlierDetail[] }) {
  if (outliers.length === 0) return null;

  return (
    <div className="space-y-3 mt-6">
      <h3 className="text-[14px] font-semibold text-navy">Numerical Outliers (IQR Method)</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-[13px] text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-4 py-3 border-b border-slate-200">Feature</th>
              <th className="px-4 py-3 border-b border-slate-200 text-right">Outliers</th>
              <th className="px-4 py-3 border-b border-slate-200 text-right">% of Valid</th>
              <th className="px-4 py-3 border-b border-slate-200 text-right">Lower Bound</th>
              <th className="px-4 py-3 border-b border-slate-200 text-right">Upper Bound</th>
            </tr>
          </thead>
          <tbody>
            {outliers.map((o, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5 text-navy font-medium whitespace-nowrap">{o.column}</td>
                <td className="px-4 py-2.5 text-slate-600 text-right tabular-nums">{o.outlier_count.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-slate-600 text-right tabular-nums text-amber-600 font-medium">{o.outlier_percentage.toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-slate-600 text-right tabular-nums">{o.lower_bound.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td className="px-4 py-2.5 text-slate-600 text-right tabular-nums">{o.upper_bound.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

