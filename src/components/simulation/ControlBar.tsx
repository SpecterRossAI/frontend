import { Mic, MicOff, Video, VideoOff, Monitor, Subtitles, AlertTriangle, Settings, PhoneOff, BrainCircuit } from "lucide-react";
import { useState } from "react";

interface ControlBarProps {
  onToggleStrategy: () => void;
  onObjection: () => void;
  onCaptions: () => void;
  captionsOn: boolean;
  onEnd: () => void;
}

const ControlBar = ({ onToggleStrategy, onObjection, onCaptions, captionsOn, onEnd }: ControlBarProps) => {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  return (
    <div className="px-4 py-4 flex justify-center">
      <div className="bg-card/95 backdrop-blur-md px-5 py-2.5 flex items-center justify-between gap-4 mx-auto max-w-xl rounded-full border border-border/80 shadow-lg shadow-black/5">
        <div className="flex items-center gap-1">
          <ControlButton
            icon={muted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            onClick={() => setMuted(!muted)}
            active={!muted}
            label="Mic"
          />
          <ControlButton
            icon={videoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            onClick={() => setVideoOff(!videoOff)}
            active={!videoOff}
            label="Camera"
          />
          <ControlButton icon={<Monitor className="w-3.5 h-3.5" />} label="Share" />
          <ControlButton
            icon={<Subtitles className="w-3.5 h-3.5" />}
            onClick={onCaptions}
            active={captionsOn}
            label="Captions"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onObjection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/15 border border-destructive/20"
          >
            <AlertTriangle className="w-3 h-3" />
            Objection
          </button>
          <ControlButton
            icon={<BrainCircuit className="w-3.5 h-3.5" />}
            onClick={onToggleStrategy}
            label="AI Panel"
            accent
          />
        </div>

        <div className="flex items-center gap-1">
          <ControlButton icon={<Settings className="w-3.5 h-3.5" />} label="Settings" />
          <button
            onClick={onEnd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90"
          >
            <PhoneOff className="w-3 h-3" />
            End
          </button>
        </div>
      </div>
    </div>
  );
};

const ControlButton = ({
  icon,
  onClick,
  active,
  label,
  accent,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  label: string;
  accent?: boolean;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
      accent
        ? "bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10"
        : active === false
        ? "bg-destructive/5 text-destructive hover:bg-destructive/10"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`}
  >
    {icon}
  </button>
);

export default ControlBar;
