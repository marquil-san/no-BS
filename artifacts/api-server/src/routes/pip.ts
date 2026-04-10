import { Router, type IRouter } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const router: IRouter = Router();
const execAsync = promisify(exec);

router.get("/pip/list", async (_req, res) => {
  try {
    const { stdout } = await execAsync("pip3 list --format=json 2>/dev/null || pip list --format=json");
    const packages = JSON.parse(stdout);
    res.json({ packages });
  } catch {
    res.json({ packages: [] });
  }
});

router.post("/pip/install", async (req, res) => {
  const { package: pkg } = req.body as { package: string };
  if (!pkg || typeof pkg !== "string" || !/^[a-zA-Z0-9_\-\[\]>=<!.]+$/.test(pkg)) {
    res.status(400).json({ error: "Invalid package name" });
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(`pip3 install ${pkg} 2>&1 || pip install ${pkg} 2>&1`);
    res.json({ success: true, output: stdout + stderr });
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    res.json({ success: false, output: (error.stdout || "") + (error.stderr || "") || String(error.message) });
  }
});

export default router;
