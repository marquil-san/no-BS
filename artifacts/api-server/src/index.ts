import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import { getPtyManager } from "./pty-manager";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

const ptyManager = getPtyManager();

wss.on("connection", (ws: WebSocket) => {
  logger.info("WebSocket client connected");

  const dataHandler = (msg: object) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  ptyManager.on("data", dataHandler);

  ws.on("message", (message: Buffer) => {
    try {
      const msg = JSON.parse(message.toString());

      switch (msg.type) {
        case "run":
          ptyManager.runPythonCode(msg.code);
          break;
        case "input":
          ptyManager.sendInput(msg.data);
          break;
        case "ctrlc":
          ptyManager.sendCtrlC();
          break;
        case "resize":
          ptyManager.resize(msg.cols, msg.rows);
          break;
        case "install":
          ptyManager.installPackage(msg.package);
          break;
        default:
          logger.warn({ type: msg.type }, "Unknown message type");
      }
    } catch (err) {
      logger.error({ err }, "Error processing WebSocket message");
    }
  });

  ws.on("close", () => {
    logger.info("WebSocket client disconnected");
    ptyManager.removeListener("data", dataHandler);
  });

  ws.on("error", (err) => {
    logger.error({ err }, "WebSocket error");
    ptyManager.removeListener("data", dataHandler);
  });
});

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening with WebSocket support");
});
