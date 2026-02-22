import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, FileDown, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useConversation, type Callbacks } from "@elevenlabs/react";
import { useLiveTranscription } from "@/hooks/useLiveTranscription";
import VideoGrid from "@/components/simulation/VideoGrid";
import ControlBar from "@/components/simulation/ControlBar";
import StrategyPanel from "@/components/simulation/StrategyPanel";
import ObjectionModal from "@/components/simulation/ObjectionModal";
import JudgementModal from "@/components/simulation/JudgementModal";
import JudgementDisplayModal from "@/components/simulation/JudgementDisplayModal";
import DocumentViewerPane from "@/components/simulation/DocumentViewerPane";
import CaseDocumentsDashboard from "@/components/trial/CaseDocumentsDashboard";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { UploadedFile } from "@/types/files";
import type { JudgementEntry } from "@/types/simulation";

const API_BASE = import.meta.env.VITE_API_URL || "";
const CONVERSATION_API_BASE = import.meta.env.VITE_CONVERSATION_API_URL || "";

type MessagePayload = Parameters<NonNullable<Callbacks["onMessage"]>>[0];
type MessageEntry = { role: string; text: string };

async function pushNewMessages(
  base: string,
  caseId: string,
  messages: MessageEntry[],
  fromIndex: number
): Promise<void> {
  const slice = messages.slice(fromIndex);
  if (slice.length === 0) return;
  const res = await fetch(`${base}/api/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ case_id: caseId, messages: slice }),
  });
  if (!res.ok) throw new Error("Failed to push conversation");
}

async function clearConversationOnServer(base: string, caseId: string): Promise<void> {
  await fetch(`${base}/api/conversation/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ case_id: caseId }),
  });
}

function aggregateDefencePlaintiff(messages: MessageEntry[]): { defence: string; plaintiff: string } {
  const defence = messages
    .filter((m) => (m.role || "").toLowerCase() === "user")
    .map((m) => m.text.trim())
    .filter(Boolean)
    .join(" ");
  const plaintiff = messages
    .filter((m) => (m.role || "").toLowerCase() !== "user")
    .map((m) => m.text.trim())
    .filter(Boolean)
    .join(" ");
  return { defence, plaintiff };
}

