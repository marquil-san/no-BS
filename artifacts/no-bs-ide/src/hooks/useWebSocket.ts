import { useEffect, useRef, useCallback, useState } from "react";

export type WsMessage =
  | { type: "output"; data: string }
  | { type: "program_start" }
  | { type: "program_done"; exitCode: number }
  | { type: "error"; data: string };

interface UseWebSocketOptions {
  onMessage?: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        optionsRef.current.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WsMessage;
          optionsRef.current.onMessage?.(msg);
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
        optionsRef.current.onClose?.();
        setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const runCode = useCallback(
    (code: string) => {
      send({ type: "run", code });
    },
    [send]
  );

  const sendInput = useCallback(
    (data: string) => {
      send({ type: "input", data });
    },
    [send]
  );

  const sendCtrlC = useCallback(() => {
    send({ type: "ctrlc" });
  }, [send]);

  const resize = useCallback(
    (cols: number, rows: number) => {
      send({ type: "resize", cols, rows });
    },
    [send]
  );

  const installPackage = useCallback(
    (pkg: string) => {
      send({ type: "install", package: pkg });
    },
    [send]
  );

  return { connected, runCode, sendInput, sendCtrlC, resize, installPackage, send };
}
