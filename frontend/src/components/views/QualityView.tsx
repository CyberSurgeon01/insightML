/**
 * src/components/views/QualityView.tsx
 */
"use client";

import { ShieldAlert } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";
import QualitySection from "@/components/QualitySection";

export default function QualityView({ data }: { data: UploadResponse }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-5 h-5 text-indigo-500" />
        <h1 className="text-[20px] font-bold text-navy">Data Quality</h1>
      </div>
      
      {/* 
        QualitySection has its own heading structure in the original implementation,
        but we are composing it here. 
      */}
      <div className="-mt-8">
        <QualitySection quality={data.quality} />
      </div>
    </div>
  );
}
