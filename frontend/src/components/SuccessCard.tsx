/**
 * src/components/SuccessCard.tsx
 *
 * Displays a success banner and a 4-column stat grid after a successful upload.
 * Shows: Rows / Columns / File Size / Format
 */

import { CheckCircle2 } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";

interface SuccessCardProps {
  data: UploadResponse;
}

/** Format bytes into a human-readable string (KB, MB, etc.) */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Format a large number with commas: 1000000 → "1,000,000" */
function formatNumber(n: number): string {
  return n.toLocaleString();
}

// ── Stat cell ─────────────────────────────────────────────────────────────────

interface StatProps {
  label: string;
  value: string;
  border?: boolean;
}

function Stat({ label, value, border = true }: StatProps) {
  return (
    <div
      className={[
        "flex flex-col gap-1 px-6 py-1",
        border ? "border-l border-slate-200 first:border-l-0" : "",
      ].join(" ")}
    >
      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="text-xl font-bold text-navy">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SuccessCard({ data }: SuccessCardProps) {
  return (
    <div className="w-full rounded-xl border border-accent/20 bg-accent-light px-6 py-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/15">
          <CheckCircle2 className="w-5 h-5 text-accent" />
        </span>
        <span className="text-[15px] font-semibold text-navy">
          Dataset loaded successfully
        </span>
      </div>

      {/* Stats grid */}
      <div className="flex flex-wrap items-center">
        <Stat label="Rows" value={formatNumber(data.rows)} border={false} />
        <Stat label="Columns" value={formatNumber(data.columns)} />
        <Stat label="Size" value={formatBytes(data.file_size_bytes)} />
        <Stat label="Format" value={data.format} />
      </div>
    </div>
  );
}

