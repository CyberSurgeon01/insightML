/**
 * src/app/page.tsx
 */
"use client";

import { useState, Suspense } from "react";
import { Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import { uploadDataset } from "@/lib/api";
import type { UploadResponse, UploadState } from "@/types/dataset";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function Home() {
  const [state, setState] = useState<UploadState>("idle");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleFile(file: File) {
    setState("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const data = await uploadDataset(file);
      setResult(data);
      setUploadedFile(file);
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setState("error");
    }
  }

  function handleReset() {
    setState("idle");
    setResult(null);
    setUploadedFile(null);
    setErrorMsg("");
    // We optionally remove the view query param by navigating to /
    window.history.replaceState({}, "", "/");
  }

  // Dashboard state: Hide the hero upload screen entirely
  if (state === "success" && result && uploadedFile) {
    return (
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>}>
        <DashboardShell data={result} file={uploadedFile} onReset={handleReset} />
      </Suspense>
    );
  }

  // Upload Landing State
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <nav className="px-8 py-5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[12px] font-black">I</div>
          <span className="text-[17px] font-bold text-navy tracking-tight">
            InsightML
          </span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl flex flex-col items-center gap-8 -mt-20">

          <div className="text-center">
            <h1 className="text-4xl font-black text-navy tracking-tight mb-3">
              Upload your dataset
            </h1>
            <p className="text-slate-500 text-[15px]">
              CSV and XLSX supported. All processing happens in-memory.
            </p>
          </div>

          <div className="w-full max-w-2xl bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <UploadZone onFile={handleFile} disabled={state === "loading"} />
          </div>

          {state === "loading" && (
            <div className="flex items-center gap-3 text-slate-500 text-[14px] bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="font-medium text-navy">Uploading and analysing your file…</span>
            </div>
          )}

          {state === "error" && (
            <div
              role="alert"
              className="w-full max-w-2xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 flex items-start gap-3 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] font-bold text-rose-800 mb-0.5">
                  Upload failed
                </p>
                <p className="text-[13px] text-rose-700">{errorMsg}</p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[12px] font-medium text-rose-600 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
