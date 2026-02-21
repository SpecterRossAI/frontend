import { motion, AnimatePresence } from "framer-motion";
import { Gavel, X } from "lucide-react";
import { useState } from "react";

interface ObjectionModalProps {
  open: boolean;
  onClose: () => void;
}

const objectionTypes = [
  "Hearsay",
  "Relevance",
  "Leading Question",
  "Speculation",
  "Foundation",
  "Argumentative",
  "Asked and Answered",
  "Compound Question",
];

const ObjectionModal = ({ open, onClose }: ObjectionModalProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [ruling, setRuling] = useState<string | null>(null);

  const handleObjection = (type: string) => {
    setSelected(type);
    setTimeout(() => {
      const sustained = Math.random() > 0.4;
      setRuling(sustained ? "Sustained" : "Overruled");
    }, 1200);
  };

  const handleClose = () => {
    setSelected(null);
    setRuling(null);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="surface-modal p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">State Your Objection</h3>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {!selected ? (
            <div className="grid grid-cols-2 gap-2">
              {objectionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleObjection(type)}
                  className="px-4 py-3 rounded-lg bg-muted border border-border text-sm text-foreground hover:border-destructive/30 hover:bg-destructive/5 transition-colors text-left"
                >
                  {type}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-muted-foreground">
                Objection: <span className="text-foreground font-medium">{selected}</span>
              </p>
              {ruling ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <p className={`text-2xl font-bold ${ruling === "Sustained" ? "text-success" : "text-destructive"}`}>
                    {ruling}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">The judge has ruled on your objection.</p>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                  <p className="text-sm text-muted-foreground">Judge is considering...</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ObjectionModal;
