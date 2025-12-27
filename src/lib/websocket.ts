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
    throw new Error("Failed to send WebSocket message");
  }
}
