/**
 * src/components/ProfileSummary.tsx
 *
 * Displays a "Dataset Profile" section with:
 *   1. Summary stat cards (rows, columns, memory, missing values, duplicates)
 *   2. Feature-type breakdown badges (numerical, categorical, boolean, datetime)
 */

import {
  BarChart3,
  Columns3,
  HardDrive,
  AlertTriangle,
  Copy,
  Hash,
  Type,
  ToggleLeft,
  Clock,
} from "lucide-react";
import type { DatasetProfile } from "@/types/dataset";

interface ProfileSummaryProps {
  profile: DatasetProfile;
}

// ── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3.5 min-w-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 shrink-0 mt-0.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
          {label}
        </p>
        <p className="text-lg font-bold text-navy leading-tight">{value}</p>
        {sub && (
          <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Type badge ───────────────────────────────────────────────────────────────

interface TypeBadgeProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}

function TypeBadge({ icon, label, count, color }: TypeBadgeProps) {
  if (count === 0) return null;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${color}`}>
      {icon}
      <span>{count}</span>
      <span className="text-[11px] opacity-70">{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileSummary({ profile }: ProfileSummaryProps) {
  return (
    <div className="w-full space-y-4">
      {/* Detailed Column Profiles (Bounded Scroll Area) */}
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar border-t border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 text-[15px] font-semibold text-navy">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <span>Dataset Profile</span>
                </div>
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<BarChart3 className="w-4 h-4 text-accent" />}
          label="Rows"
          value={profile.total_rows.toLocaleString()}
        />
        <StatCard
          icon={<Columns3 className="w-4 h-4 text-accent" />}
          label="Columns"
          value={profile.total_columns.toLocaleString()}
        />
        <StatCard
          icon={<HardDrive className="w-4 h-4 text-accent" />}
          label="Memory"
          value={profile.memory_usage}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          label="Missing"
          value={profile.total_missing.toLocaleString()}
          sub={`${profile.missing_percentage}% of cells`}
        />
        <StatCard
          icon={<Copy className="w-4 h-4 text-slate-400" />}
          label="Duplicates"
          value={profile.duplicate_rows.toLocaleString()}
          sub={profile.duplicate_rows === 0 ? "No duplicates" : "duplicate rows"}
        />
      </div>

      {/* Type breakdown */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wider mr-1">
          Types
        </span>
        <TypeBadge
          icon={<Hash className="w-3 h-3" />}
          label="Numerical"
          count={profile.numerical_count}
          color="bg-blue-50 text-blue-600"
        />
        <TypeBadge
          icon={<Type className="w-3 h-3" />}
          label="Categorical"
          count={profile.categorical_count}
          color="bg-emerald-50 text-emerald-600"
        />
        <TypeBadge
          icon={<ToggleLeft className="w-3 h-3" />}
          label="Boolean"
          count={profile.boolean_count}
          color="bg-purple-50 text-purple-600"
        />
        <TypeBadge
          icon={<Clock className="w-3 h-3" />}
          label="Datetime"
          count={profile.datetime_count}
          color="bg-orange-50 text-orange-600"
        />
      </div>
    </div>
  );
}

