/**
 * src/components/UploadZone.tsx
 *
 * Drag-and-drop + click-to-browse file upload area.
 *
 * Props:
 *   onFile(file)  – called when a valid file is chosen or dropped
 *   disabled      – prevents interaction while a request is in flight
 */

"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload } from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes
const ALLOWED_EXTENSIONS = [".csv", ".xlsx"];
const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

function validateFile(file: File): string | null {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `"${ext || "no extension"}" is not supported. Please upload a .csv or .xlsx file.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 50 MB.`;
  }
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  return null; // valid
}

// ── Component ────────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function UploadZone({ onFile, disabled = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // ── Input handler ──────────────────────────────────────────────────────────

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  }

  // ── Shared validation + callback ───────────────────────────────────────────

  function processFile(file: File) {
    const error = validateFile(file);
    if (error) {
      setClientError(error);
      return;
    }
    setClientError(null);
    onFile(file);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const borderColor = isDragging
    ? "border-accent"
    : "border-accent/40 hover:border-accent/70";

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file drop zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={[
          "relative flex flex-col items-center justify-center gap-3",
          "rounded-xl border-2 border-dashed py-14 px-8",
          "transition-all duration-200 cursor-pointer select-none",
          isDragging ? "bg-accent/5 border-accent" : `bg-white ${borderColor}`,
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {/* Icon */}
        <Upload
          className={`w-10 h-10 ${isDragging ? "text-accent" : "text-accent/70"} transition-colors`}
          strokeWidth={1.5}
        />

        {/* Label */}
        <p className="text-[15px] text-slate-600">
          Drop your file here or{" "}
          <span className="text-accent font-medium underline underline-offset-2">
            browse
          </span>
        </p>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
          aria-hidden
        />
      </div>

      {/* Limits row */}
      <div className="flex items-center justify-center gap-6 mt-3 text-[13px] text-slate-400">
        <span>Maximum file size: 50 MB</span>
        <span className="w-px h-3 bg-slate-200" aria-hidden />
        <span>Maximum rows: 1,000,000</span>
      </div>

      {/* Client-side validation error */}
      {clientError && (
        <p
          role="alert"
          className="mt-3 text-center text-[13px] text-red-500 font-medium"
        >
          {clientError}
        </p>
      )}
    </div>
  );
}

