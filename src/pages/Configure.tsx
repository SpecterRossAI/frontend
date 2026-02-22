import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ChevronDown, Gavel, BookOpen, Users, Building2, Sparkles, Info, Lightbulb, Clock, Shield, ArrowRight, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import FileUploadZone from "@/components/trial/FileUploadZone";
import FileExplorerModal from "@/components/trial/FileExplorerModal";
import CaseDocumentsDashboard from "@/components/trial/CaseDocumentsDashboard";
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
  const [caseId] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [trialType, setTrialType] = useState("");
  const [judge, setJudge] = useState("ai-default");
  const [trialDropdownOpen, setTrialDropdownOpen] = useState(false);
  const [judgeDropdownOpen, setJudgeDropdownOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [confirmedFiles, setConfirmedFiles] = useState<UploadedFile[]>([]);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    setConfirmedFiles(files);
    setIsProcessing(false);
    setProcessed(true);
  };

  const handleAddMoreFiles = (newFiles: UploadedFile[]) => {
    const current = confirmedFiles.length > 0 ? confirmedFiles : uploadedFiles;
    const merged = [...current, ...newFiles];
    setUploadedFiles(merged);
    setConfirmedFiles(merged);
    setIsProcessing(false);
    setProcessed(true);
  };

  const displayFiles = confirmedFiles.length > 0 ? confirmedFiles : uploadedFiles;
  const totalSize = displayFiles.reduce((acc, f) => acc + f.size, 0);
  const canStart = trialType && displayFiles.length > 0;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - narrow dark bar */}
      <header className="border-b border-slate-700 bg-slate-800 dark:bg-slate-900 px-6 py-3 shrink-0">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight font-display">
              SpecterRoss<span className="text-blue-400">AI</span> Legal Simulation Platform
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle variant="header" />
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all duration-200">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </button>
          </div>
        </div>
      </header>

      {/* Main with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Case Documents Dashboard - always visible */}
        <AnimatePresence>
          {sidebarOpen && (confirmedFiles.length > 0 || uploadedFiles.length > 0) && (
            <CaseDocumentsDashboard
              files={confirmedFiles.length > 0 ? confirmedFiles : uploadedFiles}
              open={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              onAddMore={() => setShowFileExplorer(true)}
              isProcessed={processed}
            />
          )}
        </AnimatePresence>

        {/* Dashboard toggle when closed */}
        {!sidebarOpen && (
          <CaseDocumentsDashboard
            files={confirmedFiles.length > 0 ? confirmedFiles : uploadedFiles}
            open={false}
            onToggle={() => setSidebarOpen(true)}
            onAddMore={() => setShowFileExplorer(true)}
            isProcessed={processed}
          />
        )}

        {/* Content - Full dashboard layout */}
        <main className="flex-1 flex overflow-y-auto bg-muted/30 min-w-0 relative">
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
          <div className="flex-1 flex gap-8 lg:gap-10 xl:gap-12 px-6 sm:px-8 lg:px-10 xl:px-12 py-8 lg:py-10 w-full relative z-10">
            {/* Center: Main Config - flex to fill space */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex-1 min-w-0 flex flex-col"
            >
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
                  Configure Your Trial Simulation
                </h2>
                <p className="text-muted-foreground text-base max-w-xl">
                  Set up your courtroom environment, select your judge, and upload case documents to begin.
                </p>
              </div>

              <div className="surface-elevated p-8 lg:p-10 rounded-2xl space-y-8 lg:space-y-10 border-0 shadow-sm flex-1">
              {/* Step 1 - Trial Type */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-semibold ${
                    trialType ? "bg-success text-white" : "bg-primary text-primary-foreground"
                  }`}>
                    {trialType ? "✓" : "1"}
                  </span>
                  Select Trial Type
                </label>
                <div className="relative">
                  <button
                    onClick={() => setTrialDropdownOpen(!trialDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-muted/50 border border-border text-sm font-medium text-foreground hover:border-primary/30 hover:bg-muted/80 transition-all"
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
                        className="absolute z-20 mt-2 w-full rounded-xl surface-modal overflow-hidden shadow-lg"
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
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-semibold ${
                    judge ? "bg-success text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {judge ? "✓" : "2"}
                  </span>
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
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-muted/50 border border-border text-sm font-medium text-foreground hover:border-primary/30 hover:bg-muted/80 transition-all"
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
                        className="absolute z-20 mt-2 w-full rounded-xl surface-modal overflow-hidden shadow-lg"
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
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-semibold ${
                    displayFiles.length > 0 ? "bg-success text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {displayFiles.length > 0 ? "✓" : "3"}
                  </span>
                  Upload Case Documents
                </label>
                <FileUploadZone
                  caseId={caseId}
                  onFilesUploaded={handleFilesUploaded}
                  onUploadStart={() => setIsProcessing(true)}
                  onUploadError={() => setIsProcessing(false)}
                  onAddMoreFiles={handleAddMoreFiles}
                  isProcessing={isProcessing}
                  processed={processed}
                  fileCount={displayFiles.length}
                  totalSize={totalSize}
                  onViewFiles={() => setShowFileExplorer(true)}
                />
              </div>

              {/* CTA */}
              <motion.button
                whileHover={canStart ? { scale: 1.005 } : {}}
                whileTap={canStart ? { scale: 0.995 } : {}}
                onClick={() => canStart && navigate("/simulation", { state: { files: displayFiles, caseId } })}
                disabled={!canStart}
                className={`w-full py-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  canStart
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/95 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Start Trial Simulation
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

              {/* Tips - mobile only */}
              <div className="lg:hidden mt-6 space-y-4">
                <div className="surface-elevated p-5 rounded-2xl border-0">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Quick Tips
                  </h3>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>• Include complaint, answer, and key exhibits for best results.</li>
                    <li>• PDFs and images are fully supported — our AI parses everything.</li>
                    <li>• Expect ~15–20 min for a mock trial.</li>
                  </ul>
                </div>
              </div>
          </motion.div>

            {/* Right: Summary & Tips - always visible on lg+ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="w-80 xl:w-96 shrink-0 space-y-5 lg:space-y-6 hidden lg:flex lg:flex-col"
            >
              {/* Trial Summary Card */}
              <div className="surface-elevated p-6 rounded-2xl border-0">
                <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Your Trial at a Glance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trial Type</span>
                    <span className="font-medium text-foreground truncate max-w-[120px]">
                      {trialType ? trialTypes.find((t) => t.value === trialType)?.label ?? "—" : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Judge</span>
                    <span className="font-medium text-foreground truncate max-w-[120px]">
                      {judges.find((j) => j.value === judge)?.label ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-medium text-foreground">
                      {displayFiles.length} file{displayFiles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {canStart && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-success font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Ready to start
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="surface-elevated p-6 rounded-2xl border-0">
                <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Quick Tips
                </h3>
                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold shrink-0">1.</span>
                    Include complaint, answer, and key exhibits for best results.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold shrink-0">2.</span>
                    PDFs and images are fully supported — our AI parses everything.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold shrink-0">3.</span>
                    Expect ~15–20 min for a mock trial; depositions may run longer.
                  </li>
                </ul>
              </div>

              {/* Estimated Duration */}
              <div className="surface-elevated p-6 rounded-2xl border-0">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Estimated Duration
                </h3>
                <p className="text-2xl font-bold text-foreground">
                  {trialType === "deposition" ? "30–45 min" : trialType ? "15–20 min" : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on your trial type selection
                </p>
              </div>

              {/* Recent Simulations */}
              <div className="surface-elevated p-6 rounded-2xl border-0">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Recent Simulations
                </h3>
                <p className="text-sm text-muted-foreground">
                  No simulations yet. Start your first trial above.
                </p>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* File Explorer Modal - view only, no selection required */}
      <FileExplorerModal
        open={showFileExplorer}
        onClose={() => setShowFileExplorer(false)}
        files={displayFiles}
        caseId={caseId}
        selectionMode={false}
      />
    </div>
  );
};

export default Configure;
