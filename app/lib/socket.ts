// lib/socket.ts
// A single shared Socket.IO connection for the whole app. Import
// `getSocket()` from any client component to send/receive real-time
// events (issue moves, new comments, notifications).
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:5000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket() can only be called in the browser.");
  }

  if (!socket) {
    const token = localStorage.getItem("token") ?? "";
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}

/** Call after login/logout so the next getSocket() picks up the fresh token. */
export function resetSocket() {
  socket?.disconnect();
  socket = null;
}
