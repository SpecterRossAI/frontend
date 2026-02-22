import { motion, AnimatePresence } from "framer-motion";
import { Gavel, User, UserCircle } from "lucide-react";
import type { JudgementEntry } from "@/types/simulation";

interface VideoGridProps {
  captionsOn: boolean;
  isAgentSpeaking?: boolean;
  agentCaption?: string;
  judgements?: JudgementEntry[];
  onAddJudgement?: () => void;
}

const VideoGrid = ({
  captionsOn,
  isAgentSpeaking = false,
  agentCaption,
  judgements = [],
  onAddJudgement,
}: VideoGridProps) => {
  return (
    <div className="flex-1 flex flex-col gap-4 p-5 min-h-0">
      {/* Judgements from the judge (agent) */}
      <div className="shrink-0">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gavel className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Court Rulings</h3>
                <p className="text-[11px] text-muted-foreground">
                  Judgements from the judge (AI agent) as the proceeding unfolds
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddJudgement}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold transition-all"
            >
              <Gavel className="w-3.5 h-3.5" />
              Get
            </motion.button>
          </div>

          <div className="min-h-[88px]">
            <AnimatePresence mode="popLayout">
              {judgements.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-h-44 overflow-y-auto"
                >
                  {judgements.map((j, i) => {
                    const isOpening = j.stage === "opening";
                    const isStart = j.stage === "start";
                    const isProcedural = isOpening || isStart;
                    return (
                      <motion.div
                        key={j.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`px-5 py-3.5 flex gap-3 items-start ${
                          isProcedural ? "bg-muted/30 border-b border-border/50 first:border-t-0" : ""
                        }`}
                      >
                        {!isProcedural && (
                          <span className={`shrink-0 w-2 h-2 mt-1.5 rounded-full ${
                            /sustained/i.test(j.text) ? "bg-success" :
                            /overruled/i.test(j.text) ? "bg-destructive" :
                            /reserved/i.test(j.text) ? "bg-amber-500" :
                            "bg-primary"
                          }`} />
                        )}
                        <div className="min-w-0 flex-1">
                          {isProcedural && (
                            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                              {isOpening ? "Court" : "Judge"}
                            </span>
                          )}
                          {j.context && !isProcedural && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-0.5">
                              {j.context}
                            </p>
                          )}
                          <p className={`text-sm ${isProcedural ? "text-foreground font-medium" : "font-semibold"} ${
                            isProcedural ? "" :
                            /sustained/i.test(j.text) ? "text-success" :
                            /overruled/i.test(j.text) ? "text-destructive" :
                            /reserved/i.test(j.text) ? "text-amber-600" :
                            "text-foreground"
                          }`}>
                            {j.text}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 py-6 flex flex-col items-center justify-center gap-3 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center">
                    <Gavel className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Awaiting rulings</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      The judge will rule on objections and motions as they arise
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddJudgement}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-semibold transition-all"
                  >
                    <Gavel className="w-4 h-4" />
                    Get Judgement
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Two speakers: AI Opposing Counsel | You */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col gap-2 min-h-0">
          <div className="flex-1 min-h-0">
            <VideoTile
            name="AI Opposing Counsel"
            role="Opposing"
            icon={<UserCircle className="w-6 h-6" />}
            speaking={isAgentSpeaking}
            isAgent
            gradient="from-destructive/5 via-destructive/[0.03] to-destructive/10"
          />
          </div>
          {captionsOn && agentCaption && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-2.5 rounded-xl bg-card/95 backdrop-blur-sm border border-border shadow-sm"
            >
              <p className="text-sm text-foreground leading-relaxed line-clamp-2">{agentCaption}</p>
            </motion.div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <VideoTile
            name="You"
            role="Defense Counsel"
            icon={<User className="w-6 h-6" />}
            isYou
            gradient="from-info/5 via-info/[0.03] to-info/10"
          />
        </div>
      </div>
    </div>
  );
};

const VideoTile = ({
  name,
  role,
  icon,
  speaking = false,
  isYou = false,
  isAgent = false,
  gradient,
}: {
  name: string;
  role: string;
  icon: React.ReactNode;
  speaking?: boolean;
  isYou?: boolean;
  isAgent?: boolean;
  gradient: string;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative w-full h-full min-h-[160px] rounded-2xl bg-gradient-to-br ${gradient} border-2 ${
        speaking && isAgent ? "border-primary/50 jarvis-speaking shadow-jarvis" : "border-border"
      } flex items-center justify-center transition-all duration-300 overflow-hidden`}
    >
      {/* Jarvis-style speaking indicator - concentric pulse rings */}
      {speaking && isAgent && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute inset-0 jarvis-pulse-ring" />
          <div className="absolute inset-2 rounded-[14px] jarvis-pulse-ring jarvis-pulse-delay-1" />
          <div className="absolute inset-4 rounded-xl jarvis-pulse-ring jarvis-pulse-delay-2" />
          <div className="absolute inset-6 rounded-lg jarvis-pulse-ring jarvis-pulse-delay-3" />
        </div>
      )}

      <div className="relative flex flex-col items-center gap-4 z-10">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isYou
              ? "bg-info/15 text-info"
              : speaking && isAgent
              ? "bg-primary/15 text-primary jarvis-icon-glow"
              : "bg-muted/80 text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        {isYou && (
          <span className="text-xs text-muted-foreground font-medium">Camera preview</span>
        )}
      </div>

      {/* Name badge */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-card/95 backdrop-blur-sm text-sm font-medium text-foreground border border-border/80 shadow-sm">
            {name}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">{role}</span>
        </div>
      </div>

      {/* Jarvis-style speaking badge */}
      {speaking && isAgent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4 z-20"
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-primary/15 border border-primary/30 backdrop-blur-sm">
            <div className="flex gap-1 items-end h-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-primary jarvis-wave-bar"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-primary">Speaking</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoGrid;
