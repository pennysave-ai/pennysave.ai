import { useMutation } from "@tanstack/react-query";

export const useFetchWebSocketToken = () => {
  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch("/api/websocket-token", {
        method: "POST",
        body: JSON.stringify({ userId }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch WebSocket token");
      }
      return data.token;
    },
  });
  return mutation;
};
