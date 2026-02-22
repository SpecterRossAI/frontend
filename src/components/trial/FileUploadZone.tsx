import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle2, Loader2, Eye, Plus } from "lucide-react";
import type { UploadedFile } from "@/types/files";

interface FileUploadZoneProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
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

const FileUploadZone = ({ onFilesUploaded, onAddMoreFiles, isProcessing, processed, fileCount, totalSize, onViewFiles }: FileUploadZoneProps) => {
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleAddMoreChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        path: f.webkitRelativePath || f.name,
      }));
      if (files.length && onAddMoreFiles) {
        onAddMoreFiles(files);
      }
      e.target.value = "";
    },
    [onAddMoreFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        path: f.name,
      }));
      if (files.length) onFilesUploaded(files);
    },
    [onFilesUploaded]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        path: f.webkitRelativePath || f.name,
      }));
      if (files.length) onFilesUploaded(files);
    },
    [onFilesUploaded]
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
      <input type="file" multiple className="hidden" onChange={handleChange} />
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Drop files or <span className="text-primary underline underline-offset-2">browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            PDF, DOCX, TXT, Images — supports folders
          </p>
        </div>
      </div>
    </label>
  );
};

export default FileUploadZone;
