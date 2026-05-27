"use client";

import { io, type Socket } from "socket.io-client";

import { WS_URL } from "./env";

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true
    });
  }

  return socket;
}
