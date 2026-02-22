import { motion, AnimatePresence } from "framer-motion";
import { Gavel, X, Check, Scale } from "lucide-react";
import { useState } from "react";

interface JudgementModalProps {
  open: boolean;
  onClose: () => void;
  onJudgementAdded?: (text: string) => void;
}

const judgementOptions = [
  { value: "sustained", label: "Sustained", description: "Objection upheld", color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  { value: "overruled", label: "Overruled", description: "Objection denied", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  { value: "reserved", label: "Reserved", description: "Ruling deferred", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/30" },
];

const JudgementModal = ({ open, onClose, onJudgementAdded }: JudgementModalProps) => {
  const [customText, setCustomText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const finishSubmit = (text: string) => {
    onJudgementAdded?.(text);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCustomText("");
      onClose();
    }, 1500);
  };

  const handleSubmit = (text: string) => () => finishSubmit(text);

  const handleCustomSubmit = () => {
    if (customText.trim()) finishSubmit(customText.trim());
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-br from-muted/50 to-muted/20 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <div>
                <h3 className="text-lg font-semibold text-foreground">Get Judgement</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Record the judge's ruling from the proceeding
                </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!submitted ? (
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Standard rulings</p>
                <div className="grid gap-3">
                  {judgementOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleSubmit(opt.label)}
                      className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 ${opt.bg} ${opt.border} hover:shadow-md transition-all text-left group`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${opt.bg} flex items-center justify-center`}>
                          <Gavel className={`w-5 h-5 ${opt.color}`} />
                        </div>
                        <div>
                          <span className={`text-base font-semibold block ${opt.color}`}>{opt.label}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </div>
                      <span className="w-9 h-9 rounded-lg bg-background/60 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                        <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Custom ruling</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="e.g., Motion granted with conditions..."
                    className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                  />
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customText.trim()}
                    className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 px-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-success/15 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="text-xl font-semibold text-foreground">Judgement recorded</p>
              <p className="text-sm text-muted-foreground mt-2">The ruling has been added to the court record.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JudgementModal;
