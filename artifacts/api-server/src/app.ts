import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import fs from "fs";
import path from "path";
import { logger } from "./lib/logger";

const app: Express = express();

// 🔥 middleware
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 ROOT FOLDER (real filesystem)
const ROOT = path.join(process.cwd(), "files");

// ensure folder exists
if (!fs.existsSync(ROOT)) {
  fs.mkdirSync(ROOT);
}

// 🔥 GET ALL FILES
app.get("/files", (req, res) => {
  try {
    const files = fs
      .readdirSync(ROOT)
      .filter((f) => !f.startsWith("nobs_"));

    res.json(files);
  } catch (err) {
    logger.error({ err }, "Failed to read files");
    res.status(500).json({ error: "Failed to read files" });
  }
});

// 🔥 GET FILE CONTENT
app.get("/file", (req, res) => {
  const name = req.query.name as string;

  if (!name) {
    return res.status(400).send("Missing file name");
  }

  const filePath = path.join(ROOT, name);

  try {
    const content = fs.readFileSync(filePath, "utf8");
    res.send(content);
  } catch (err) {
    logger.error({ err }, "Failed to read file");
    res.status(404).send("File not found");
  }
});

// 🔥 CREATE / SAVE FILE
app.post("/file", (req, res) => {
  const { name, content = "" } = req.body;

  if (!name) {
    return res.status(400).send("Missing file name");
  }

  const filePath = path.join(ROOT, name);

  try {
    fs.writeFileSync(filePath, content, "utf8");
    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Failed to write file");
    res.status(500).send("Failed to write file");
  }
});

// 🗑 DELETE FILE
app.delete("/file", (req, res) => {
  const name = req.query.name as string;

  if (!name) {
    return res.status(400).send("Missing file name");
  }

  const filePath = path.join(ROOT, name);

  try {
    fs.unlinkSync(filePath);
    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Failed to delete file");
    res.status(500).send("Failed to delete file");
  }
});

// ✏️ RENAME FILE
app.post("/rename", (req, res) => {
  const { oldName, newName } = req.body;

  if (!oldName || !newName) {
    return res.status(400).send("Missing file names");
  }

  const oldPath = path.join(ROOT, oldName);
  const newPath = path.join(ROOT, newName);

  try {
    fs.renameSync(oldPath, newPath);
    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Failed to rename file");
    res.status(500).send("Failed to rename file");
  }
});

export default app;