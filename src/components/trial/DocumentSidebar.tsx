import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, FileText, Image, File, ChevronRight, ChevronDown, X, PanelLeftClose, PanelLeft } from "lucide-react";
import type { UploadedFile } from "@/types/files";

interface DocumentSidebarProps {
  files: UploadedFile[];
  caseId?: string;
  open: boolean;
  onToggle: () => void;
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
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
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
      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
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

const API_BASE = import.meta.env.VITE_API_URL || "";

const DocumentSidebar = ({ files, caseId, open, onToggle }: DocumentSidebarProps) => {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const tree = buildTree(files);
  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const previewUrl =
    caseId && (selectedFile?.storedName ?? selectedFile?.name)
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
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-card border border-border border-l-0 rounded-r-lg hover:bg-muted transition-colors shadow-sm"
        title="Open Documents"
      >
        <PanelLeft className="w-4 h-4 text-muted-foreground" />
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
        className="h-full border-r border-border bg-card flex flex-col shrink-0 overflow-hidden z-20"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Case Documents</p>
              <p className="text-[10px] text-muted-foreground">
                {files.length} files · {formatBytes(totalSize)}
              </p>
            </div>
          </div>
          <button onClick={onToggle} className="p-1 rounded-md hover:bg-muted transition-colors shrink-0">
            <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* File tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {files.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No documents uploaded yet</p>
          ) : (
            tree.map((node, i) => (
              <TreeItem key={i} node={node} onSelect={handleSelect} selectedFile={selectedFile} />
            ))
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-6"
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] surface-modal flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {getIcon(selectedFile.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(selectedFile.size)} · {selectedFile.type || "Document"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 min-h-0 rounded-b-lg border-border bg-muted/30 overflow-hidden">
                {previewUrl && isPdf && (
                  <iframe src={previewUrl} title={selectedFile.name} className="w-full h-full min-h-[60vh]" />
                )}
                {previewUrl && isImage && (
                  <div className="w-full h-full min-h-[60vh] flex items-center justify-center p-4">
                    <img src={previewUrl} alt={selectedFile.name} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                {(!previewUrl || (!isPdf && !isImage)) && (
                  <div className="p-12 flex flex-col items-center justify-center gap-2 text-center">
                    <p className="text-sm text-muted-foreground">
                      {!previewUrl ? "Preview not available for this file." : "Preview not available for this file type."}
                    </p>
                    {previewUrl && (
                      <a href={previewUrl} download={selectedFile.name} className="text-sm text-primary hover:underline">
                        Download
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DocumentSidebar;
