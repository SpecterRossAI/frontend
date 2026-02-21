import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale } from "lucide-react";
import VideoGrid from "@/components/simulation/VideoGrid";
import ControlBar from "@/components/simulation/ControlBar";
import StrategyPanel from "@/components/simulation/StrategyPanel";
import ObjectionModal from "@/components/simulation/ObjectionModal";
import DocumentSidebar from "@/components/trial/DocumentSidebar";
import { useNavigate } from "react-router-dom";
import type { UploadedFile } from "@/types/files";

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
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live
          </span>
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
