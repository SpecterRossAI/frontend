import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BrainCircuit, Send, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface StrategyPanelProps {
  caseId?: string;
  messages?: { role: string; text: string }[];
  onUseSuggestion?: (text: string) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const StrategyPanel = ({ caseId, messages = [], onUseSuggestion }: StrategyPanelProps) => {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    const query = chatInput.trim();
    if (!query || !caseId || !API_BASE) {
      if (!API_BASE) toast.error("API not configured");
      return;
    }
    setChatMessages((prev) => [...prev, { role: "user", text: query }]);
    setChatInput("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId, query }),
      });
      const data = (await res.json().catch(() => ({}))) as { answer?: string; detail?: string };
      if (!res.ok) {
        throw new Error(typeof data?.detail === "string" ? data.detail : "Query failed");
      }
      const answer = (data.answer || "").trim();
      setChatMessages((prev) => [...prev, { role: "assistant", text: answer || "No answer found in the case documents." }]);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Failed to get answer");
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't process your question. Please try again." }]);
    } finally {
      setIsLoading(false);
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const hasResponse = chatMessages.some((m) => m.role === "assistant");

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

      {/* Live Transcript - conversation from voice with Defence/Opposition headers */}
      <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex flex-col min-h-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Live Transcript</p>
        <div className="space-y-2 max-h-32 overflow-y-auto flex-1 min-h-0">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Conversation will appear here as the trial proceeds.</p>
          ) : (
            messages.map((m, i) => {
              const isDefence = (m.role || "").toLowerCase() === "user";
              const header = isDefence ? "Defence" : "Opposition";
              return (
                <div key={`t-${i}`} className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">{header}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="px-5 py-3.5 border-b border-border flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ask about your case</p>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-xs ${
                m.role === "user"
                  ? "bg-primary/10 text-foreground ml-4"
                  : "bg-muted/60 text-muted-foreground mr-4"
              }`}
            >
              <span className="font-medium">{m.role === "user" ? "You" : "Assistant"}:</span> {m.text}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Getting answer from case documents...
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question or type your argument..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
          <button
            onClick={handleSend}
            disabled={!chatInput.trim() || isLoading || !caseId}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggestions - from backend only */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Suggestions</p>
        {!hasResponse ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-xs text-muted-foreground">
              Ask a question above to get AI-powered suggestions based on your case documents and conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {chatMessages
              .filter((m) => m.role === "assistant" && m.text)
              .map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <button
                    onClick={() => {
                      onUseSuggestion?.(m.text);
                      navigator.clipboard?.writeText(m.text).then(() => {
                        toast.success("Copied to clipboard");
                      });
                    }}
                    className="mt-2 text-[11px] font-medium text-primary hover:underline transition-colors"
                  >
                    Use this →
                  </button>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyPanel;
