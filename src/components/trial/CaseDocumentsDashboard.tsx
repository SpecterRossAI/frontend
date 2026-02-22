import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  FileText,
  Image,
  File,
  ChevronRight,
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeft,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import type { UploadedFile } from "@/types/files";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface CaseDocumentsDashboardProps {
  files: UploadedFile[];
  caseId?: string;
  open: boolean;
  onToggle: () => void;
  onAddMore?: () => void;
  isProcessed?: boolean;
  /** When "split", file selection is reported to parent and no modal is shown (e.g. for simulation split-screen). */
  previewMode?: "modal" | "split";
  /** Controlled selected file when previewMode === "split"; used for tree highlight. */
  previewFile?: UploadedFile | null;
  /** Called when user selects a file (split mode: open in side pane; modal mode still opens modal). */
  onPreviewFile?: (file: UploadedFile | null) => void;
}

interface TreeNode {
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
  file?: UploadedFile;
}

const buildTree = (files: UploadedFile[]): TreeNode[] => {
  const root: TreeNode = { name: "Case Files", type: "folder", children: [] };
  const evidence: TreeNode = { name: "Evidence", type: "folder", children: [] };
  const depositions: TreeNode = { name: "Depositions", type: "folder", children: [] };
  const misc: TreeNode = { name: "Documents", type: "folder", children: [] };

  files.forEach((f) => {
    const node: TreeNode = { name: f.name, type: "file", file: f };
    if (f.type.includes("image")) evidence.children!.push(node);
    else if (f.name.toLowerCase().includes("deposition") || f.name.toLowerCase().includes("witness"))
      depositions.children!.push(node);
    else misc.children!.push(node);
  });

  if (misc.children!.length) root.children!.push(misc);
  if (evidence.children!.length) root.children!.push(evidence);
  if (depositions.children!.length) root.children!.push(depositions);

  if (root.children!.length === 1 && root.children![0].children!.length === files.length) {
    root.children = files.map((f) => ({ name: f.name, type: "file" as const, file: f }));
  }

  return [root];
};

const getIcon = (name: string) => {
  if (name.match(/\.(pdf|docx?|txt)$/i)) return <FileText className="w-4 h-4 text-primary" />;
  if (name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return <Image className="w-4 h-4 text-info" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const TreeItem = ({
  node,
  depth = 0,
  onSelect,
  selectedFile,
}: {
  node: TreeNode;
  depth?: number;
  onSelect: (f: UploadedFile) => void;
  selectedFile: UploadedFile | null;
}) => {
  const [expanded, setExpanded] = useState(true);

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:bg-muted rounded-lg transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
          <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-medium truncate">{node.name}</span>
        </button>
        <AnimatePresence>
          {expanded &&
            node.children?.map((child, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TreeItem node={child} depth={depth + 1} onSelect={onSelect} selectedFile={selectedFile} />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    );
  }

  const isSelected = selectedFile?.name === node.file?.name;

  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors ${
        isSelected
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      {getIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
};

const CaseDocumentsDashboard = ({
  files,
  caseId,
  open,
  onToggle,
  onAddMore,
  isProcessed = true,
  previewMode = "modal",
  previewFile,
  onPreviewFile,
}: CaseDocumentsDashboardProps) => {
  const [internalSelected, setInternalSelected] = useState<UploadedFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isSplit = previewMode === "split";
  const selectedFile = isSplit ? (previewFile ?? null) : (internalSelected ?? null);
  const tree = buildTree(files);
  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const previewUrl =
    caseId && selectedFile && (selectedFile.storedName ?? selectedFile.name)
      ? `${API_BASE || ""}/api/cases/${encodeURIComponent(caseId)}/files/${encodeURIComponent(selectedFile.storedName ?? selectedFile.name)}`
      : null;
  const isPdf = selectedFile?.type === "application/pdf";
  const isImage = selectedFile?.type?.startsWith("image/");

  const handleSelect = (f: UploadedFile) => {
    if (isSplit) {
      onPreviewFile?.(f);
      return;
    }
    setInternalSelected(f);
    setPreviewOpen(true);
  };

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-card/95 backdrop-blur-sm border border-border/80 border-l-0 rounded-r-xl hover:bg-muted/80 transition-colors shadow-lg"
        title="Open Case Documents"
      >
        <PanelLeft className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    );
  }

  return (
    <>
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 260, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="h-full border-r border-border/80 bg-card/95 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden z-20"
      >
        {/* Slim header */}
        <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground truncate">Documents</span>
          </div>
          <button onClick={onToggle} className="p-1 rounded-lg hover:bg-muted/80 shrink-0">
            <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Stats + status - compact */}
        <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground tabular-nums">{files.length} docs · {formatBytes(totalSize)}</span>
          {isProcessed && files.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-success font-medium">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              Indexed
            </span>
          )}
          {onAddMore && (
            <button onClick={onAddMore} className="text-[10px] text-primary font-medium hover:underline shrink-0">
              Add
            </button>
          )}
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {files.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-6 text-center">
              <FolderOpen className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-[11px] text-muted-foreground">No documents yet</p>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/10 border border-border/60 p-1.5">
              {tree.map((node, i) => (
                <TreeItem key={i} node={node} onSelect={handleSelect} selectedFile={selectedFile} />
              ))}
            </div>
          )}
        </div>
      </motion.aside>

      {/* File Preview Overlay (only in modal mode) */}
      <AnimatePresence>
        {!isSplit && previewOpen && selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 backdrop-blur-md p-6"
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl surface-modal p-8 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {getIcon(selectedFile.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(selectedFile.size)} · {selectedFile.type || "Document"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setPreviewOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="rounded-xl bg-muted/50 border border-border overflow-hidden flex items-center justify-center min-h-[50vh]">
                {previewUrl && isPdf && (
                  <iframe src={previewUrl} title={selectedFile.name} className="w-full h-full min-h-[50vh]" />
                )}
                {previewUrl && isImage && (
                  <img src={previewUrl} alt={selectedFile.name} className="max-w-full max-h-[70vh] object-contain" />
                )}
                {(!previewUrl || (!isPdf && !isImage)) && (
                  <p className="text-sm text-muted-foreground text-center p-8">
                    {!previewUrl ? "Preview not available for this file." : "Preview not available for this file type."}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CaseDocumentsDashboard;
