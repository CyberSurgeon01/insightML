/**
 * src/components/InsightsSection.tsx
 *
 * Smart Insights component to display top-level analysis takeaways.
 */

"use client";

import { useState } from "react";
import { Lightbulb, AlertCircle, Sparkles, Activity, ShieldAlert, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import type { Insight, InsightResult } from "@/types/dataset";

interface InsightsSectionProps {
  insightsResult?: InsightResult;
}

export default function InsightsSection({ insightsResult }: InsightsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  
  if (!insightsResult || insightsResult.insights.length === 0) return null;

  const insights = insightsResult.insights;
  const topInsights = insights.slice(0, 3);
  const remainingInsights = insights.slice(3);

  function jumpToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function getPriorityStyles(priority: string) {
    if (priority === "High") return "bg-red-50 text-red-700 border-red-200";
    if (priority === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  function getCategoryIcon(category: string) {
    if (category === "Data Quality") return <ShieldAlert className="w-4 h-4" />;
    if (category === "Numerical Relationship") return <Activity className="w-4 h-4" />;
    if (category === "Categorical Relationship") return <Activity className="w-4 h-4" />;
    if (category === "Recommendation") return <Sparkles className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  }

  function InsightCard({ insight }: { insight: Insight }) {
    const isExpanded = expandedInsight === insight.insight_id;
    
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${getPriorityStyles(insight.priority)}`}>
              {getCategoryIcon(insight.category)}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {insight.category}
            </span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getPriorityStyles(insight.priority)}`}>
            {insight.priority}
          </span>
        </div>
        
        <div className="space-y-1 mt-1">
          <h3 className="text-[15px] font-bold text-navy leading-snug">{insight.title}</h3>
          <p className="text-[13px] text-slate-600 leading-relaxed">{insight.summary}</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-1">
          <p className="text-[12px] font-medium text-navy mb-1">Recommended Action</p>
          <p className="text-[12px] text-slate-600">{insight.recommended_action}</p>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <button 
            onClick={() => setExpandedInsight(isExpanded ? null : insight.insight_id)}
            className="flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-navy transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {isExpanded ? "Hide Evidence" : "Show Evidence"}
          </button>
          
          <button 
            onClick={() => jumpToSection(insight.source_section)}
            className="flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Jump to section <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-2 text-[12px] bg-slate-800 text-slate-300 rounded-lg p-3 overflow-x-auto">
            <div className="font-mono">
              <span className="text-accent-light">Affected Columns:</span> {insight.evidence.affected_columns.join(", ") || "None"}
            </div>
            <div className="font-mono mt-1">
              <span className="text-accent-light">Metrics:</span> {JSON.stringify(insight.evidence.metrics, null, 2)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 mt-2 mb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h2 className="text-[17px] font-semibold text-navy">Key Insights</h2>
        </div>
        <div className="text-[12px] text-slate-500 italic">
          * Automatically generated from statistical checks.
        </div>
      </div>

      {/* Top Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topInsights.map(insight => (
          <InsightCard key={insight.insight_id} insight={insight} />
        ))}
      </div>

      {/* Show more button */}
      {remainingInsights.length > 0 && !showAll && (
        <div className="text-center pt-2">
          <button 
            onClick={() => setShowAll(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-[13px] font-medium text-navy rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            Show {remainingInsights.length} more insights
          </button>
        </div>
      )}

      {/* Remaining Insights Grid */}
      {showAll && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          {remainingInsights.map(insight => (
            <InsightCard key={insight.insight_id} insight={insight} />
          ))}
        </div>
      )}

    </div>
  );
}
