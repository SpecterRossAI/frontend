import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Lightbulb, ShieldAlert, MessageSquare, TrendingUp, ChevronRight } from "lucide-react";

interface Suggestion {
  id: number;
  type: "counter" | "precedent" | "objection" | "tactic" | "tone";
  text: string;
  confidence: number;
}

const mockSuggestions: Suggestion[] = [
  { id: 1, type: "counter", text: "Challenge opposing counsel's characterization of the timeline. The evidence shows a 48-hour gap that undermines their narrative.", confidence: 87 },
  { id: 2, type: "precedent", text: "Cite Miranda v. Arizona (1966) — procedural safeguards argument directly applicable here.", confidence: 92 },
  { id: 3, type: "objection", text: "Hearsay objection available. Witness testimony references out-of-court statements offered for truth.", confidence: 78 },
  { id: 4, type: "tactic", text: "Redirect the judge's attention to Exhibit B. The forensic evidence is your strongest anchor.", confidence: 85 },
  { id: 5, type: "tone", text: "Lower vocal intensity. The judge appears to respond better to measured, deliberate delivery.", confidence: 71 },
];

const typeConfig = {
  counter: { icon: MessageSquare, label: "Counterargument", color: "text-info" },
  precedent: { icon: Lightbulb, label: "Precedent", color: "text-primary" },
  objection: { icon: ShieldAlert, label: "Objection", color: "text-destructive" },
  tactic: { icon: TrendingUp, label: "Tactical", color: "text-success" },
  tone: { icon: ChevronRight, label: "Tone", color: "text-warning" },
};

const StrategyPanel = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [transcript] = useState<string[]>([
    "[Judge]: Please state your opening arguments.",
    "[Opposing]: Your Honor, the evidence clearly shows...",
  ]);

  useEffect(() => {
    const timers = mockSuggestions.map((s, i) =>
      setTimeout(() => setSuggestions((prev) => [...prev, s]), 800 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="h-full flex flex-col bg-card w-[380px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Strategy Assistant</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">Real-time insights and recommendations</p>
      </div>

      {/* Live Transcript */}
      <div className="px-5 py-3 border-b border-border">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Live Transcript</p>
        <div className="space-y-1.5 max-h-24 overflow-y-auto">
          {transcript.map((line, i) => (
            <p key={i} className="text-xs text-muted-foreground leading-relaxed">{line}</p>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Suggestions</p>
        <AnimatePresence>
          {suggestions.map((s) => {
            const config = typeConfig[s.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg bg-muted/50 border border-border p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{s.confidence}%</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">{s.text}</p>
                <button className="text-[11px] font-medium text-primary hover:underline transition-colors">
                  Use this argument →
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StrategyPanel;
