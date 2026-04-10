import { useRef, useState, useCallback, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import MonacoEditor from "@/components/ide/MonacoEditor";
import Terminal from "@/components/ide/Terminal";
import FileExplorer from "@/components/ide/FileExplorer";
import SettingsPanel from "@/components/ide/SettingsPanel";
import Toolbar from "@/components/ide/Toolbar";
import BackgroundLayer from "@/components/ide/BackgroundLayer";
import { useWebSocket, WsMessage } from "@/hooks/useWebSocket";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useSettings } from "@/hooks/useSettings";

export default function IDE() {
  const termRef = useRef<{ write: (data: string) => void; clear: () => void } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [inputActive, setInputActive] = useState(false);
  const [packageOutput, setPackageOutput] = useState("");
  const [panels, setPanels] = useState({
    explorer: true,
    terminal: true,
    settings: false,
  });

  const editorRef = useRef<any>(null);

  const { settings, updateSetting, updateTokenStyle, updateBackground, saveSettings } = useSettings();

  const {
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    updateFileContent,
    saveFile,
    createFile,
    deleteFile,
    renameFile,
    loadFiles,
  } = useFileSystem();

const glass = {
  backgroundColor: "transparent",
backdropFilter: "none",
WebkitBackdropFilter: "none",
};

  const handleMessage = useCallback((msg: WsMessage) => {
    if (msg.type === "output") {
      termRef.current?.write(msg.data);
    } else if (msg.type === "program_start") {
      setIsRunning(true);
      setInputActive(true);
    } else if (msg.type === "program_done") {
      setIsRunning(false);
      setInputActive(false);
      const code = msg.exitCode ?? 0;
      const color = code === 0 ? "\x1b[32m" : "\x1b[31m";
      termRef.current?.write(`\r\n${color}[Process exited with code ${code}]\x1b[0m\r\n`);
    }
  }, []);

  const { connected, runCode, sendInput, sendCtrlC, resize, installPackage } = useWebSocket({
    onMessage: handleMessage,
  });


const handleRun = useCallback(async () => {
  if (!activeFileId) return;

  const code =
    editorRef.current?.getValue() ?? activeFile?.content ?? "";

  // 🔥 update local state
  updateFileContent(activeFileId, code);

  // 🔥 save latest content
  await saveFile(activeFileId, code);

  // 🖥️ clear + print header
  termRef.current?.write(
    `\x1b[2J\x1b[H\x1b[36m▶ Running ${activeFile?.name ?? "file"}\x1b[0m\r\n`
  );

  // ▶ run code
  runCode(code);
}, [
  activeFileId,
  activeFile,
  runCode,
  updateFileContent,
  saveFile, // 🔥 IMPORTANT (you missed this)
]);

  const handleStop = useCallback(() => {
    sendCtrlC();
    setIsRunning(false);
    setInputActive(false);
  }, [sendCtrlC]);

  const handleInstallPackage = useCallback(
    (pkg: string) => {
      setPackageOutput(`Installing ${pkg}...\n`);
      installPackage(pkg);
    },
    [installPackage]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun]);

  const togglePanel = useCallback((panel: keyof typeof panels) => {
    setPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  }, []);

  const bg = settings.background;
  const hasBg = bg.type !== "none" && bg.value;

  // Panel background: transparent when a background image/video/color is active
  const panelBg = hasBg ? "transparent" : "#0d1117";
  const subPanelBg = "transparent";
  const headerBg = hasBg ? "transparent" : "#010409";
  const explorerBg = hasBg ? "transparent" : "#161b22";
  const settingsBg = hasBg ? "transparent" : "#0d1117";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <BackgroundLayer background={settings.background} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          position: "relative",
          zIndex: 1,
          backgroundColor: panelBg,
          backdropFilter: hasBg ? "blur(0px)" : undefined,
        }}
      >
        <Toolbar
          isRunning={isRunning}
          connected={connected}
          activeFileName={activeFile?.name ?? ""}
          onRun={handleRun}
          onStop={handleStop}
          onTogglePanel={togglePanel}
          panels={panels}
        />

        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <PanelGroup direction="horizontal" style={{ height: "100%" }}>
            {panels.explorer && (
              <>
                <Panel defaultSize={15} minSize={10} maxSize={30}>
                  <div
  style={{
    height: "100%",
    overflow: "hidden",
    ...(hasBg
      ? {
          backgroundColor: "transparent",
          WebkitBackdropFilter: "blur(0px)",
        }
      : { backgroundColor: explorerBg }),
  }}
>
                    <FileExplorer
                      files={files}
                      activeFileId={activeFileId}
                      onSelectFile={setActiveFileId}
                      onCreateFile={createFile}
                      onDeleteFile={deleteFile}
                      onRenameFile={renameFile}
                    />
                  </div>
                </Panel>
                <PanelResizeHandle className="w-px bg-[#30363d] hover:bg-[#58a6ff] transition-colors cursor-col-resize" />
              </>
            )}

            <Panel minSize={30}>
              <PanelGroup direction="vertical" style={{ height: "100%" }}>
                <Panel defaultSize={panels.terminal ? 60 : 100} minSize={20}>
                  <div
  style={{
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "transparent",
  }}
>
                    <div style={{ display: "flex", alignItems: "center", padding: "2px 12px", backgroundColor: headerBg, borderBottom: "1px solid #30363d", flexShrink: 0 }}>
                      <span className="text-[10px] uppercase tracking-widest font-semibold token-animated animate-token">
                        Editor — {activeFile?.name}
                      </span>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                      <MonacoEditor
  value={activeFile?.content ?? ""}
  onChange={(v) => updateFileContent(activeFileId, v)}
  settings={settings}
  onSave={() =>
  saveFile(
    activeFileId,
    editorRef.current?.getValue() ?? activeFile?.content ?? ""
  )
}
  onMountEditor={(ed) => (editorRef.current = ed)} // 🔥 ADD THIS
/>
                    </div>
                  </div>
                </Panel>

                {panels.terminal && (
  <>
    <PanelResizeHandle className="h-px bg-[#30363d] hover:bg-[#58a6ff] transition-colors cursor-row-resize" />
    <Panel defaultSize={40} minSize={15}>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "transparent",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 12px",
            backgroundColor: headerBg,
            borderBottom: "1px solid #30363d",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="text-[10px] text-[#7d8590] uppercase tracking-widest font-semibold">
              Terminal
            </span>
          </div>

          <button
            onClick={() => termRef.current?.clear()}
            className="text-[10px] text-[#484f58] hover:text-[#7d8590] transition-colors"
          >
            clear
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <Terminal
            onData={sendInput}
            onResize={resize}
            onCtrlC={sendCtrlC}
            inputActive={inputActive}
            termRef={termRef}
          />
        </div>
      </div>
    </Panel>
  </>
)}              </PanelGroup>
            </Panel>

            {panels.settings && (
              <>
                <PanelResizeHandle className="w-px bg-[#30363d] hover:bg-[#58a6ff] transition-colors cursor-col-resize" />
                <Panel defaultSize={22} minSize={15} maxSize={40}>
                  <div style={{ height: "100%", backgroundColor: settingsBg, overflow: "hidden" }}>
                    <SettingsPanel
                      settings={settings}
                      onUpdateSetting={updateSetting}
                      onUpdateTokenStyle={updateTokenStyle}
                      onUpdateBackground={updateBackground}
                      onInstallPackage={handleInstallPackage}
                      onSaveSettings={saveSettings}
                      packageOutput={packageOutput}
                    />
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}
