/**
 * src/lib/api.ts
 *
 * Thin wrapper around the fetch API for communicating with the FastAPI backend.
 * Centralising this here means the URL only lives in one place.
 */

import type { UploadResponse } from "@/types/dataset";

// We use an empty string by default because Next.js rewrites in next.config.js
// proxy the requests from /api/* to the backend at localhost:8000.
// This allows the app to work seamlessly across the local network (e.g. from an iPad).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Upload a file to the backend and return the parsed response.
 *
 * @param file - The File object selected by the user.
 * @throws  Error with a human-readable message if the request fails.
 */
export async function uploadDataset(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/datasets/upload`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type manually — the browser must set it
    // so the multipart boundary is included automatically.
  });

  if (!response.ok) {
    // Try to extract a detail message from the FastAPI error response.
    let detail = `Server error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.detail) {
        detail = errorBody.detail;
      }
    } catch {
      // ignore JSON parse failures — keep the default message
    }
    throw new Error(detail);
  }

  return response.json() as Promise<UploadResponse>;
}


// ── Phase 8 Export Helpers ──────────────────────────────────────────────────

export async function exportReportJson(data: import("@/types/dataset").UploadResponse): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/export/json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Export failed");
  triggerDownload(await res.blob(), extractFilename(res, "insightml_report.json"));
}

export async function exportReportCsv(data: import("@/types/dataset").UploadResponse, type: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/export/csv/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Export failed");
  triggerDownload(await res.blob(), extractFilename(res, `insightml_${type}.csv`));
}

export async function exportReportPdf(data: import("@/types/dataset").UploadResponse): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Export failed");
  triggerDownload(await res.blob(), extractFilename(res, "insightml_report.pdf"));
}

function extractFilename(res: Response, fallback: string): string {
  const disposition = res.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    return disposition.split("filename=")[1].replace(/"/g, "");
  }
  return fallback;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function assessMlReadiness(
  file: File,
  targetColumn: string,
  taskType: string = "auto"
): Promise<import("@/types/dataset").MLReadinessResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_column", targetColumn);
  formData.append("task_type", taskType);

  const res = await fetch(`${API_BASE_URL}/api/ml-readiness`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let detail = "Failed to assess ML readiness.";
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json() as Promise<import("@/types/dataset").MLReadinessResponse>;
}

export async function trainBaselineModel(
  file: File,
  targetColumn: string,
  taskType: string,
  features: string[],
  leakageConfirmed: boolean
): Promise<import("@/types/dataset").BaselineModelResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_column", targetColumn);
  formData.append("task_type", taskType);
  formData.append("features", JSON.stringify(features));
  if (leakageConfirmed) formData.append("leakage_confirmed", "true");

  const res = await fetch(`${API_BASE_URL}/api/models/baseline`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let detail = "Failed to train baseline model.";
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json() as Promise<import("@/types/dataset").BaselineModelResponse>;
}
