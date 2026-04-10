import { Play, Square, Settings, Terminal, FolderOpen, X, Wifi, WifiOff, ChevronDown } from "lucide-react";

interface ToolbarProps {
  isRunning: boolean;
  connected: boolean;
  activeFileName: string;
  onRun: () => void;
  onStop: () => void;
  onTogglePanel: (panel: "explorer" | "terminal" | "settings") => void;
  panels: { explorer: boolean; terminal: boolean; settings: boolean };
}

export default function Toolbar({
  isRunning,
  connected,
  activeFileName,
  onRun,
  onStop,
  onTogglePanel,
  panels,
}: ToolbarProps) {
  return (
    <div
  className="flex items-center gap-2 px-3 py-1.5 border-b border-[#30363d] shrink-0"
  style={{
    backgroundColor: "transparent",
backdropFilter: "none",
    WebkitBackdropFilter: "blur(8px)",
  }}
>
      <div className="flex items-center gap-1 mr-2">
        <span className="text-[#58a6ff] font-bold text-sm tracking-tight">no-BS</span>
        <span className="text-[#7d8590] text-xs">Python IDE</span>
      </div>

      <div className="h-4 w-px bg-[#30363d] mx-1" />

      <button
        onClick={onRun}
        disabled={isRunning}
        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
          isRunning
            ? "bg-[#21262d] text-[#484f58] cursor-not-allowed"
            : "bg-[#238636] hover:bg-[#2ea043] text-[#e6edf3] shadow-sm"
        }`}
        title="Run (Ctrl+Enter)"
      >
        <Play size={12} />
        Run
      </button>

      <button
        onClick={onStop}
        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-[#21262d] hover:bg-[#da3633] text-[#7d8590] hover:text-[#e6edf3] border border-[#30363d] transition-all"
        title="Stop (Ctrl+C)"
      >
        <Square size={12} />
        Stop
      </button>

      <div className="h-4 w-px bg-[#30363d] mx-1" />

      <span className="text-xs text-[#7d8590] font-mono">{activeFileName}</span>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => onTogglePanel("explorer")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
            panels.explorer
              ? "bg-[#21262d] text-[#e6edf3]"
              : "text-[#7d8590] hover:text-[#e6edf3]"
          }`}
          title="Toggle Explorer"
        >
          <FolderOpen size={13} />
        </button>

        <button
          onClick={() => onTogglePanel("terminal")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
            panels.terminal
              ? "bg-[#21262d] text-[#e6edf3]"
              : "text-[#7d8590] hover:text-[#e6edf3]"
          }`}
          title="Toggle Terminal"
        >
          <Terminal size={13} />
        </button>

        <button
          onClick={() => onTogglePanel("settings")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
            panels.settings
              ? "bg-[#21262d] text-[#e6edf3]"
              : "text-[#7d8590] hover:text-[#e6edf3]"
          }`}
          title="Settings"
        >
          <Settings size={13} />
        </button>
      </div>

      <div className="h-4 w-px bg-[#30363d] mx-1" />

      <div className="flex items-center gap-1.5">
        {connected ? (
          <>
            <Wifi size={12} className="text-[#3fb950]" />
            <span className="text-[10px] text-[#3fb950]">Connected</span>
          </>
        ) : (
          <>
            <WifiOff size={12} className="text-[#f85149]" />
            <span className="text-[10px] text-[#f85149]">Offline</span>
          </>
        )}
      </div>
    </div>
  );
}
