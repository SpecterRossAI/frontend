import { useState, useEffect, useCallback, useRef } from "react";

export type WebSocketReadyState = "connecting" | "open" | "closing" | "closed" | "uninstantiated";

export interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  lastMessage: unknown;
  sendMessage: (data: string | ArrayBufferLike | Blob) => void;
  sendJsonMessage: (data: object) => void;
  readyState: WebSocketReadyState;
  connect: () => void;
  disconnect: () => void;
}

const READY_STATE_MAP: Record<number, WebSocketReadyState> = {
  [WebSocket.CONNECTING]: "connecting",
  [WebSocket.OPEN]: "open",
  [WebSocket.CLOSING]: "closing",
  [WebSocket.CLOSED]: "closed",
};

export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
  } = options;

  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const [readyState, setReadyState] = useState<WebSocketReadyState>("uninstantiated");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const urlRef = useRef(url);

  const connect = useCallback(() => {
    if (!url) return;
    urlRef.current = url;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setReadyState("open");
      reconnectCountRef.current = 0;
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        setLastMessage(data);
        onMessage?.(data);
      } catch {
        setLastMessage(event.data);
        onMessage?.(event.data);
      }
    };

    ws.onclose = () => {
      setReadyState("closed");
      wsRef.current = null;
      onClose?.();

      if (
        reconnect &&
        urlRef.current &&
        reconnectCountRef.current < reconnectAttempts
      ) {
        reconnectCountRef.current += 1;
        setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (event) => {
      onError?.(event);
    };

    setReadyState("connecting");
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval, reconnectAttempts]);

  const disconnect = useCallback(() => {
    reconnectCountRef.current = reconnectAttempts;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setReadyState("closed");
  }, []);

  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const sendJsonMessage = useCallback(
    (data: object) => {
      sendMessage(JSON.stringify(data));
    },
    [sendMessage]
  );

  useEffect(() => {
    if (url) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [url]);

  useEffect(() => {
    if (wsRef.current) {
      const ws = wsRef.current;
      const handler = () => setReadyState(READY_STATE_MAP[ws.readyState] ?? "closed");
      ws.addEventListener("open", handler);
      ws.addEventListener("close", handler);
      return () => {
        ws.removeEventListener("open", handler);
        ws.removeEventListener("close", handler);
      };
    }
  }, [readyState]);

  return {
    lastMessage,
    sendMessage,
    sendJsonMessage,
    readyState,
    connect,
    disconnect,
  };
}
