import { motion, AnimatePresence } from "framer-motion";
import { Scale, X, FileDown, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface JudgementDisplayModalProps {
  open: boolean;
  onClose: () => void;
  text: string;
  caseId: string;
  onDownloadPdf?: () => Promise<void>;
}

const JudgementDisplayModal = ({
  open,
  onClose,
  text,
  caseId,
  onDownloadPdf,
}: JudgementDisplayModalProps) => {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text).then(() => toast.success("Copied to clipboard"));
  };

  const handleDownloadPdf = async () => {
    if (!onDownloadPdf) return;
    setPdfLoading(true);
    try {
      await onDownloadPdf();
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Court Judgement</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Case {caseId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 min-h-[200px] overflow-y-auto px-6 py-5">
            <div className="text-foreground leading-relaxed text-sm">
              <p className="whitespace-pre-wrap">{text || "No judgement text available."}</p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="shrink-0 px-6 py-4 border-t border-border bg-muted/30 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            {onDownloadPdf && (
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {pdfLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                {pdfLoading ? "Generating..." : "Download PDF"}
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-auto px-4 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JudgementDisplayModal;
