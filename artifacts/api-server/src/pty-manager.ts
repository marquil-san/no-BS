import * as pty from "node-pty";
import { EventEmitter } from "events";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { logger } from "./lib/logger";

export class PtyManager extends EventEmitter {
  private shellPty: pty.IPty | null = null;
  private pythonPty: pty.IPty | null = null;
  private pythonRunning: boolean = false;

  constructor() {
    super();
    this.initShellPty();
  }

  private initShellPty() {
  try {
    const shell = process.platform === "win32"
      ? "powershell.exe"
      : "/bin/bash";

    this.shellPty = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 120,
      rows: 40,
      cwd: os.tmpdir(),
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
      },
    });

    this.shellPty.onExit(({ exitCode }) => {
      logger.info({ exitCode }, "Shell PTY exited, reinitializing...");
      this.shellPty = null;
      setTimeout(() => this.initShellPty(), 500);
    });

    logger.info(`Shell PTY initialized using ${shell}`);
  } catch (err) {
    logger.error({ err }, "Failed to initialize shell PTY");
  }
}

  runPythonCode(code: string): void {
    if (this.pythonPty) {
      try {
        this.pythonPty.kill();
      } catch {}
      this.pythonPty = null;
    }

    const ROOT = path.join(process.cwd(), "files");

if (!fs.existsSync(ROOT)) {
  fs.mkdirSync(ROOT);
}

const tmpFile = path.join(ROOT, `nobs_${Date.now()}.py`);

    try {
      fs.writeFileSync(tmpFile, code, "utf8");
    } catch (err) {
      this.emit("data", { type: "output", data: `Error writing file: ${err}\r\n` });
      return;
    }

    this.pythonRunning = true;
    this.emit("data", { type: "program_start" });

    try {
      const pyPty = pty.spawn("C:\\Python314\\python.exe", ["-u", tmpFile], {
        name: "xterm-color",
        cols: 120,
        rows: 40,
        cwd: ROOT,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          COLORTERM: "truecolor",
          PYTHONUNBUFFERED: "1",
          PYTHONDONTWRITEBYTECODE: "1",
        },
      });

      this.pythonPty = pyPty;

      pyPty.onData((data) => {
        this.emit("data", { type: "output", data });
      });

      pyPty.onExit(({ exitCode }) => {
        this.pythonRunning = false;
        this.pythonPty = null;

        try {
          fs.unlinkSync(tmpFile);
        } catch {}

        this.emit("data", { type: "program_done", exitCode });
      });
    } catch (err) {
      this.pythonRunning = false;
      this.emit("data", { type: "output", data: `Failed to start Python: ${err}\r\n` });
      this.emit("data", { type: "program_done", exitCode: 1 });

      try {
        fs.unlinkSync(tmpFile);
      } catch {}
    }
  }

  sendInput(data: string): void {
    if (this.pythonPty && this.pythonRunning) {
      this.pythonPty.write(data);
    }
  }

  sendCtrlC(): void {
    if (this.pythonPty) {
      this.pythonPty.write("\x03");
    }
  }

  resize(cols: number, rows: number): void {
    if (this.pythonPty) {
      try { this.pythonPty.resize(cols, rows); } catch {}
    }
    if (this.shellPty) {
      try { this.shellPty.resize(cols, rows); } catch {}
    }
  }

  installPackage(packageName: string): void {
    if (!this.shellPty) {
      this.emit("data", { type: "output", data: "\r\nError: shell not ready\r\n" });
      return;
    }
    this.emit("data", { type: "output", data: `\r\nInstalling ${packageName}...\r\n` });
    this.shellPty.write(`pip3 install ${packageName} 2>&1 && echo "✓ Install done" || echo "✗ Install failed"\r`);
    this.shellPty.onData((data) => {
      this.emit("data", { type: "output", data });
    });
  }

  isRunning(): boolean {
    return this.pythonRunning;
  }
}

let instance: PtyManager | null = null;

export function getPtyManager(): PtyManager {
  if (!instance) {
    instance = new PtyManager();
  }
  return instance;
}
