import os from "os";
import { WebSocketServer, type WebSocket } from "ws";
import { parse } from "url";
import { createServer } from "http";

const PROTOCOL = process.env.NODE_ENV === "production" ? "wss" : "ws";
const HOST = os.hostname();
const PORT = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || 8082;

let serverInstance: WebSocketServer | null = null;

const createWebSocketServer = () => {
  if (serverInstance) {
    console.log("WebSocket server is already running.");
    return serverInstance;
  }

  const server = createServer();
  const wss = new WebSocketServer({ server });

  // Map of connected clients
  const clients = new Map<WebSocket, string>();

  wss.on("connection", (ws, req) => {
    const parameters = parse(req.url!, true);
    const userId = parameters.query.id as string;

    if (userId) {
      clients.set(ws, userId);
      console.log(`Client connected: ${userId}`);
    } else {
      console.log("Client connected without userId");
    }

    ws.on("message", (message) => {
      console.log("Received:", message.toString());
      broadcast(message);
    });

    ws.on("close", () => {
      console.log(`Client disconnected ${userId}`);
      clients.delete(ws);
    });
  });

  interface BroadcastData {
    [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const broadcast = (data: BroadcastData): void => {
    const incoming = JSON.parse(data.toString());
    const recipient = incoming.recipient;
    console.log("Broadcasting to recipient", recipient);
    wss.clients.forEach((client) => {
      const clientId = clients.get(client);
      if (client.readyState === client.OPEN && clientId === recipient) {
        client.send(
          JSON.stringify({
            type: incoming.type,
          })
        );
      }
    });
  };
  try {
    server.listen(PORT, () => {
      console.log(
        `WebSocket server is running on ${PROTOCOL}://${HOST}:${PORT}`
      );
    });
  } catch (error) {
    console.error("Error in WebSocket server", error);
  }

  // Handle server shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
    });
  });

  serverInstance = wss;
  return wss;
};

export const wss = createWebSocketServer();
