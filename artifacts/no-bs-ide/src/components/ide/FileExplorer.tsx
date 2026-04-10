import { useState } from "react";
import { FileText, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import type { FileNode } from "@/hooks/useFileSystem";

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, name: string) => void;
}

export default function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}: FileExplorerProps) {
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreate = () => {
    const name = newFileName.trim() || "untitled.py";
    const finalName = name.includes(".") ? name : name + ".py";
    onCreateFile(finalName);
    setCreating(false);
    setNewFileName("");
  };

  const handleStartRename = (file: FileNode) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const handleRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameFile(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-[#e6edf3] select-none">
      <div
  className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]"
  style={{
    backgroundColor: "transparent",
  }}
>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#7d8590]">
          Explorer
        </span>
        <button
          onClick={() => setCreating(true)}
          className="text-[#7d8590] hover:text-[#e6edf3] transition-colors p-0.5 rounded"
          title="New File"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {files.map((file) => (
          <div
  key={file.id}
  className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors
    hover:bg-transparent
    ${activeFileId === file.id ? "border-l-2 border-[#58a6ff]" : ""}
  `}
  onClick={() => onSelectFile(file.id)}
>
            <FileText size={14} className="text-[#7d8590] shrink-0" />

            {renamingId === file.id ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 text-xs bg-[#21262d] border border-[#58a6ff] rounded px-1 py-0.5 text-[#e6edf3] outline-none"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleRename(); }}
                  className="text-[#3fb950] hover:text-green-400"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setRenamingId(null); }}
                  className="text-[#ff7b72] hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-xs truncate min-w-0">
                  {file.name}
                  {file.modified && (
                    <span className="ml-1 text-[#e3b341]">●</span>
                  )}
                </span>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartRename(file); }}
                    className="text-[#7d8590] hover:text-[#e6edf3] p-0.5 rounded"
                    title="Rename"
                  >
                    <Edit2 size={11} />
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                      className="text-[#7d8590] hover:text-[#ff7b72] p-0.5 rounded"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {creating && (
          <div className="flex items-center gap-2 px-3 py-1.5">
            <FileText size={14} className="text-[#7d8590] shrink-0" />
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setCreating(false); setNewFileName(""); }
              }}
              placeholder="filename.py"
              className="flex-1 min-w-0 text-xs bg-[#21262d] border border-[#58a6ff] rounded px-1 py-0.5 text-[#e6edf3] outline-none placeholder:text-[#484f58]"
            />
            <button onClick={handleCreate} className="text-[#3fb950] hover:text-green-400">
              <Check size={12} />
            </button>
            <button
              onClick={() => { setCreating(false); setNewFileName(""); }}
              className="text-[#ff7b72] hover:text-red-400"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
