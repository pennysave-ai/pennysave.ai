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
  const token = generateWebsocketToken(userId);
  try {
    await fetch(
      `https://${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?token=${token}`,
      {
        method: "POST",
        body: JSON.stringify(message),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("WebSocket message sent:", message, userId);
  } catch (error) {
    console.error("Error sending WebSocket message:", error);
    throw new Error("Failed to send WebSocket message");
  }
}
