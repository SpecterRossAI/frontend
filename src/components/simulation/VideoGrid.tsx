import { motion } from "framer-motion";
import { User, UserCircle } from "lucide-react";

interface VideoGridProps {
  captionsOn: boolean;
  isAgentSpeaking?: boolean;
  agentCaption?: string;
}

const VideoGrid = ({
  captionsOn,
  isAgentSpeaking = false,
  agentCaption,
}: VideoGridProps) => {
  return (
    <div className="flex-1 flex flex-col gap-4 p-5 min-h-0">
      {/* Speakers */}
      <div className="flex-1 flex gap-3 min-h-0">
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
        className={`relative w-full h-full min-h-[140px] rounded-2xl bg-gradient-to-br ${gradient} border ${
          speaking && isAgent ? "border-primary/40 jarvis-speaking shadow-lg shadow-primary/5" : "border-border/80"
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
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="px-3 py-1.5 rounded-xl bg-card/90 backdrop-blur-md text-xs font-semibold text-foreground border border-border/60 shadow-sm">
          {name}
        </span>
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
