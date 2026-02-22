import { useState, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { BrainCircuit, Send, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface StrategyPanelProps {
  caseId?: string;
  messages?: { role: string; text: string }[];
  isTranscriptLive?: boolean;
  onUseSuggestion?: (text: string) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  pageRefs?: string[];
  mostRelevantPage?: string;
}

type ChunkWithMeta = {
  chunk_text?: string;
  source?: string;
  file_name?: string;
  score?: number;
  relevance_score?: number;
  metadata?: { source?: string; file_name?: string };
};

/** Check if chunk is from a PDF (by source/file_name metadata) */
function isPDFChunk(c: ChunkWithMeta): boolean {
  const sourceOrName =
    c.source ?? c.file_name ?? c.metadata?.source ?? c.metadata?.file_name ?? "";
  if (!sourceOrName) return true; // no metadata → assume PDF (backward compat)
  return /\.pdf$/i.test(String(sourceOrName));
}

/** Get relevance score for sorting (higher = more relevant). Handles score, relevance_score, or index fallback. */
function getChunkScore(c: ChunkWithMeta, index: number): number {
  const s = c.score ?? c.relevance_score;
  if (typeof s === "number") return s;
  return 1 - index * 0.001; // preserve API order: first chunk = most relevant
}

/** Extract page refs from chunk_text (e.g. "pg 5 of 29"), only from PDF chunks, sorted by relevance. Returns { refs, mostRelevant } */
function extractPageRefs(chunks: ChunkWithMeta[]): { refs: string[]; mostRelevant?: string } {
  const pdfChunks = chunks
    .filter(isPDFChunk)
    .map((c, i) => ({ chunk: c, score: getChunkScore(c, i) }))
    .sort((a, b) => b.score - a.score); // highest relevance first

  const seen = new Set<string>();
  const refs: string[] = [];
  let mostRelevant: string | undefined;
  const re = /pg\s*\n?\s*(\d+)\s+of\s+(\d+)/gi;

  for (const { chunk: c } of pdfChunks) {
    const text = c.chunk_text || "";
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const key = `${m[1]}-${m[2]}`;
      if (!seen.has(key)) {
        seen.add(key);
        const pageRef = `p. ${m[1]}`;
        refs.push(pageRef);
        if (!mostRelevant) mostRelevant = pageRef;
      }
    }
  }

  const sorted = refs.sort((a, b) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10));
  return { refs: sorted, mostRelevant: mostRelevant ?? sorted[0] };
}

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
};

const StrategyPanel = ({ caseId, messages = [], isTranscriptLive, onUseSuggestion }: StrategyPanelProps) => {
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
      const data = (await res.json().catch(() => ({}))) as {
        answer?: string;
        detail?: string;
        chunks_used?: ChunkWithMeta[];
      };
      if (!res.ok) {
        throw new Error(typeof data?.detail === "string" ? data.detail : "Query failed");
      }
      const answer = (data.answer || "").trim();
      const { refs: pageRefs, mostRelevant: mostRelevantPage } =
        data.chunks_used && data.chunks_used.length > 0
          ? extractPageRefs(data.chunks_used)
          : { refs: [], mostRelevant: undefined };
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: answer || "No answer found in the case documents.",
          pageRefs: pageRefs.length > 0 ? pageRefs : undefined,
          mostRelevantPage: mostRelevantPage ?? undefined,
        },
      ]);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Failed to get answer");
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't process your question. Please try again." }]);
    } finally {
      setIsLoading(false);
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="h-full flex flex-col bg-card/95 backdrop-blur-sm w-[340px] border-l border-border/80">
      {/* Section 1: Live Transcript */}
      <div className="shrink-0 border-b border-border/60">
        <div className="px-4 py-2 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Live Transcript</span>
          {isTranscriptLive && (
            <span className="flex items-center gap-1.5 text-[10px] text-success font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              Live
            </span>
          )}
        </div>
        <div className="px-4 py-2.5 max-h-28 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Transcript will appear as the trial proceeds.</p>
          ) : (
            <div className="space-y-1.5">
              {messages.map((m, i) => {
                const isDefence = (m.role || "").toLowerCase() === "user";
                return (
                  <div key={`t-${i}`} className="flex gap-2">
                    <span className="text-[10px] font-semibold text-primary uppercase shrink-0 w-16">
                      {isDefence ? "Defence" : "Opposition"}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 min-w-0">{m.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: AI Assistant */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 py-2.5 flex items-center border-b border-border bg-muted/10">
          <BrainCircuit className="w-3.5 h-3.5 text-primary mr-2" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">AI Assistant</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={`rounded-xl px-3 py-2 text-xs ${
                m.role === "user" ? "bg-primary/10 text-foreground border border-primary/10" : "bg-muted/30 text-foreground/90 border border-border/60"
              }`}
            >
              {m.role === "assistant" ? (
                <>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1">
                    <ReactMarkdown components={markdownComponents}>{m.text}</ReactMarkdown>
                  </div>
                  {m.pageRefs && m.pageRefs.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {m.mostRelevantPage ? (
                        <>
                          <span className="font-semibold text-primary">{m.mostRelevantPage}</span>
                          <span className="text-muted-foreground"> (most relevant)</span>
                          {m.pageRefs.length > 1 && (
                            <> · {m.pageRefs.filter((p) => p !== m.mostRelevantPage).join(", ")}</>
                          )}
                        </>
                      ) : (
                        <>Sources: {m.pageRefs.join(", ")}</>
                      )}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      onUseSuggestion?.(m.text);
                      navigator.clipboard?.writeText(m.text).then(() => toast.success("Copied"));
                    }}
                    className="mt-1.5 text-[10px] font-medium text-primary hover:underline"
                  >
                    Use →
                  </button>
                </>
              ) : (
                m.text
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              <span>Getting answer...</span>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>

        <div className="px-4 py-2.5 border-t border-border/60 bg-muted/5 shrink-0">
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
              placeholder="Ask about your case..."
              className="flex-1 px-3 py-2 rounded-xl border border-border/80 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
            <button
              onClick={handleSend}
              disabled={!chatInput.trim() || isLoading || !caseId}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyPanel;
