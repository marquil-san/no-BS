import { useState, useCallback, useEffect, useRef } from "react";

export interface FileNode {
  id: string;
  name: string;
  content: string;
  language: string;
  modified: boolean;
  loaded: boolean; // 🔥 prevents reload wiping
}

export function useFileSystem() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFileId, _setActiveFileId] = useState<string | null>(null);

  const activeFile =
    files.find((f) => f.id === activeFileId) ?? null;

  const loadFiles = useCallback(async () => {
  try {
    const res = await fetch("http://localhost:3001/files");
    const names: string[] = await res.json();

    let finalNames = names;

    // 🔥 ensure main.py exists
    if (!names.includes("main.py")) {
      await fetch("http://localhost:3001/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "main.py",
          content: 'print("Hello, World!")',
        }),
      });

      finalNames = ["main.py", ...names];
    }

    setFiles((prev) => {
      const map = new Map(prev.map((f) => [f.id, f]));

      return finalNames.map((name) => {
        const existing = map.get(name);

        // ✅ KEEP existing file if it has content (DO NOT overwrite)
        if (existing) {
          return {
            ...existing,
            name,
            language: name.split(".").pop() || "",
          };
        }

        // 🆕 new file
        return {
          id: name,
          name,
          content: "",
          language: name.split(".").pop() || "",
          modified: false,
          loaded: false,
        };
      });
    });

    // ✅ only set active if not already set
    _setActiveFileId((prev) => {
  if (prev) return prev;

  // 🔥 ALWAYS prefer main.py
  if (finalNames.includes("main.py")) return "main.py";

  return finalNames[0] ?? null;
});

  } catch (err) {
    console.error("Failed to load files", err);
  }
}, []);

const loadFileContent = useCallback(async (id: string) => {
  try {
    // 🔍 get file from current state (SAFE)
    const file = files.find((f) => f.id === id);
    if (!file) return;

    // 🚫 don't overwrite user edits
    if (file.loaded || file.modified) return;

    const res = await fetch(
      `http://localhost:3001/file?name=${encodeURIComponent(file.name)}`
    );

    const content = await res.text();

    // ✅ update state
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              content,
              loaded: true,
              modified: false,
            }
          : f
      )
    );
  } catch (err) {
    console.error("Failed to load file content", err);
  }
}, [files]); // ✅ IMPORTANT

  // 🚀 INITIAL LOAD
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // 🔄 LOAD CONTENT WHEN ACTIVE FILE CHANGES
  useEffect(() => {
    if (activeFileId) {
      loadFileContent(activeFileId);
    }
  }, [activeFileId, loadFileContent]);

  // 🔁 store timers per file
// 🔁 timers
const saveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

const saveFile = useCallback(async (id: string, content: string) => {
  let fileName = "";

  setFiles((prev) => {
    const file = prev.find((f) => f.id === id);
    if (!file) return prev;

    fileName = file.name; // ✅ REAL NAME

    return prev.map((f) =>
      f.id === id ? { ...f, modified: false } : f
    );
  });

  if (!fileName) return;

  try {
    await fetch("http://localhost:3001/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fileName, // 🔥 FIXED
        content,
      }),
    });
  } catch (err) {
    console.error("Save failed", err);
  }
}, []);


// ✏️ THEN updateFileContent
const updateFileContent = useCallback((id: string, content: string) => {
  setFiles((prev) =>
    prev.map((f) =>
      f.id === id
        ? { ...f, content, modified: true }
        : f
    )
  );

  if (saveTimer.current[id]) {
    clearTimeout(saveTimer.current[id]);
  }

  saveTimer.current[id] = setTimeout(() => {
    saveFile(id, content);
  }, 800);
}, [saveFile]);

  // 🔥 SWITCH FILE (AUTO SAVE BEFORE SWITCH)
  const setActiveFileId = useCallback(async (newId: string) => {
    if (activeFileId) {
      const current = files.find((f) => f.id === activeFileId);

      if (current?.modified) {
        await fetch("http://localhost:3001/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: current.name,
            content: current.content,
          }),
        });
      }
    }

    _setActiveFileId(newId);
  }, [activeFileId, files]);

  // 📄 CREATE FILE
  const createFile = useCallback(async (name: string) => {
    const finalName = name.includes(".") ? name : `${name}.py`;

    await fetch("http://localhost:3001/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: finalName, content: "" }),
    });

    await loadFiles();
    _setActiveFileId(finalName);
  }, [loadFiles]);

  // 🗑 DELETE FILE
  const deleteFile = useCallback(async (id: string) => {
    await fetch(
      `http://localhost:3001/file?name=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    await loadFiles();
  }, [loadFiles]);

  // ✏️ RENAME FILE
  const renameFile = useCallback(async (id: string, newName: string) => {
    await fetch("http://localhost:3001/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName: id, newName }),
    });

    await loadFiles();
    _setActiveFileId(newName);
  }, [loadFiles]);

  return {
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
  };
}