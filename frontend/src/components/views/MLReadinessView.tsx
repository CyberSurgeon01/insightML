/**
 * src/components/views/MLReadinessView.tsx
 */
"use client";

import { Target } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";
import ReadinessSection from "@/components/ReadinessSection";

export default function MLReadinessView({ data, file }: { data: UploadResponse, file: File }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-indigo-500" />
        <h1 className="text-[20px] font-bold text-navy">ML Readiness & Baseline</h1>
      </div>
      
      <div className="-mt-8">
        <ReadinessSection data={data} file={file} />
      </div>
    </div>
  );
}

