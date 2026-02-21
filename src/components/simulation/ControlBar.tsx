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
    <div className="px-4 py-3">
      <div className="surface-card px-6 py-3 flex items-center justify-between mx-auto max-w-3xl">
        <div className="flex items-center gap-2">
          <ControlButton
            icon={muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            onClick={() => setMuted(!muted)}
            active={!muted}
            label="Mic"
          />
          <ControlButton
            icon={videoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            onClick={() => setVideoOff(!videoOff)}
            active={!videoOff}
            label="Camera"
          />
          <ControlButton icon={<Monitor className="w-4 h-4" />} label="Share" />
          <ControlButton
            icon={<Subtitles className="w-4 h-4" />}
            onClick={onCaptions}
            active={captionsOn}
            label="Captions"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onObjection}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive/5 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors border border-destructive/15"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Objection
          </button>
          <ControlButton
            icon={<BrainCircuit className="w-4 h-4" />}
            onClick={onToggleStrategy}
            label="AI Panel"
            accent
          />
        </div>

        <div className="flex items-center gap-2">
          <ControlButton icon={<Settings className="w-4 h-4" />} label="Settings" />
          <button
            onClick={onEnd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
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
    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
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
