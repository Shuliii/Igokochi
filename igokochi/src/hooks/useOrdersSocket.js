import {useEffect, useRef} from "react";
import {API_BASE_URL} from "../config";

const LS_TOKEN = "igokochi_token";
const MAX_BACKOFF_MS = 30000;

function toWebSocketUrl(apiBaseUrl) {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = url.pathname.replace(/\/$/, "") + "/ws";
  url.search = "";
  return url;
}

// Pushes live "order:new" events from the backend so the admin board updates
// immediately instead of waiting for the next poll. Reconnects with backoff
// if the connection drops — the caller's polling fallback covers the gap.
export function useOrdersSocket(onOrderEvent) {
  const onOrderEventRef = useRef(onOrderEvent);
  onOrderEventRef.current = onOrderEvent;

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let backoffMs = 1000;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      const token = localStorage.getItem(LS_TOKEN);
      if (!token) return;

      const wsUrl = toWebSocketUrl(API_BASE_URL);
      wsUrl.searchParams.set("token", token);

      socket = new WebSocket(wsUrl.toString());

      socket.onopen = () => {
        backoffMs = 1000; // reset backoff once a connection actually succeeds
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onOrderEventRef.current?.(data);
        } catch {
          // ignore malformed message
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, backoffMs);
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);
}
