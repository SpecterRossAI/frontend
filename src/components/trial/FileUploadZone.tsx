import { useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, Loader2, Eye } from "lucide-react";
import type { UploadedFile } from "@/types/files";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface FileUploadZoneProps {
  caseId: string;
  onFilesUploaded: (files: UploadedFile[]) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: Error) => void;
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

const FileUploadZone = ({ caseId, onFilesUploaded, onUploadStart, onUploadError, isProcessing, processed, fileCount, totalSize, onViewFiles }: FileUploadZoneProps) => {
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
      <div className="rounded-lg border border-border bg-muted/50 p-8 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Processing documents with AI...</p>
        <div className="w-48 h-1.5 rounded-full bg-border overflow-hidden">
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
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">AI Processing Complete</p>
              <p className="text-xs text-muted-foreground">
                {fileCount} files · {formatBytes(totalSize)}
              </p>
            </div>
          </div>
          <button
            onClick={onViewFiles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Files
          </button>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative block rounded-lg border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 p-10 text-center cursor-pointer transition-colors group"
    >
      <input type="file" multiple className="hidden" onChange={handleChange} />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Drop files or <span className="text-primary underline underline-offset-2">browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF only — documents are uploaded to your case and processed for AI
          </p>
        </div>
      </div>
    </label>
  );
};

export default FileUploadZone;
