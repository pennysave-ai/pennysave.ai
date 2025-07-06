"use client";

import { useEffect, useRef, useState } from "react";
import { BroadcastType } from "@/wstypes";
import { useGetEntities } from "@/features/entities/hooks";

interface WebSocketClientProps {
  userId: string | null;
}

const PROTOCOL = process.env.NODE_ENV === "production" ? "wss" : "ws";

export default function WebSocketClient({ userId }: WebSocketClientProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const { refetch: updateEntities } = useGetEntities();

  const connectWebSocket = () => {
    const socket = new WebSocket(
      `${PROTOCOL}://${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?id=${userId}`
    );

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setReconnectAttempts(0);
    };

    socket.onmessage = (event) => {
      console.log("Received message on a client:", event.data);
      const data = JSON.parse(event.data);
      switch (data.type) {
        case BroadcastType.BANK_DATA_UPDATED:
          updateEntities();
          break;
        case BroadcastType.SUBSCRIPTION_CREATED:
        case BroadcastType.SUBSCRIPTION_DELETED:
        case BroadcastType.SUBSCRIPTION_UPDATED:
          // This is a hack to update the session
          document.dispatchEvent(new Event("visibilitychange"));
          break;
        default:
          break;
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      handleReconnect();
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      socket.close();
    };

    socketRef.current = socket;
  };

  const handleReconnect = () => {
    if (reconnectAttempts < 5) {
      const timeout = Math.min(1000 * 2 ** reconnectAttempts, 30000); // Exponential backoff
      setTimeout(() => {
        setReconnectAttempts((prev) => prev + 1);
        connectWebSocket();
      }, timeout);
    } else {
      console.error("Max reconnect attempts reached");
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
