import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "./useWebSocket";

export interface TranscriptMessage {
  role: string;
  text: string;
}

export interface UseLiveTranscriptionOptions {
  caseId: string | undefined;
  /** Base URL for WebSocket (e.g. http://localhost:3001 or use window.location.origin for dev proxy) */
  wsBaseUrl?: string;
  /** Fallback messages when WebSocket is not connected (e.g. from ElevenLabs onMessage) */
  fallbackMessages?: TranscriptMessage[];
}

function getWsBaseUrl(base?: string): string {
  if (base) return base.replace(/^http/, "ws");
  if (typeof window !== "undefined") return window.location.origin.replace(/^http/, "ws");
  return "ws://localhost:3001";
}

export function useLiveTranscription({
  caseId,
  wsBaseUrl,
  fallbackMessages = [],
}: UseLiveTranscriptionOptions) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

  const base = getWsBaseUrl(wsBaseUrl);
  const wsUrl =
    caseId
      ? `${base}/ws/transcription?case_id=${encodeURIComponent(caseId)}`
      : null;

  const handleWsMessage = useCallback((data: unknown) => {
    const payload = data as { type?: string; messages?: TranscriptMessage[] };
    if (payload?.type === "transcript" && Array.isArray(payload.messages)) {
      setMessages((prev) => [...prev, ...payload.messages]);
    }
    if (payload?.type === "clear") {
      setMessages([]);
    }
  }, []);

  const { readyState } = useWebSocket(wsUrl, {
    onMessage: handleWsMessage,
    reconnect: true,
    reconnectAttempts: 10,
  });

  const isConnected = readyState === "open";

  useEffect(() => {
    if (isConnected) {
      setMessages([]);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected && fallbackMessages.length > 0) {
      setMessages(fallbackMessages);
    }
  }, [isConnected, fallbackMessages]);

  return {
    messages: isConnected ? messages : fallbackMessages,
    isConnected,
    readyState,
  };
}
