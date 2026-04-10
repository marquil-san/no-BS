import { useState, useRef } from "react";
import { ChevronDown, ChevronRight, Upload } from "lucide-react";
import type { IDESettings, TokenCategory, TokenStyle } from "@/hooks/useSettings";

interface SettingsPanelProps {
  settings: IDESettings;
  onUpdateSetting: <K extends keyof IDESettings>(key: K, value: IDESettings[K]) => void;
  onUpdateTokenStyle: (categoryId: string, tokenId: string, style: Partial<TokenStyle>) => void;
  onUpdateBackground: (bg: { type?: IDESettings["background"]["type"]; value?: string }) => void;
  onInstallPackage: (pkg: string) => void;
  onSaveSettings: () => void;
  packageOutput: string;
}

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#30363d]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-[#7d8590] hover:text-[#e6edf3] transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function TokenStyleEditor({
  token,
  categoryId,
  onUpdate,
}: {
  token: TokenCategory["tokens"][0];
  categoryId: string;
  onUpdate: (categoryId: string, tokenId: string, style: Partial<TokenStyle>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = token.style;

  return (
    <div className="border-b border-[#21262d] last:border-0">
      <div
        className="flex items-center gap-2 px-4 py-1.5 hover:bg-[#161b22] cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="w-3 h-3 rounded-sm shrink-0 border border-[#30363d]"
          style={{ backgroundColor: style.color }}
        />
        <span
          className="flex-1 text-xs truncate"
          style={{
            color: style.color,
            fontWeight: style.bold ? "bold" : undefined,
            fontStyle: style.italic ? "italic" : undefined,
          }}
        >
          {token.label}
        </span>
        {expanded ? <ChevronDown size={10} className="text-[#484f58]" /> : <ChevronRight size={10} className="text-[#484f58]" />}
      </div>

      {expanded && (
        <div className="px-4 pb-3 space-y-2.5 bg-[#0d1117]">
          <div className="flex items-center gap-3">
            <label className="text-[10px] text-[#7d8590] w-16 shrink-0">Color</label>
            <input
              type="color"
              value={style.color}
              onChange={(e) => onUpdate(categoryId, token.id, { color: e.target.value })}
              className="w-7 h-6 rounded border-0 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={style.color}
              onChange={(e) => onUpdate(categoryId, token.id, { color: e.target.value })}
              className="flex-1 text-[10px] bg-[#21262d] border border-[#30363d] rounded px-2 py-1 text-[#e6edf3] outline-none focus:border-[#58a6ff] font-mono"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[10px] text-[#7d8590] w-16 shrink-0">Style</label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={style.bold ?? false}
                onChange={(e) => onUpdate(categoryId, token.id, { bold: e.target.checked })}
                className="w-3 h-3 rounded"
              />
              <span className="text-[10px] text-[#e6edf3] font-bold">Bold</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={style.italic ?? false}
                onChange={(e) => onUpdate(categoryId, token.id, { italic: e.target.checked })}
                className="w-3 h-3 rounded"
              />
              <span className="text-[10px] text-[#e6edf3] italic">Italic</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[10px] text-[#7d8590] w-16 shrink-0">Gradient</label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={style.gradient?.enabled ?? false}
                onChange={(e) =>
                  onUpdate(categoryId, token.id, {
                    gradient: {
                      enabled: e.target.checked,
                      color1: style.gradient?.color1 ?? style.color,
                      color2: style.gradient?.color2 ?? "#ffffff",
                      direction: style.gradient?.direction ?? "linear",
                      speed: style.gradient?.speed ?? 2,
                    },
                  })
                }
                className="w-3 h-3 rounded"
              />
              <span className="text-[10px] text-[#e6edf3]">Animated</span>
            </label>
          </div>

          {style.gradient?.enabled && (
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[#7d8590] w-12 shrink-0">Color 1</label>
                <input
                  type="color"
                  value={style.gradient.color1}
                  onChange={(e) =>
                    onUpdate(categoryId, token.id, {
                      gradient: { ...style.gradient!, color1: e.target.value },
                    })
                  }
                  className="w-7 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={style.gradient.color1}
                  onChange={(e) =>
                    onUpdate(categoryId, token.id, {
                      gradient: { ...style.gradient!, color1: e.target.value },
                    })
                  }
                  className="flex-1 text-[10px] bg-[#21262d] border border-[#30363d] rounded px-2 py-1 text-[#e6edf3] outline-none focus:border-[#58a6ff] font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[#7d8590] w-12 shrink-0">Color 2</label>
                <input
                  type="color"
                  value={style.gradient.color2}
                  onChange={(e) =>
                    onUpdate(categoryId, token.id, {
                      gradient: { ...style.gradient!, color2: e.target.value },
                    })
                  }
                  className="w-7 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={style.gradient.color2}
                  onChange={(e) =>
                    onUpdate(categoryId, token.id, {
                      gradient: { ...style.gradient!, color2: e.target.value },
                    })
                  }
                  className="flex-1 text-[10px] bg-[#21262d] border border-[#30363d] rounded px-2 py-1 text-[#e6edf3] outline-none focus:border-[#58a6ff] font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[#7d8590] w-12 shrink-0">Speed</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={style.gradient.speed}
                  onChange={(e) =>
                    onUpdate(categoryId, token.id, {
                      gradient: { ...style.gradient!, speed: parseFloat(e.target.value) },
                    })
                  }
                  className="flex-1"
                />
                <span className="text-[10px] text-[#7d8590] w-8">{style.gradient.speed}s</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[#7d8590] w-12 shrink-0">Direction</label>
                <select
                  value={style.gradient.direction}
                  onChange={(e) =>
                    onUpdate(categoryId, token.id, {
                      gradient: {
                        ...style.gradient!,
                        direction: e.target.value as "linear" | "diagonal",
                      },
                    })
                  }
                  className="flex-1 text-[10px] bg-[#21262d] border border-[#30363d] rounded px-2 py-1 text-[#e6edf3] outline-none"
                >
                  <option value="linear">Linear</option>
                  <option value="diagonal">Diagonal</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPanel({
  settings,
  onUpdateSetting,
  onUpdateTokenStyle,
  onUpdateBackground,
  onInstallPackage,
  onSaveSettings,
  packageOutput,
}: SettingsPanelProps) {
  const [saved, setSaved] = useState(false);
  const [pkgInput, setPkgInput] = useState("");

  const [activeTab, setActiveTab] = useState<"editor" | "tokens" | "background" | "packages">("editor");
  const bgFileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSaveSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleInstall = () => {
    const pkg = pkgInput.trim();
    if (pkg) {
      onInstallPackage(pkg);
      setPkgInput("");
    }
  };

  const handleBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const type = file.type.startsWith("video/") ? "video" : "image";

  onUpdateBackground({ type, value: url });
};

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] text-xs">
      <div className="flex items-center border-b border-[#30363d] shrink-0">
        <div className="flex flex-1">
          {(["editor", "tokens", "background", "packages"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "text-[#58a6ff] border-b-2 border-[#58a6ff]"
                  : "text-[#7d8590] hover:text-[#e6edf3]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          className={`shrink-0 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider border-l border-[#30363d] transition-colors ${
            saved
              ? "text-[#3fb950] bg-[#0d1117]"
              : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#161b22]"
          }`}
          title="Save settings to browser storage"
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "editor" && (
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-[#7d8590] text-[10px] uppercase tracking-wider">Font Size</span>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSetting("fontSize", Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-[#e6edf3] w-8 text-right">{settings.fontSize}px</span>
                </div>
              </label>

              <label className="block">
                <span className="text-[#7d8590] text-[10px] uppercase tracking-wider">Font Family</span>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => onUpdateSetting("fontFamily", e.target.value)}
                  className="mt-1 w-full bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                >
                  <option value="Menlo, Monaco, 'Courier New', monospace">Menlo</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                  <option value="'Fira Code', monospace">Fira Code</option>
                  <option value="'Source Code Pro', monospace">Source Code Pro</option>
                  <option value="Consolas, monospace">Consolas</option>
                  <option value="monospace">Monospace</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[#7d8590] text-[10px] uppercase tracking-wider">Tab Size</span>
                <select
                  value={settings.tabSize}
                  onChange={(e) => onUpdateSetting("tabSize", Number(e.target.value))}
                  className="mt-1 w-full bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </label>

              <div className="space-y-2">
                {(
                  [
                    { key: "wordWrap", label: "Word Wrap" },
                    { key: "minimap", label: "Minimap" },
                    { key: "lineNumbers", label: "Line Numbers" },
                  ] as const
                ).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key] as boolean}
                      onChange={(e) => onUpdateSetting(key, e.target.checked)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    <span className="text-[#e6edf3]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "tokens" && (
          <div>
            {settings.tokenCategories.map((cat) => (
              <Collapsible key={cat.id} title={cat.label}>
                {cat.tokens.map((tok) => (
                  <TokenStyleEditor
                    key={tok.id}
                    token={tok}
                    categoryId={cat.id}
                    onUpdate={onUpdateTokenStyle}
                  />
                ))}
              </Collapsible>
            ))}
          </div>
        )}

        {activeTab === "background" && (
          <div className="p-4 space-y-4">
            <div>
              <span className="text-[#7d8590] text-[10px] uppercase tracking-wider">Background Type</span>
              <div className="mt-2 flex gap-2 flex-wrap">
                {(["none", "color", "image", "video"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onUpdateBackground({ type })}
                    className={`px-3 py-1.5 rounded text-[11px] capitalize transition-colors ${
                      settings.background.type === type
                        ? "bg-[#58a6ff] text-[#0d1117] font-semibold"
                        : "bg-[#21262d] text-[#7d8590] hover:text-[#e6edf3] border border-[#30363d]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {settings.background.type === "color" && (
              <div>
                <span className="text-[#7d8590] text-[10px] uppercase tracking-wider">Background Color</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={settings.background.value || "#0d1117"}
                    onChange={(e) => onUpdateBackground({ value: e.target.value })}
                    className="w-10 h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.background.value || "#0d1117"}
                    onChange={(e) => onUpdateBackground({ value: e.target.value })}
                    className="flex-1 text-xs bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-[#e6edf3] outline-none focus:border-[#58a6ff] font-mono"
                  />
                </div>
              </div>
            )}

            {(settings.background.type === "image" || settings.background.type === "video") && (
              <div className="space-y-3">
                <div>
                  <span className="text-[#7d8590] text-[10px] uppercase tracking-wider">
                    Upload {settings.background.type === "video" ? "Video" : "Image"}
                  </span>
                  <div className="mt-2">
                    <input
                      ref={bgFileRef}
                      type="file"
                      accept={settings.background.type === "video" ? "video/*" : "image/*"}
                      onChange={handleBgFile}
                      className="hidden"
                    />
                    <button
                      onClick={() => bgFileRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded text-[11px] text-[#e6edf3] transition-colors"
                    >
                      <Upload size={12} />
                      Choose {settings.background.type === "video" ? "Video" : "Image"}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[#7d8590] text-[10px] uppercase tracking-wider">Or enter URL</span>
                  <input
                    type="text"
                    value={settings.background.value}
                    onChange={(e) => onUpdateBackground({ value: e.target.value })}
                    placeholder={
                      settings.background.type === "video"
                        ? "https://example.com/bg.mp4"
                        : "https://example.com/bg.jpg"
                    }
                    className="mt-1 w-full text-xs bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-[#e6edf3] outline-none focus:border-[#58a6ff] placeholder:text-[#484f58]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "packages" && (
          <div className="p-4 space-y-4">
            <div>
              <span className="text-[#7d8590] text-[10px] uppercase tracking-wider block mb-2">Install Package</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pkgInput}
                  onChange={(e) => setPkgInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleInstall(); }}
                  placeholder="e.g. numpy, requests"
                  className="flex-1 text-xs bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-[#e6edf3] outline-none focus:border-[#58a6ff] placeholder:text-[#484f58]"
                />
                <button
                  onClick={handleInstall}
                  disabled={!pkgInput.trim()}
                  className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-[#e6edf3] rounded text-xs font-semibold transition-colors"
                >
                  Install
                </button>
              </div>
            </div>

            {packageOutput && (
              <div>
                <span className="text-[#7d8590] text-[10px] uppercase tracking-wider block mb-1">Output</span>
                <pre className="text-[10px] text-[#e6edf3] bg-[#161b22] border border-[#30363d] rounded p-2 overflow-auto max-h-48 font-mono whitespace-pre-wrap">
                  {packageOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
