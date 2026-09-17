/**
 * src/components/DataPreview.tsx
 *
 * Expandable table showing the first 10 rows of the uploaded dataset.
 * Collapsed by default to keep the page clean; toggles open on click.
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Table2 } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";

interface DataPreviewProps {
  data: UploadResponse;
}

export default function DataPreview({ data }: DataPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-[14px] font-medium text-navy">
          <Table2 className="w-4 h-4 text-accent" />
          Preview first {data.preview.length} rows
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Table (collapsible) */}
      {isOpen && (
        <div className="max-h-[500px] overflow-auto custom-scrollbar">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm text-slate-500 font-medium border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                {data.column_names.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 whitespace-nowrap border-b border-slate-100"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.preview.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                >
                  {data.column_names.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate"
                      title={String(row[col] ?? "")}
                    >
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-slate-300 italic">—</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

