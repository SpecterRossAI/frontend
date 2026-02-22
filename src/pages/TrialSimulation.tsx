import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Mic, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useConversation, type Callbacks } from "@elevenlabs/react";
import VideoGrid from "@/components/simulation/VideoGrid";
import ControlBar from "@/components/simulation/ControlBar";
import StrategyPanel from "@/components/simulation/StrategyPanel";
import ObjectionModal from "@/components/simulation/ObjectionModal";
import JudgementModal from "@/components/simulation/JudgementModal";
import DocumentViewerPane from "@/components/simulation/DocumentViewerPane";
import CaseDocumentsDashboard from "@/components/trial/CaseDocumentsDashboard";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useNavigate, useLocation } from "react-router-dom";
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
  judgements: JudgementEntry[];
  setJudgementModalOpen: (v: boolean) => void;
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
  judgements,
  setJudgementModalOpen,
  setObjectionOpen,
  navigate,
  isSpeaking,
}: SimulationContentProps) {
  return (
    <div className="h-full flex flex-col min-w-0 bg-muted/30 relative">
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <VideoGrid
          captionsOn={captionsOn}
          isAgentSpeaking={isSpeaking}
          agentCaption={messages.filter((m) => m.role !== "user").pop()?.text}
          judgements={judgements}
          onAddJudgement={() => setJudgementModalOpen(true)}
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
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [objectionOpen, setObjectionOpen] = useState(false);
  const [judgementModalOpen, setJudgementModalOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [docSidebarOpen, setDocSidebarOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const handlePreviewFile = (file: UploadedFile | null) => {
    setPreviewFile(file);
    if (file) {
      setDocSidebarOpen(false);
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar - dashboard style */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-slate-800 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-white font-display">SpecterRoss<span className="text-primary-foreground/90">AI</span></span>
          </div>
          <span className="text-xs text-slate-300 font-medium">· Mock Trial in Session</span>
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-600">
            <span className="flex items-center gap-1.5 text-xs text-slate-300">
              <Users className="w-3.5 h-3.5" />
              2 participants
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-300">
              <Mic className="w-3.5 h-3.5" />
              Voice active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {voiceError && (
            <span className="text-xs text-red-400" title={voiceError}>
              Voice: {voiceError}
            </span>
          )}
          {!voiceError && (
            <span className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${voiceStatus === "connected" ? "bg-success animate-pulse" : "bg-slate-500"}`} />
              {voiceStep === "fetching" && "Connecting…"}
              {voiceStep === "connecting" && "Connecting…"}
              {voiceStep === "connected" && "Live"}
              {voiceStep === "idle" && voiceStatus}
            </span>
          )}
          <span className="text-xs font-medium text-slate-300 font-mono tabular-nums px-2 py-1 rounded-md bg-slate-700/50">00:12:34</span>
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
                judgements={judgements}
                setJudgementModalOpen={setJudgementModalOpen}
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
              judgements={judgements}
              setJudgementModalOpen={setJudgementModalOpen}
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
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-l border-border overflow-hidden"
            >
              <StrategyPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ObjectionModal open={objectionOpen} onClose={() => setObjectionOpen(false)} />
      <JudgementModal
        open={judgementModalOpen}
        onClose={() => setJudgementModalOpen(false)}
        onJudgementAdded={(text) =>
          setJudgements((prev) => [
            ...prev,
            { id: `j-${++judgementIdRef.current}`, text, timestamp: Date.now() },
          ])
        }
      />
    </div>
  );
};

const LatencyBadge = () => {
  const latency = 45;
  const color = latency < 100 ? "bg-success" : latency < 250 ? "bg-amber-500" : "bg-red-500";
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 px-2.5 py-1 rounded-lg bg-slate-700/50 border border-slate-600 tabular-nums">
      <span className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse`} />
      {latency}ms
    </span>
  );
};

export default TrialSimulation;
