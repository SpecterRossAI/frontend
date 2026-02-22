import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface ThemeToggleProps {
  /** Use on dark header backgrounds for light icon */
  variant?: "default" | "header";
}

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isHeader = variant === "header";

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
        isHeader
          ? "border border-slate-600 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 hover:text-white"
          : "border border-border bg-card hover:bg-muted/80 hover:border-primary/30 text-foreground"
      }`}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
