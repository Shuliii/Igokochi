import {WebSocketServer} from "ws";
import jwt from "jsonwebtoken";
import {onOrderEvent} from "./pubsub.js";

const HEARTBEAT_INTERVAL_MS = 25 * 1000;

export function attachWebSocketServer(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/api/ws",
    verifyClient: (info, done) => {
      const url = new URL(info.req.url, "http://localhost");
      const token = url.searchParams.get("token");

      if (!token) return done(false, 401, "Missing token");

      try {
        jwt.verify(token, process.env.JWT_SECRET);
        return done(true);
      } catch {
        return done(false, 401, "Invalid or expired token");
      }
    },
  });

  const clients = new Set();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  // Drops connections that stopped answering pings (e.g. a laptop that went
  // to sleep) and keeps the rest alive through any proxy idle-timeout.
  const heartbeat = setInterval(() => {
    for (const ws of clients) {
      if (!ws.isAlive) {
        ws.terminate();
        clients.delete(ws);
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => clearInterval(heartbeat));

  onOrderEvent((event) => {
    const payload = JSON.stringify(event);
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
  });

  return wss;
}
