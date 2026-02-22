import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale } from "lucide-react";
import { useConversation, type Callbacks } from "@elevenlabs/react";
import VideoGrid from "@/components/simulation/VideoGrid";
import ControlBar from "@/components/simulation/ControlBar";
import StrategyPanel from "@/components/simulation/StrategyPanel";
import ObjectionModal from "@/components/simulation/ObjectionModal";
import DocumentSidebar from "@/components/trial/DocumentSidebar";
import { useNavigate } from "react-router-dom";
import type { UploadedFile } from "@/types/files";

const API_BASE = import.meta.env.VITE_API_URL || "";
const CONVERSATION_API_BASE = import.meta.env.VITE_CONVERSATION_API_URL || "";

type MessagePayload = Parameters<NonNullable<Callbacks["onMessage"]>>[0];
type MessageEntry = { role: string; text: string };

async function pushNewMessages(
  base: string,
  messages: MessageEntry[],
  fromIndex: number
): Promise<void> {
  const slice = messages.slice(fromIndex);
  if (slice.length === 0) return;
  const res = await fetch(`${base}/api/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: slice }),
  });
  if (!res.ok) throw new Error("Failed to push conversation");
}

async function clearConversationOnServer(base: string): Promise<void> {
  await fetch(`${base}/api/conversation/clear`, { method: "POST" });
}

// Mock files for simulation (in a real app, these come from route state or context)
const mockFiles: UploadedFile[] = [
  { name: "Complaint.pdf", size: 245000, type: "application/pdf", path: "Complaint.pdf" },
  { name: "Exhibit_A.pdf", size: 128000, type: "application/pdf", path: "Evidence/Exhibit_A.pdf" },
  { name: "Exhibit_B.png", size: 340000, type: "image/png", path: "Evidence/Exhibit_B.png" },
  { name: "Witness1_Deposition.txt", size: 52000, type: "text/plain", path: "Depositions/Witness1_Deposition.txt" },
  { name: "Motion_to_Dismiss.pdf", size: 189000, type: "application/pdf", path: "Motion_to_Dismiss.pdf" },
];

const TrialSimulation = () => {
  const navigate = useNavigate();
  const [strategyOpen, setStrategyOpen] = useState(true);
  const [objectionOpen, setObjectionOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [docSidebarOpen, setDocSidebarOpen] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStep, setVoiceStep] = useState<"idle" | "fetching" | "connecting" | "connected" | "error">("idle");
  const [signedUrlReceived, setSignedUrlReceived] = useState(false);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const lastSentIndexRef = useRef(0);

  const { startSession, endSession, status: voiceStatus } = useConversation({
    onMessage: (msg: MessagePayload) => {
      const extra = msg as MessagePayload & Record<string, unknown>;
      const text =
        msg?.message ??
        (extra?.user_transcript as string | undefined) ??
        (extra?.agent_response as string | undefined) ??
        JSON.stringify(msg);
      if (text)
        setMessages((prev) => [
          ...prev,
          { role: msg?.role ?? "unknown", text },
        ]);
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
    pushNewMessages(CONVERSATION_API_BASE, messages, last).then(() => {
      lastSentIndexRef.current = n;
    }).catch(() => {});
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = API_BASE ? `${API_BASE}/signed-url` : "/signed-url";
      setVoiceStep("fetching");
      console.log("[Voice] Requesting signed URL:", url);
      try {
        await clearConversationOnServer(CONVERSATION_API_BASE);
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
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary/5 border border-primary/10 flex items-center justify-center">
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>SpecterRoss<span className="text-primary">AI</span></span>
          <span className="text-xs text-muted-foreground">· Mock Trial in Session</span>
        </div>
        <div className="flex items-center gap-3">
          {voiceError && (
            <span className="text-xs text-destructive" title={voiceError}>
              Voice: {voiceError}
            </span>
          )}
          {!voiceError && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${voiceStatus === "connected" ? "bg-success animate-pulse" : "bg-muted"}`} />
              {voiceStep === "fetching" && "Fetching signed URL…"}
              {voiceStep === "connecting" && (signedUrlReceived ? "Signed URL received, connecting…" : "Connecting…")}
              {voiceStep === "connected" && "Voice live"}
              {voiceStep === "idle" && voiceStatus}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">00:12:34</span>
          <LatencyBadge />
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document sidebar */}
        <AnimatePresence>
          {docSidebarOpen && (
            <DocumentSidebar
              files={mockFiles}
              open={docSidebarOpen}
              onToggle={() => setDocSidebarOpen(!docSidebarOpen)}
            />
          )}
        </AnimatePresence>
        {!docSidebarOpen && (
          <DocumentSidebar
            files={mockFiles}
            open={false}
            onToggle={() => setDocSidebarOpen(true)}
          />
        )}

        {/* Center: video + controls */}
        <div className="flex-1 flex flex-col min-w-0">
          <VideoGrid captionsOn={captionsOn} />
          <ControlBar
            onToggleStrategy={() => setStrategyOpen(!strategyOpen)}
            onObjection={() => setObjectionOpen(true)}
            onCaptions={() => setCaptionsOn(!captionsOn)}
            captionsOn={captionsOn}
            onEnd={() => navigate("/")}
          />
        </div>

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
    </div>
  );
};

const LatencyBadge = () => {
  const latency = 45;
  const color = latency < 100 ? "bg-success" : latency < 250 ? "bg-warning" : "bg-destructive";
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted border border-border">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {latency}ms
    </span>
  );
};

export default TrialSimulation;
