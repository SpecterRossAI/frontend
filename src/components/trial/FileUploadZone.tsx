import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, Loader2, Eye, Plus } from "lucide-react";
import type { UploadedFile } from "@/types/files";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface FileUploadZoneProps {
  caseId: string;
  onFilesUploaded: (files: UploadedFile[]) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: Error) => void;
  onAddMoreFiles?: (files: UploadedFile[]) => void;
  isProcessing: boolean;
  processed: boolean;
  fileCount: number;
  totalSize: number;
  onViewFiles: () => void;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const FileUploadZone = ({
  caseId,
  onFilesUploaded,
  onUploadStart,
  onUploadError,
  onAddMoreFiles,
  isProcessing,
  processed,
  fileCount,
  totalSize,
  onViewFiles,
}: FileUploadZoneProps) => {
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (fileList: File[]) => {
      if (fileList.length === 0) return;
      const pdfs = fileList.filter((f) => f.name && f.name.toLowerCase().endsWith(".pdf"));
      if (pdfs.length === 0) {
        const err = new Error("Only PDF files are supported. Please upload PDF documents.");
        onUploadError?.(err);
        throw err;
      }
      if (pdfs.length < fileList.length) {
        console.warn(`Skipped ${fileList.length - pdfs.length} non-PDF file(s). Only PDFs are uploaded to the case.`);
      }
      onUploadStart?.();
      const base = API_BASE || "";
      const results: UploadedFile[] = [];
      try {
        await Promise.all(
          pdfs.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${base}/api/cases/${encodeURIComponent(caseId)}/pdf`, {
              method: "POST",
              body: formData,
            });
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              throw new Error(typeof errBody?.detail === "string" ? errBody.detail : errBody?.error ?? "Upload failed");
            }
            const data = (await res.json()) as {
              case_id: string;
              doc_id: string;
              source_uri: string;
              chunks_count: number;
            };
            results.push({
              name: file.name,
              size: file.size,
              type: file.type || "application/pdf",
              path: data.source_uri,
              storedName: file.name,
              doc_id: data.doc_id,
              source_uri: data.source_uri,
            });
          })
        );
        onFilesUploaded(results);
      } catch (e) {
        onUploadError?.(e instanceof Error ? e : new Error(String(e)));
        throw e;
      }
    },
    [caseId, onFilesUploaded, onUploadStart, onUploadError]
  );

  const handleAddMoreChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = Array.from(e.target.files || []);
      e.target.value = "";
      if (fileList.length === 0 || !onAddMoreFiles) return;
      const pdfs = fileList.filter((f) => f.name && f.name.toLowerCase().endsWith(".pdf"));
      if (pdfs.length === 0) {
        onUploadError?.(new Error("Only PDF files are supported."));
        return;
      }
      onUploadStart?.();
      const base = API_BASE || "";
      const results: UploadedFile[] = [];
      try {
        await Promise.all(
          pdfs.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${base}/api/cases/${encodeURIComponent(caseId)}/pdf`, {
              method: "POST",
              body: formData,
            });
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              throw new Error(typeof errBody?.detail === "string" ? errBody.detail : errBody?.error ?? "Upload failed");
            }
            const data = (await res.json()) as {
              case_id: string;
              doc_id: string;
              source_uri: string;
              chunks_count: number;
            };
            results.push({
              name: file.name,
              size: file.size,
              type: file.type || "application/pdf",
              path: data.source_uri,
              storedName: file.name,
              doc_id: data.doc_id,
              source_uri: data.source_uri,
            });
          })
        );
        onAddMoreFiles(results);
      } catch (e) {
        onUploadError?.(e instanceof Error ? e : new Error(String(e)));
      }
    },
    [caseId, onAddMoreFiles, onUploadStart, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length) uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) uploadFiles(files);
      e.target.value = "";
    },
    [uploadFiles]
  );

  if (isProcessing) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Processing documents with AI...</p>
          <p className="text-xs text-muted-foreground mt-1">Parsing and indexing your case files</p>
        </div>
        <div className="w-56 h-2 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  if (processed) {
    return (
      <div className="rounded-xl border border-border bg-success/5 border-success/20 p-6">
        <input
          ref={addMoreInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleAddMoreChange}
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Processing Complete</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fileCount} file{fileCount !== 1 ? "s" : ""} · {formatBytes(totalSize)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onAddMoreFiles && (
              <button
                type="button"
                onClick={() => addMoreInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add More
              </button>
            )}
            <button
              onClick={onViewFiles}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/5 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              View Files
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative block rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02] bg-muted/20 p-14 text-center cursor-pointer transition-all duration-200 group"
    >
      <input type="file" multiple accept=".pdf,application/pdf" className="hidden" onChange={handleChange} />
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Drop files or <span className="text-primary underline underline-offset-2">browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            PDF only — documents are uploaded to your case and processed for AI. You can add more later.
          </p>
        </div>
      </div>
    </label>
  );
};

export default FileUploadZone;
