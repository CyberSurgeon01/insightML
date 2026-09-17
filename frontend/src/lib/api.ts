/**
 * src/lib/api.ts
 *
 * Thin wrapper around the fetch API for communicating with the FastAPI backend.
 * Centralising this here means the URL only lives in one place.
 */

import type { UploadResponse } from "@/types/dataset";

/**
 * Upload a file to the backend and return the parsed response.
 *
 * @param file - The File object selected by the user.
 * @throws  Error with a human-readable message if the request fails.
 */
export async function uploadDataset(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/datasets/upload", {
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

