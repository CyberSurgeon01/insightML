/**
 * src/components/views/InsightsView.tsx
 */
"use client";

import { Lightbulb } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";
import InsightsSection from "@/components/InsightsSection";

export default function InsightsView({ data, onChangeView }: { data: UploadResponse, onChangeView: (view: string) => void }) {
  // InsightsSection currently has internal anchor links like #quality
  // We should ideally intercept them, but since we are refactoring state,
  // we could pass onChangeView if InsightsSection supported it. 
  // For now, we render it directly. (If user clicks an anchor hash, the URL changes, 
  // they might need to use sidebar to navigate back properly, or we can patch InsightsSection later if needed).

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-indigo-500" />
        <h1 className="text-[20px] font-bold text-navy">Smart Insights</h1>
      </div>
      
      <div className="-mt-8">
        <InsightsSection insightsResult={data.insights} />
      </div>
    </div>
  );
}

