/**
 * src/components/views/ReportsView.tsx
 */
"use client";

import { FileDown } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";
import ExportSection from "@/components/ExportSection";

export default function ReportsView({ data }: { data: UploadResponse }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <FileDown className="w-5 h-5 text-indigo-500" />
        <h1 className="text-[20px] font-bold text-navy">Reports & Exports</h1>
      </div>
      
      <div className="-mt-8">
        <ExportSection data={data} />
      </div>
    </div>
  );
}
