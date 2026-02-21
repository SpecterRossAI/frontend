import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, FolderOpen, Image, File, ChevronRight, ChevronDown, CheckCircle2, Upload } from "lucide-react";
import type { UploadedFile } from "@/types/files";

interface FileExplorerModalProps {
  open: boolean;
  onClose: () => void;
  files: UploadedFile[];
  onConfirmSelection?: (files: UploadedFile[]) => void;
  selectionMode?: boolean;
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
    else if (f.name.toLowerCase().includes("deposition") || f.name.toLowerCase().includes("witness")) depositions.children!.push(node);
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

const TreeItem = ({ node, depth = 0, onSelect, selectedFiles, selectionMode }: {
  node: TreeNode;
  depth?: number;
  onSelect: (f: UploadedFile) => void;
  selectedFiles: Set<string>;
  selectionMode: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          <FolderOpen className="w-4 h-4 text-primary" />
          <span className="font-medium">{node.name}</span>
        </button>
        <AnimatePresence>
          {expanded && node.children?.map((child, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TreeItem node={child} depth={depth + 1} onSelect={onSelect} selectedFiles={selectedFiles} selectionMode={selectionMode} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  const isSelected = node.file ? selectedFiles.has(node.file.name) : false;

  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
        isSelected
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      style={{ paddingLeft: `${depth * 16 + 12}px` }}
    >
      {selectionMode && (
        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
          isSelected ? "bg-primary border-primary" : "border-border"
        }`}>
          {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
        </span>
      )}
      <span className="w-3.5" />
      {getIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const FileExplorerModal = ({ open, onClose, files, onConfirmSelection, selectionMode = false }: FileExplorerModalProps) => {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set(files.map(f => f.name)));
  const tree = buildTree(files);
  const totalSize = files.reduce((a, f) => a + f.size, 0);

  const handleSelect = (f: UploadedFile) => {
    if (selectionMode) {
      setSelectedFiles(prev => {
        const next = new Set(prev);
        if (next.has(f.name)) next.delete(f.name);
        else next.add(f.name);
        return next;
      });
    }
    setSelectedFile(f);
  };

  const handleConfirm = () => {
    if (onConfirmSelection) {
      const selected = files.filter(f => selectedFiles.has(f.name));
      onConfirmSelection(selected);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl h-[70vh] surface-modal flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Case Documents</h3>
                <p className="text-xs text-muted-foreground">{files.length} files · {formatBytes(totalSize)}</p>
              </div>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-success/10 text-success uppercase tracking-wider">
                AI Processed
              </span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            <div className="w-72 border-r border-border overflow-y-auto p-3">
              {selectionMode && (
                <div className="px-3 py-2 mb-2">
                  <p className="text-xs text-muted-foreground">Select documents to include in your case</p>
                </div>
              )}
              {tree.map((node, i) => (
                <TreeItem key={i} node={node} onSelect={handleSelect} selectedFiles={selectedFiles} selectionMode={selectionMode} />
              ))}
            </div>

            <div className="flex-1 flex items-center justify-center p-8">
              {selectedFile ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto">
                    {getIcon(selectedFile.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatBytes(selectedFile.size)} · {selectedFile.type || "Document"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Document preview would be rendered here in the full implementation.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a file to preview</p>
              )}
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {selectionMode ? `${selectedFiles.size} of ${files.length} files selected` : `${files.length} files uploaded`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {selectionMode ? `Select ${selectedFiles.size} Documents` : "Confirm Documents"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FileExplorerModal;
