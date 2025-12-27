import { generateWebsocketToken } from "@/data/websocket-token";
import { BroadcastType } from "@/wstypes";

type WebSocketMessage = {
  type: BroadcastType;
  recipients: string[];
  data?: {
    [key: string]: unknown;
  };
};

export async function sendWebSocketMessage(
  message: WebSocketMessage,
  userId: string
) {
  const token = generateWebsocketToken(userId, "websocket-service");
  try {
    console.log("Sending WebSocket message:", message, userId);
    console.log("Using token:", token);
    console.log(
      "WebSocket URL:",
      `https://${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/api/broadcast`
    );
    await fetch(
      `https://${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/api/broadcast`,
      {
        method: "POST",
        body: JSON.stringify(message),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("WebSocket message sent:", message, userId);
  } catch (error) {
    console.error("Error sending WebSocket message:", error);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("WebSocket timeout: Request took longer than 5 seconds");
      } else if (error.message.includes("ETIMEDOUT")) {
        console.error("WebSocket timeout: Network connection timeout");
      } else if (error.message.includes("ECONNRESET")) {
        console.error("WebSocket error: Connection reset by server");
      } else {
        console.error("WebSocket error:", error.message);
      }
    }
    throw error;
    // throw new Error("Failed to send WebSocket message");
  }
}
