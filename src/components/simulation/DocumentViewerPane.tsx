import { PanelLeftClose } from "lucide-react";
import type { UploadedFile } from "@/types/files";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface DocumentViewerPaneProps {
  file: UploadedFile;
  caseId: string;
  onClose: () => void;
  className?: string;
}

export default function DocumentViewerPane({ file, caseId, onClose, className = "" }: DocumentViewerPaneProps) {
  const previewUrl =
    caseId && (file.storedName ?? file.name)
      ? `${API_BASE || ""}/api/cases/${encodeURIComponent(caseId)}/files/${encodeURIComponent(file.storedName ?? file.name)}`
      : null;
  const isPdf = file.type === "application/pdf";
  const isImage = file.type?.startsWith("image/");
  const pdfUrlWithZoom = previewUrl && isPdf ? `${previewUrl}#zoom=100` : null;

  return (
    <div
      className={`flex flex-col h-full min-w-0 bg-card border-r border-border shadow-sm relative ${className}`}
    >
      {/* Minimal minimize control - floating top-right */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Minimize document viewer"
      >
        <PanelLeftClose className="w-4 h-4" />
      </button>

      {/* Content area - no header */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-background/50">
        {pdfUrlWithZoom && (
          <iframe
            src={pdfUrlWithZoom}
            title={file.name}
            className="w-full h-full min-h-0 border-0 bg-background"
          />
        )}
        {previewUrl && isImage && (
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20">
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-border"
            />
          </div>
        )}
        {(!previewUrl || (!isPdf && !isImage)) && (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground text-center">
              {!previewUrl
                ? "Preview not available for this file."
                : "Preview not available for this file type."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