async function uploadConversationToBackend(
  base: string,
  caseId: string,
  threadId: string,
  defence: string,
  plaintiff: string
): Promise<void> {
  if (!defence.trim() && !plaintiff.trim()) return;
  const res = await fetch(`${base}/conversation-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      case_id: caseId,
      thread_id: threadId,
      Defence: defence,
      Plaintiff: plaintiff,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err?.detail === "string" ? err.detail : "Failed to upload conversation");
  }
}

const mockFiles: UploadedFile[] = [
  { name: "Complaint.pdf", size: 245000, type: "application/pdf", path: "Complaint.pdf" },
  { name: "Exhibit_A.pdf", size: 128000, type: "application/pdf", path: "Evidence/Exhibit_A.pdf" },
  { name: "Exhibit_B.png", size: 340000, type: "image/png", path: "Evidence/Exhibit_B.png" },
  { name: "Witness1_Deposition.txt", size: 52000, type: "text/plain", path: "Depositions/Witness1_Deposition.txt" },
  { name: "Motion_to_Dismiss.pdf", size: 189000, type: "application/pdf", path: "Motion_to_Dismiss.pdf" },
];

/** Generate a stable unique case ID for this simulation session (all documents and conversation are linked to it). */
function useCaseId(): string {
  const [caseId] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  return caseId;
}

interface SimulationContentProps {
  captionsOn: boolean;
  setCaptionsOn: (v: boolean) => void;
  strategyOpen: boolean;
  setStrategyOpen: (v: boolean) => void;
  messages: MessageEntry[];
  setObjectionOpen: (v: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
  isSpeaking: boolean;
}

function SimulationContent({
  captionsOn,
  setCaptionsOn,
  strategyOpen,
  setStrategyOpen,
  messages,
  setObjectionOpen,
  navigate,
  isSpeaking,
}: SimulationContentProps) {
  return (
    <div className="h-full flex flex-col min-w-0 bg-muted/30 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <VideoGrid
          captionsOn={captionsOn}
          isAgentSpeaking={isSpeaking}
          agentCaption={messages.filter((m) => m.role !== "user").pop()?.text}
        />
      </div>
      <ControlBar
        onToggleStrategy={() => setStrategyOpen(!strategyOpen)}
        onObjection={() => setObjectionOpen(true)}
        onCaptions={() => setCaptionsOn(!captionsOn)}
        captionsOn={captionsOn}
        onEnd={() => navigate("/")}
      />
    </div>
  );
}

const TrialSimulation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { files?: UploadedFile[]; caseId?: string } | null) ?? {};
  const defaultCaseId = useCaseId();
  const caseId = state.caseId ?? defaultCaseId;
  const files = state.files ?? mockFiles;
  const [strategyOpen, setStrategyOpen] = useState(true);
  const [objectionOpen, setObjectionOpen] = useState(false);
  const [judgementModalOpen, setJudgementModalOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [docSidebarOpen, setDocSidebarOpen] = useState(true);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const handlePreviewFile = (file: UploadedFile | null) => {
    setPreviewFile(file);
    if (file) {
      setStrategyOpen(false);
    }
  };
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStep, setVoiceStep] = useState<"idle" | "fetching" | "connecting" | "connected" | "error">("idle");
  const [signedUrlReceived, setSignedUrlReceived] = useState(false);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [judgements, setJudgements] = useState<JudgementEntry[]>([]);
  const lastSentIndexRef = useRef(0);
  const judgementIdRef = useRef(0);
  const lastUserContextRef = useRef<string | undefined>();
  const threadIdRef = useRef(0);
  const lastUploadedIndexRef = useRef(0);
  const judgeOpeningAddedRef = useRef(false);

  // Judge opening: who is present (from case files) + start
  useEffect(() => {
    if (judgeOpeningAddedRef.current) return;
    judgeOpeningAddedRef.current = true;
    const docList = files.length > 5
      ? `${files.slice(0, 5).map((f) => f.name).join(", ")} and ${files.length - 5} more`
      : files.map((f) => f.name).join(", ") || "—";
    const opening: JudgementEntry = {
      id: "j-opening",
      text: `Present: Defense Counsel, Opposing Counsel. Documents before the court: ${docList}. Court is now in session.`,
      timestamp: Date.now(),
      stage: "opening",
    };
    const start: JudgementEntry = {
      id: "j-start",
      text: "You may begin.",
      timestamp: Date.now() + 100,
      stage: "start",
    };
    setJudgements((prev) => [opening, start, ...prev]);
  }, [files]);

  const { messages: transcriptMessages, isConnected: transcriptLive } = useLiveTranscription({
    caseId,
    wsBaseUrl: CONVERSATION_API_BASE || undefined,
    fallbackMessages: messages,
  });

  const { startSession, endSession, status: voiceStatus, isSpeaking } = useConversation({
    onMessage: (msg: MessagePayload) => {
      const extra = msg as MessagePayload & Record<string, unknown>;
      const role = (msg?.role ?? extra?.role as string) ?? "unknown";

      // Judge is always the agent — judgements come from agent_response, ruling field, or role "judge"
      const agentText = msg?.message ?? (extra?.agent_response as string | undefined);
      const rulingText =
        (extra?.ruling as string | undefined) ??
        (extra?.judgement as string | undefined) ??
        (role === "judge" ? agentText : undefined) ??
        // Agent (judge) rulings: agent response starts with Sustained/Overruled/Reserved
        (agentText && /^(Sustained|Overruled|Reserved)/i.test(agentText) ? agentText : undefined);

      if (rulingText) {
        setJudgements((prev) => [
          ...prev,
          {
            id: `j-${++judgementIdRef.current}`,
            text: rulingText,
            context: lastUserContextRef.current,
            timestamp: Date.now(),
            stage: "ruling",
          },
        ]);
      }

      const text =
        msg?.message ??
        (extra?.user_transcript as string | undefined) ??
        (extra?.agent_response as string | undefined) ??
        JSON.stringify(msg);
      if (text) {
        if (role === "user") lastUserContextRef.current = text;
        setMessages((prev) => [
          ...prev,
          { role, text },
        ]);
      }
    },
    onError: (err: { message?: string }) => {
      setVoiceError(err?.message ?? "Error");
      setVoiceStep("error");
    },
    onConnect: () => {
      setVoiceError(null);
      setVoiceStep("connected");
    },
  });

  useEffect(() => {
    const n = messages.length;
    const last = lastSentIndexRef.current;
    if (n <= last) return;
    pushNewMessages(CONVERSATION_API_BASE, caseId, messages, last).then(() => {
      lastSentIndexRef.current = n;
    }).catch(() => {});
  }, [messages, caseId]);

  // Periodic upload to Python backend for RAG (judgement + inline query) — only when new messages
  useEffect(() => {
    if (!API_BASE) return;
    const interval = setInterval(() => {
      if (messages.length <= lastUploadedIndexRef.current) return;
      const { defence, plaintiff } = aggregateDefencePlaintiff(messages);
      if (!defence.trim() && !plaintiff.trim()) return;
      const threadId = String(++threadIdRef.current);
      uploadConversationToBackend(API_BASE, caseId, threadId, defence, plaintiff)
        .then(() => {
          lastUploadedIndexRef.current = messages.length;
        })
        .catch((e) => console.warn("[Conversation] Upload failed:", e));
    }, 30000);
    return () => clearInterval(interval);
  }, [messages, caseId]);

  const [judgementPdfLoading, setJudgementPdfLoading] = useState(false);
  const [judgementDisplayOpen, setJudgementDisplayOpen] = useState(false);
  const [judgementText, setJudgementText] = useState("");

  const handleGetJudgement = async () => {
    if (API_BASE) {
      const { defence, plaintiff } = aggregateDefencePlaintiff(messages);
      if (defence.trim() || plaintiff.trim()) {
        const threadId = String(++threadIdRef.current);
        uploadConversationToBackend(API_BASE, caseId, threadId, defence, plaintiff).catch((e) =>
          console.warn("[Conversation] Pre-judgement upload failed:", e)
        );
      }
    }
    if (!API_BASE) {
      toast.error("API not configured. Cannot fetch judgement.");
      return;
    }
    setJudgementPdfLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/cases/${encodeURIComponent(caseId)}/judgement`,
        { method: "POST" }
      );
      if (!res.ok) {
        toast.error(res.status === 404 ? "Judgement not yet available." : "Failed to fetch judgement.");
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener");
        const a = document.createElement("a");
        a.href = url;
        a.download = `judgement-${caseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        const raw = await res.text();
        let text = "";
        if (contentType.includes("application/json")) {
          try {
            const data = JSON.parse(raw);
            const nested = data?.judgement;
            text =
              (typeof data?.text === "string" && data.text) ??
              (typeof data?.judgement === "string" && data.judgement) ??
              (typeof data?.content === "string" && data.content) ??
              (typeof data?.result === "string" && data.result) ??
              (typeof data?.output === "string" && data.output) ??
              (typeof data?.judgement_text === "string" && data.judgement_text) ??
              (typeof data?.generated_text === "string" && data.generated_text) ??
              (typeof nested === "object" && typeof nested?.text === "string" && nested.text) ??
              (typeof data === "string" && data) ??
              (() => {
                for (const v of Object.values(data || {})) {
                  if (typeof v === "string" && v.length > 20) return v;
                }
                return raw;
              })();
          } catch {
            text = raw;
          }
        } else {
          text = raw;
        }
        setJudgementText((text || "").trim() || "No judgement text returned.");
        setJudgementDisplayOpen(true);
      }
    } catch {
      toast.error("Failed to fetch judgement.");
    } finally {
      setJudgementPdfLoading(false);
    }
  };

  const handleDownloadJudgementPdf = async () => {
    if (!API_BASE) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/cases/${encodeURIComponent(caseId)}/judgement?format=pdf`,
        { method: "POST" }
      );
      if (!res.ok) {
        toast.error("PDF generation failed. The text judgement is still available above.");
        return;
      }
      const blob = await res.blob();
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("pdf")) {
        toast.error("Response is not a PDF.");
        return;
      }
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      const a = document.createElement("a");
      a.href = url;
      a.download = `judgement-${caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF download failed. The text judgement is still available above.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = API_BASE ? `${API_BASE}/signed-url` : "/signed-url";
      setVoiceStep("fetching");
      console.log("[Voice] Requesting signed URL:", url);
      try {
        await clearConversationOnServer(CONVERSATION_API_BASE, caseId);
      } catch {
        // ignore
      }
      if (cancelled) return;
      try {
        const res = await fetch(url);
        const data = (await res.json().catch(() => ({}))) as {
          signed_url?: string;
          detail?: string;
        };
        console.log("[Voice] Signed URL response:", { ok: res.ok, status: res.status, hasSignedUrl: Boolean(data?.signed_url) });
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            typeof data?.detail === "string" ? data.detail : "Failed to get signed URL";
          throw new Error(msg);
        }
        const signedUrl = data.signed_url;
        if (!signedUrl) {
          console.warn("[Voice] Response OK but no signed_url in body:", data);
          throw new Error("No signed URL in response");
        }
        setSignedUrlReceived(true);
        setVoiceStep("connecting");
        await startSession({ signedUrl, connectionType: "websocket" });
      } catch (e) {
        if (!cancelled) {
          setVoiceError((e as Error)?.message ?? "Failed to connect");
          setVoiceStep("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      endSession();
    };
  // Run once on mount; startSession/endSession would otherwise change every render and cause repeated fetches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col overflow-hidden">
      {/* Sleek header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-card/80 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
            <Scale className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground tracking-tight">SpecterRoss</span>
            <span className="text-sm font-bold text-primary ml-0.5">AI</span>
            <span className="text-[10px] text-muted-foreground ml-2 font-medium uppercase tracking-wider">Trial</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGetJudgement}
            disabled={judgementPdfLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            {judgementPdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Download Judgement PDF
          </button>
          {voiceError ? (
            <span className="text-xs text-destructive font-medium" title={voiceError}>Voice error</span>
          ) : (
            <span className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${voiceStatus === "connected" ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/60"}`} />
              <span className="text-muted-foreground font-medium">
                {voiceStep === "connected" ? "Live" : voiceStep === "idle" ? voiceStatus : "Connecting…"}
              </span>
            </span>
          )}
          <ThemeToggle variant="header" />
          <LatencyBadge />
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Case Documents Dashboard */}
        <AnimatePresence>
          {docSidebarOpen && (
            <CaseDocumentsDashboard
              files={files}
              caseId={caseId}
              open={docSidebarOpen}
              onToggle={() => setDocSidebarOpen(!docSidebarOpen)}
              isProcessed
              previewMode="split"
              previewFile={previewFile}
              onPreviewFile={handlePreviewFile}
            />
          )}
        </AnimatePresence>
        {!docSidebarOpen && (
          <CaseDocumentsDashboard
            files={files}
            caseId={caseId}
            open={false}
            onToggle={() => setDocSidebarOpen(true)}
            isProcessed
            previewMode="split"
            previewFile={previewFile}
            onPreviewFile={handlePreviewFile}
          />
        )}

        {/* Document viewer (left, only when a file is selected) + Simulation */}
        {previewFile ? (
          <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
            <ResizablePanel defaultSize={50} minSize={28} maxSize={70} className="min-w-0">
              <DocumentViewerPane
                file={previewFile}
                caseId={caseId}
                onClose={() => setPreviewFile(null)}
              />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border hover:bg-muted-foreground/20 data-[resize-handle-active]:bg-primary/30 transition-colors" />
            <ResizablePanel defaultSize={50} minSize={30} className="min-w-0">
              <SimulationContent
                captionsOn={captionsOn}
                setCaptionsOn={setCaptionsOn}
                strategyOpen={strategyOpen}
                setStrategyOpen={setStrategyOpen}
                messages={messages}
                setObjectionOpen={setObjectionOpen}
                navigate={navigate}
                isSpeaking={isSpeaking}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex-1 min-w-0">
            <SimulationContent
              captionsOn={captionsOn}
              setCaptionsOn={setCaptionsOn}
              strategyOpen={strategyOpen}
              setStrategyOpen={setStrategyOpen}
              messages={messages}
              setObjectionOpen={setObjectionOpen}
              navigate={navigate}
              isSpeaking={isSpeaking}
            />
          </div>
        )}

        {/* Strategy panel */}
        <AnimatePresence>
          {strategyOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <StrategyPanel
              caseId={caseId}
              messages={transcriptMessages}
              isTranscriptLive={transcriptLive}
              onUseSuggestion={(text) => {
                navigator.clipboard?.writeText(text);
              }}
            />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ObjectionModal open={objectionOpen} onClose={() => setObjectionOpen(false)} />
      <JudgementDisplayModal
        open={judgementDisplayOpen}
        onClose={() => setJudgementDisplayOpen(false)}
        text={judgementText}
        caseId={caseId}
        onDownloadPdf={handleDownloadJudgementPdf}
      />
      <JudgementModal
        open={judgementModalOpen}
        onClose={() => setJudgementModalOpen(false)}
        onJudgementAdded={(text) =>
          setJudgements((prev) => [
            ...prev,
            { id: `j-${++judgementIdRef.current}`, text, timestamp: Date.now(), stage: "ruling" },
          ])
        }
      />
    </div>
  );
};

const LatencyBadge = () => {
  const latency = 45;
  const color = latency < 100 ? "bg-success" : latency < 250 ? "bg-amber-500" : "bg-destructive";
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50 tabular-nums">
      <span className={`w-1 h-1 rounded-full ${color}`} />
      {latency}ms
    </span>
  );
};

export default TrialSimulation;
