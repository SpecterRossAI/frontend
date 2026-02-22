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
  FileSearch,
  Upload,
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

const getDocTypeCounts = (files: UploadedFile[]) => {
  const pdf = files.filter((f) => f.type.includes("pdf")).length;
  const images = files.filter((f) => f.type.includes("image")).length;
  const text = files.filter((f) => f.type.includes("text") || f.type.includes("plain")).length;
  const other = files.length - pdf - images - text;
  return { pdf, images, text, other };
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
}: CaseDocumentsDashboardProps) => {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const tree = buildTree(files);
  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const counts = getDocTypeCounts(files);
  const previewUrl =
    caseId && selectedFile && (selectedFile.storedName ?? selectedFile.name)
      ? `${API_BASE || ""}/api/cases/${encodeURIComponent(caseId)}/files/${encodeURIComponent(selectedFile.storedName ?? selectedFile.name)}`
      : null;
  const isPdf = selectedFile?.type === "application/pdf";
  const isImage = selectedFile?.type?.startsWith("image/");

  const handleSelect = (f: UploadedFile) => {
    setSelectedFile(f);
    setPreviewOpen(true);
  };

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-card border border-border border-l-0 rounded-r-xl hover:bg-muted transition-colors shadow-md"
        title="Open Case Documents"
      >
        <PanelLeft className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <>
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 360, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="h-full border-r border-border bg-slate-50 flex flex-col shrink-0 overflow-hidden z-20"
      >
        {/* Dashboard Header */}
        <div className="px-5 py-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Case Documents</p>
                <p className="text-[11px] text-muted-foreground font-medium">Dashboard</p>
              </div>
            </div>
            <button onClick={onToggle} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-lg font-bold text-foreground tabular-nums">{files.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Documents</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-lg font-bold text-foreground tabular-nums">{formatBytes(totalSize)}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Total Size</p>
            </div>
          </div>

          {/* BY TYPE + Add More */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">By Type</p>
            {onAddMore && (
              <button
                onClick={onAddMore}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/10 transition-colors"
              >
                <Upload className="w-3 h-3" />
                Add More
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {counts.pdf > 0 && (
              <span className="px-2 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-medium">
                {counts.pdf} PDF
              </span>
            )}
            {counts.images > 0 && (
              <span className="px-2 py-1 rounded-lg bg-info/5 text-info text-[10px] font-medium">
                {counts.images} Images
              </span>
            )}
            {counts.text > 0 && (
              <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[10px] font-medium">
                {counts.text} Text
              </span>
            )}
            {counts.other > 0 && (
              <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[10px] font-medium">
                {counts.other} Other
              </span>
            )}
          </div>

          {/* AI Processing Status - only when files exist */}
          {isProcessed && files.length > 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-success/5 border border-success/20">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <div>
                <p className="text-xs font-semibold text-success">AI Processed</p>
                <p className="text-[10px] text-muted-foreground">Indexed & ready for trial</p>
              </div>
            </div>
          )}
        </div>

        {/* File Tree Section */}
        <div className="flex-1 overflow-y-auto p-5 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">File Explorer</p>
            <FileSearch className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          {files.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No documents yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Upload in the main panel</p>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/20 border border-border p-2">
              {tree.map((node, i) => (
                <TreeItem key={i} node={node} onSelect={handleSelect} selectedFile={selectedFile} />
              ))}
            </div>
          )}
        </div>
      </motion.aside>

      {/* File Preview Overlay */}
      <AnimatePresence>
        {previewOpen && selectedFile && (
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
