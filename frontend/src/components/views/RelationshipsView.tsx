/**
 * src/components/views/RelationshipsView.tsx
 */
"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import type { UploadResponse } from "@/types/dataset";
import RelationshipsSection from "@/components/RelationshipsSection";
import CategoricalSection from "@/components/CategoricalSection";

export default function RelationshipsView({ data }: { data: UploadResponse }) {
  const [tab, setTab] = useState<"numerical" | "categorical">("numerical");

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-indigo-500" />
          <h1 className="text-[20px] font-bold text-navy">Relationships</h1>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setTab("numerical")}
            className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              tab === "numerical" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-navy"
            }`}
          >
            Numerical
          </button>
          <button 
            onClick={() => setTab("categorical")}
            className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              tab === "categorical" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-navy"
            }`}
          >
            Categorical
          </button>
        </div>
      </div>

      <div className="-mt-8">
        {tab === "numerical" && (
          <RelationshipsSection relationships={data.numerical_relationships} />
        )}
        
        {tab === "categorical" && (
          <CategoricalSection categorical={data.categorical_relationships} />
        )}
      </div>

    </div>
  );
}
