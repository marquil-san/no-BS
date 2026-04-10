import { useEffect, useRef, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  onCtrlC: () => void;
  inputActive: boolean;
  termRef: React.MutableRefObject<{ write: (data: string) => void; clear: () => void } | null>;
}

export default function Terminal({ onData, onResize, onCtrlC, inputActive, termRef }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputActiveRef = useRef(inputActive);

  useEffect(() => {
    inputActiveRef.current = inputActive;
  }, [inputActive]);

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      try {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        onResize(cols, rows);
      } catch {
      }
    }
  }, [onResize]);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
  rendererType: "dom", // 🔥 CRITICAL FIX
  cursorBlink: true,
  cursorStyle: "block",
  fontSize: 17,
  fontFamily: "'JetBrains Mono', monospace",
  theme: {
    background: "#00000000", // 🔥 REAL transparent
    foreground: "#00ff9c",
    cursor: "rgba(88,166,255,0.7)",
    cursorAccent: "transparent",
  },
  allowTransparency: true,
  scrollback: 10000,
});

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);
    
   


    fitAddonRef.current = fitAddon;
    xtermRef.current = term;

    setTimeout(() => {
      handleResize();
    }, 50);

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (e.type !== "keydown") return true;

      if (e.ctrlKey && e.key === "c") {
        onCtrlC();
        return false;
      }

      if (!inputActiveRef.current) {
        return false;
      }

      return true;
    });

    term.onData((data) => {
      if (!inputActiveRef.current) return;
      if (data === "\x03") {
        onCtrlC();
      } else {
        onData(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    termRef.current = {
      write: (data: string) => {
        term.write(data);
      },
      clear: () => {
        term.clear();
      },
    };

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      termRef.current = null;
    };
  }, [onData, onResize, onCtrlC, handleResize, termRef]);

  return (
  <div
    ref={containerRef}
    style={{
      height: "100%",
      width: "100%",
      background: "transparent",
    }}
  />
);
}
