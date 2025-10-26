import jwt from "jsonwebtoken";

const WEBSOCKET_JWT_SECRET = process.env.WEBSOCKET_JWT_SECRET;
const EXPIRATION_TIME = 60 * 60; // 1 hour in seconds

export function generateWebsocketToken(
  userId: string,
  aud: string = "web"
): string {
  if (!WEBSOCKET_JWT_SECRET) {
    throw new Error("WebSocket JWT secret not configured");
  }

  const token = jwt.sign(
    {
      sub: userId,
      aud,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + EXPIRATION_TIME,
    },
    WEBSOCKET_JWT_SECRET
  );
  return token;
}
