import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Lightbulb, ShieldAlert, MessageSquare, TrendingUp, ChevronRight, ChevronDown, FileText } from "lucide-react";

interface ReasoningStep {
  label: string;
  explanation: string;
}

interface ReasoningChain {
  steps: ReasoningStep[];
  sources: string[];
  confidenceJustification: string;
}

interface Suggestion {
  id: number;
  type: "counter" | "precedent" | "objection" | "tactic" | "tone";
  text: string;
  confidence: number;
  reasoning?: ReasoningChain;
}

const mockReasoning: Record<number, ReasoningChain> = {
  1: {
    steps: [
      { label: "Identified Weakness", explanation: "Opposing counsel's timeline narrative contains a 48-hour gap between the incident and the witness statement." },
      { label: "Cross-Referenced Evidence", explanation: "Exhibit C (security logs) and Exhibit D (phone records) contradict the claimed sequence of events." },
      { label: "Assessed Judicial Tendency", explanation: "This judge persona historically favors evidence-based timeline challenges over emotional appeals." },
    ],
    sources: ["Exhibit C — Security Logs", "Exhibit D — Phone Records", "Deposition p.12, lines 4–8"],
    confidenceJustification: "87% historical success rate for similar timeline challenges with this judge persona. Strong documentary support.",
  },
  2: {
    steps: [
      { label: "Precedent Match", explanation: "Miranda v. Arizona (1966) establishes procedural safeguards that directly apply to the custodial interrogation sequence." },
      { label: "Fact Alignment", explanation: "The defendant was not informed of rights until 34 minutes into the interview — aligns with Miranda violation pattern." },
      { label: "Judicial Reception", explanation: "This judge has cited Miranda favorably in 73% of similar motions over the past 5 years." },
    ],
    sources: ["Miranda v. Arizona, 384 U.S. 436 (1966)", "Complaint.pdf — Custodial Timeline", "Witness1_Deposition.txt"],
    confidenceJustification: "92% confidence based on direct precedent match and strong fact alignment. High judicial reception in similar cases.",
  },
  3: {
    steps: [
      { label: "Hearsay Detection", explanation: "Witness is relaying statements made by a third party outside the courtroom, offered for the truth of the matter asserted." },
      { label: "Exception Check", explanation: "No applicable exception (excited utterance, business record, etc.) identified in the testimony." },
      { label: "Timing", explanation: "Objection should be raised immediately — judge persona responds better to timely objections." },
    ],
    sources: ["Federal Rules of Evidence 801–803", "Live Transcript — Opposing counsel's question"],
    confidenceJustification: "78% — Strong hearsay basis but judge has occasionally allowed similar testimony under residual exception. Timely objection improves odds.",
  },
  4: {
    steps: [
      { label: "Evidence Hierarchy", explanation: "Exhibit B (forensic report) carries more weight with this judge than witness testimony on technical matters." },
      { label: "Attention Redirect", explanation: "Opposing counsel has held the floor for 4 minutes — strategic moment to shift focus." },
      { label: "Anchor Effect", explanation: "Leading with strongest evidence first increases likelihood it frames the judge's subsequent evaluation." },
    ],
    sources: ["Exhibit B — Forensic Report", "StrategyPanel — Floor time analysis"],
    confidenceJustification: "85% — Forensic evidence is your strongest anchor. Redirect timing is optimal based on current exchange pattern.",
  },
  5: {
    steps: [
      { label: "Vocal Analysis", explanation: "Judge has shown subtle disengagement (pauses, shorter responses) during the last two high-intensity exchanges." },
      { label: "Calibration", explanation: "Measured, deliberate delivery has yielded 23% longer engagement in similar scenarios with this persona." },
      { label: "Contrast", explanation: "Lower intensity will create contrast with opposing counsel's current approach, potentially favoring your position." },
    ],
    sources: ["Session analytics — Engagement metrics", "Judge persona profile"],
    confidenceJustification: "71% — Tone adjustments are context-dependent. Recommend monitoring judge's nonverbal cues for real-time calibration.",
  },
};

const mockSuggestions: Suggestion[] = [
  { id: 1, type: "counter", text: "Challenge opposing counsel's characterization of the timeline. The evidence shows a 48-hour gap that undermines their narrative.", confidence: 87, reasoning: mockReasoning[1] },
  { id: 2, type: "precedent", text: "Cite Miranda v. Arizona (1966) — procedural safeguards argument directly applicable here.", confidence: 92, reasoning: mockReasoning[2] },
  { id: 3, type: "objection", text: "Hearsay objection available. Witness testimony references out-of-court statements offered for truth.", confidence: 78, reasoning: mockReasoning[3] },
  { id: 4, type: "tactic", text: "Redirect the judge's attention to Exhibit B. The forensic evidence is your strongest anchor.", confidence: 85, reasoning: mockReasoning[4] },
  { id: 5, type: "tone", text: "Lower vocal intensity. The judge appears to respond better to measured, deliberate delivery.", confidence: 71, reasoning: mockReasoning[5] },
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Strategy Assistant</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Real-time insights with reasoning transparency</p>
          </div>
        </div>
      </div>

      {/* Live Transcript */}
      <div className="px-5 py-3.5 border-b border-border bg-muted/20">
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
            const isExpanded = expandedId === s.id;
            const hasReasoning = s.reasoning && s.reasoning.steps.length > 0;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl border border-border bg-muted/30 hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${s.confidence}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-8">{s.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">{s.text}</p>
                  {hasReasoning && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                          Hide reasoning
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          Show reasoning
                        </>
                      )}
                    </button>
                  )}
                  <button className="text-[11px] font-medium text-primary hover:underline transition-colors">
                    Use this argument →
                  </button>
                </div>

                {/* AI Reasoning Transparency — expandable */}
                <AnimatePresence>
                  {isExpanded && s.reasoning && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border bg-surface overflow-hidden"
                    >
                      <div className="px-4 py-3 space-y-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Reasoning
                        </p>
                        <ol className="space-y-2 text-xs">
                          {s.reasoning.steps.map((step, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="shrink-0 w-5 h-5 rounded-md bg-primary/10 text-primary font-mono text-[10px] flex items-center justify-center">
                                {i + 1}
                              </span>
                              <div>
                                <span className="font-semibold text-foreground">{step.label}:</span>{" "}
                                <span className="text-muted-foreground">{step.explanation}</span>
                              </div>
                            </li>
                          ))}
                        </ol>
                        {s.reasoning.sources.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                              Sources
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {s.reasoning.sources.map((src, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/80 text-[11px] text-muted-foreground"
                                >
                                  <FileText className="w-3 h-3" />
                                  {src}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="pt-2 border-t border-border/80">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                            Confidence
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {s.reasoning.confidenceJustification}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StrategyPanel;
