import { motion } from "framer-motion";
import { Gavel, User, UserCircle } from "lucide-react";

interface VideoGridProps {
  captionsOn: boolean;
}

const VideoGrid = ({ captionsOn }: VideoGridProps) => {
  return (
    <div className="flex-1 flex flex-col gap-3 p-4 min-h-0">
      {/* Judge - primary tile */}
      <div className="flex-[2] min-h-0 relative">
        <VideoTile
          name="Hon. AI Judge"
          role="Presiding Judge"
          icon={<Gavel className="w-5 h-5" />}
          speaking
          gradient="from-primary/5 to-primary/10"
        />
        {captionsOn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-card border border-border max-w-lg shadow-sm"
          >
            <p className="text-sm text-foreground text-center">
              "Counsel, please address the relevance of Exhibit A to your argument..."
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom row - ensure proper min-height */}
      <div className="flex gap-3 h-[200px] min-h-[180px] shrink-0">
        <div className="flex-1 min-w-0">
          <VideoTile
            name="AI Opposing Counsel"
            role="Opposing"
            icon={<UserCircle className="w-5 h-5" />}
            gradient="from-destructive/5 to-destructive/10"
          />
        </div>
        <div className="flex-1 min-w-0">
          <VideoTile
            name="You"
            role="Defense Counsel"
            icon={<User className="w-5 h-5" />}
            isYou
            gradient="from-info/5 to-info/10"
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
  gradient,
}: {
  name: string;
  role: string;
  icon: React.ReactNode;
  speaking?: boolean;
  isYou?: boolean;
  gradient: string;
}) => {
  return (
    <div
      className={`relative w-full h-full rounded-xl bg-gradient-to-br ${gradient} border ${
        speaking ? "border-primary/40 speaker-ring" : "border-border"
      } flex items-center justify-center transition-all duration-300 overflow-hidden`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className={`w-14 h-14 rounded-xl ${isYou ? "bg-info/10" : "bg-muted"} flex items-center justify-center text-muted-foreground`}>
          {icon}
        </div>
        {isYou && (
          <span className="text-xs text-muted-foreground">Camera preview</span>
        )}
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-lg bg-card/90 backdrop-blur-sm text-xs font-medium text-foreground border border-border">
          {name}
        </span>
        <span className="text-[10px] text-muted-foreground">{role}</span>
      </div>

      {speaking && (
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/5 border border-primary/10 text-[10px] text-primary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Speaking
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
