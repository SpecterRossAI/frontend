import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ChevronDown, Gavel, BookOpen, Users, Building2, Sparkles, Info } from "lucide-react";
import FileUploadZone from "@/components/trial/FileUploadZone";
import FileExplorerModal from "@/components/trial/FileExplorerModal";
import DocumentSidebar from "@/components/trial/DocumentSidebar";
import { useNavigate } from "react-router-dom";
import type { UploadedFile } from "@/types/files";

const trialTypes = [
  { value: "mock", label: "Mock Trial", icon: Gavel },
  { value: "deposition", label: "Deposition", icon: Users },
  { value: "law-school", label: "Law School Practice Trial", icon: BookOpen },
  { value: "arbitration", label: "Arbitration", icon: Building2 },
  { value: "appellate", label: "Appellate Argument", icon: Scale },
];

const judges = [
  { value: "ai-default", label: "AI Judge (Default)", description: "Balanced, neutral judicial persona" },
  { value: "sotomayor", label: "Justice Sonia Sotomayor", description: "Style Simulation" },
  { value: "learned-hand", label: "Judge Learned Hand", description: "Style Simulation" },
  { value: "custom", label: "Custom Judge Persona", description: "Define your own" },
];

const Configure = () => {
  const navigate = useNavigate();
  const [trialType, setTrialType] = useState("");
  const [judge, setJudge] = useState("ai-default");
  const [trialDropdownOpen, setTrialDropdownOpen] = useState(false);
  const [judgeDropdownOpen, setJudgeDropdownOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [confirmedFiles, setConfirmedFiles] = useState<UploadedFile[]>([]);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setProcessed(true);
      setShowFileExplorer(true);
    }, 2000);
  };

  const handleConfirmSelection = (files: UploadedFile[]) => {
    setConfirmedFiles(files);
    setSidebarOpen(true);
  };

  const totalSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
  const canStart = trialType && confirmedFiles.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>SpecterRoss<span className="text-primary">AI</span></h1>
              <p className="text-xs text-muted-foreground">Legal Simulation Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary border border-border">
              <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
              AI-Powered
            </span>
          </div>
        </div>
      </header>

      {/* Main with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Sidebar */}
        <AnimatePresence>
          {sidebarOpen && confirmedFiles.length > 0 && (
            <DocumentSidebar
              files={confirmedFiles}
              open={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar toggle when closed */}
        {!sidebarOpen && confirmedFiles.length > 0 && (
          <DocumentSidebar
            files={confirmedFiles}
            open={false}
            onToggle={() => setSidebarOpen(true)}
          />
        )}

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground tracking-tight mb-3">
                Configure Your Trial Simulation
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Set up your courtroom environment, select your judge, and upload case documents to begin.
              </p>
            </div>

            <div className="surface-elevated p-8 space-y-8">
              {/* Step 1 - Trial Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">1</span>
                  Select Trial Type
                </label>
                <div className="relative">
                  <button
                    onClick={() => setTrialDropdownOpen(!trialDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-background border border-border text-sm text-foreground hover:border-primary/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {trialType ? (
                        <>
                          {(() => { const t = trialTypes.find(tt => tt.value === trialType); const Icon = t?.icon || Gavel; return <Icon className="w-4 h-4 text-primary" />; })()}
                          {trialTypes.find(t => t.value === trialType)?.label}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Choose trial type...</span>
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${trialDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {trialDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-20 mt-2 w-full rounded-xl surface-modal overflow-hidden"
                      >
                        {trialTypes.map((t) => {
                          const Icon = t.icon;
                          return (
                            <button
                              key={t.value}
                              onClick={() => { setTrialType(t.value); setTrialDropdownOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Icon className="w-4 h-4 text-primary" />
                              {t.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Step 2 - Judge */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">2</span>
                  Choose Judge
                  <span className="relative group">
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs bg-foreground text-background border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-56 pointer-events-none z-30">
                      All judges are AI-simulated personas trained on historical style patterns.
                    </span>
                  </span>
                </label>
                <div className="relative">
                  <button
                    onClick={() => setJudgeDropdownOpen(!judgeDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-background border border-border text-sm text-foreground hover:border-primary/40 transition-colors"
                  >
                    <span>{judges.find(j => j.value === judge)?.label || "Select judge..."}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${judgeDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {judgeDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-20 mt-2 w-full rounded-xl surface-modal overflow-hidden"
                      >
                        {judges.map((j) => (
                          <button
                            key={j.value}
                            onClick={() => { setJudge(j.value); setJudgeDropdownOpen(false); }}
                            className="w-full flex flex-col items-start px-4 py-3 text-sm hover:bg-muted transition-colors"
                          >
                            <span className="text-foreground">{j.label}</span>
                            <span className="text-xs text-muted-foreground">{j.description}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Step 3 - Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">3</span>
                  Upload Case Documents
                </label>
                <FileUploadZone
                  onFilesUploaded={handleFilesUploaded}
                  isProcessing={isProcessing}
                  processed={processed}
                  fileCount={confirmedFiles.length}
                  totalSize={totalSize}
                  onViewFiles={() => setShowFileExplorer(true)}
                />
              </div>

              {/* CTA */}
              <motion.button
                whileHover={canStart ? { scale: 1.005 } : {}}
                whileTap={canStart ? { scale: 0.995 } : {}}
                onClick={() => canStart && navigate("/simulation")}
                disabled={!canStart}
                className={`w-full py-4 rounded-lg text-sm font-semibold transition-all ${
                  canStart
                    ? "bg-primary text-primary-foreground glow-primary hover:glow-primary-hover cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Start Trial Simulation
              </motion.button>
            </div>
          </motion.div>
        </main>
      </div>

      {/* File Explorer Modal */}
      <FileExplorerModal
        open={showFileExplorer}
        onClose={() => setShowFileExplorer(false)}
        files={uploadedFiles}
        selectionMode
        onConfirmSelection={handleConfirmSelection}
      />
    </div>
  );
};

export default Configure;
