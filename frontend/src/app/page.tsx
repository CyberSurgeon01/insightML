/**
 * src/app/page.tsx
 *
 * Main page – handles upload (Phase 2) and profiling display (Phase 3).
 *
 * State machine:
 *   idle     → user sees the upload zone
 *   loading  → spinner while request is in flight
 *   success  → success card + profile + column details + preview
 *   error    → error banner shown below upload zone
 *
 * Uploading a new file from any state resets back to loading.
 */

"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";

import UploadZone from "@/components/UploadZone";
import SuccessCard from "@/components/SuccessCard";
import ProfileSummary from "@/components/ProfileSummary";
import ColumnDetails from "@/components/ColumnDetails";
import RelationshipsSection from "@/components/RelationshipsSection";
import DataPreview from "@/components/DataPreview";
import { uploadDataset } from "@/lib/api";
import type { UploadResponse, UploadState } from "@/types/dataset";

// ── Page component ────────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<UploadState>("idle");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Called by UploadZone when the user picks/drops a valid file.
  async function handleFile(file: File) {
    setState("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const data = await uploadDataset(file);
      setResult(data);
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setState("error");
    }
  }

  function handleReset() {
    setState("idle");
    setResult(null);
    setErrorMsg("");
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <nav className="px-8 py-5">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-navy" strokeWidth={2.5} />
          <span className="text-[17px] font-bold text-navy tracking-tight">
            InsightML
          </span>
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center px-4 pt-12 pb-16">
        {/* Card — wider max-width now to accommodate the column details table */}
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-navy tracking-tight mb-2">
              Upload your dataset
            </h1>
            <p className="text-slate-500 text-[15px]">
              CSV and XLSX supported
            </p>
          </div>

          {/* Upload zone */}
          <div className="w-full max-w-2xl">
            <UploadZone onFile={handleFile} disabled={state === "loading"} />
          </div>

          {/* ── State-dependent panels ──────────────────────────────────────── */}

          {/* Loading */}
          {state === "loading" && (
            <div className="flex items-center gap-3 text-slate-500 text-[14px]">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span>Uploading and analysing your file…</span>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div
              role="alert"
              className="w-full max-w-2xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-red-700 mb-0.5">
                  Upload failed
                </p>
                <p className="text-[13px] text-red-600">{errorMsg}</p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[12px] text-red-500 hover:text-red-700 transition-colors shrink-0 mt-0.5"
                title="Try again"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          )}

          {/* Success */}
          {state === "success" && result && (
            <>
              {/* Phase 2: Upload success card */}
              <div className="w-full max-w-2xl">
                <SuccessCard data={result} />
              </div>

              {/* Phase 3: Dataset profile */}
              <ProfileSummary profile={result.profile} />
              <ColumnDetails profile={result.profile} />

              {/* Phase 4: Feature Relationships */}
              <RelationshipsSection relationships={result.relationships} />

              {/* Phase 2: Row preview */}
              <DataPreview data={result} />

              {/* Upload another */}
              <button
                onClick={handleReset}
                className="text-[13px] text-slate-400 hover:text-accent transition-colors underline underline-offset-2"
              >
                Upload a different file
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
