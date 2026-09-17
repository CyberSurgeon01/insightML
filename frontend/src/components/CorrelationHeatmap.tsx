/**
 * src/components/CorrelationHeatmap.tsx
 *
 * CSS Grid-based correlation heatmap.
 * Uses a red-white-blue color scale based on Pearson correlation values.
 */

import type { CorrelationMatrix } from "@/types/dataset";

interface CorrelationHeatmapProps {
  matrix: CorrelationMatrix;
}

/** Interpolate between blue (-1), white (0), and red (+1) */
function getColor(value: number | null): string {
  if (value === null) return "#f1f5f9"; // slate-100 for null

  // Restrict to [-1, 1]
  const val = Math.max(-1, Math.min(1, value));

  if (val < 0) {
    // Blue for negative (slate-like blue)
    const intensity = Math.abs(val);
    const r = Math.round(255 - (255 - 59) * intensity);
    const g = Math.round(255 - (255 - 130) * intensity);
    const b = Math.round(255 - (255 - 246) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Red for positive
    const intensity = val;
    const r = Math.round(255 - (255 - 239) * intensity);
    const g = Math.round(255 - (255 - 68) * intensity);
    const b = Math.round(255 - (255 - 68) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/** Text color: white for dark backgrounds, slate-700 for light */
function getTextColor(value: number | null): string {
  if (value === null) return "#94a3b8"; // slate-400
  return Math.abs(value) > 0.5 ? "#ffffff" : "#334155";
}

export default function CorrelationHeatmap({ matrix }: CorrelationHeatmapProps) {
  const { columns, values } = matrix;
  const n = columns.length;
  
  // If too many columns, display a fallback message (will be handled by parent or CSS hide)
  // But we'll render it anyway and just let it scroll or scale.
  
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex flex-col min-w-max">
        {/* Top Header Row */}
        <div className="flex">
          <div className="w-32 shrink-0"></div> {/* Top-left empty corner */}
          {columns.map((col, idx) => (
            <div key={`header-top-${idx}`} className="w-12 h-24 shrink-0 relative">
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 -rotate-45 origin-bottom-left text-[11px] font-medium text-slate-500 whitespace-nowrap">
                {col}
              </div>
            </div>
          ))}
        </div>

        {/* Matrix Rows */}
        {columns.map((colRow, i) => (
          <div key={`row-${i}`} className="flex items-center">
            {/* Row Label */}
            <div className="w-32 shrink-0 pr-4 text-right text-[12px] font-medium text-navy truncate" title={colRow}>
              {colRow}
            </div>
            
            {/* Row Cells */}
            {values[i].map((val, j) => (
              <div 
                key={`cell-${i}-${j}`} 
                className="w-12 h-12 shrink-0 border border-white flex items-center justify-center text-[10px] font-medium tabular-nums transition-transform hover:scale-110 hover:shadow-sm hover:z-10 cursor-default"
                style={{ 
                  backgroundColor: getColor(val),
                  color: getTextColor(val)
                }}
                title={`${colRow} ↔ ${columns[j]}\nPearson: ${val !== null ? val.toFixed(4) : "N/A"}`}
              >
                {val !== null ? (val === 1.0 ? "1.0" : val.toFixed(2)) : "—"}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-2 mt-6 text-[11px] text-slate-500">
        <span>-1.0 (Inverse)</span>
        <div className="h-2 w-32 rounded-full" style={{ background: "linear-gradient(to right, rgb(59,130,246), rgb(255,255,255), rgb(239,68,68))" }} />
        <span>+1.0 (Direct)</span>
      </div>
    </div>
  );
}

