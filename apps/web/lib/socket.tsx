"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  const instance = useMemo(() => {
    if (!token) return null;
    return io(SOCKET_URL, { autoConnect: false, transports: ["websocket"] });
  }, [token]);

  useEffect(() => {
    if (!instance || !token) return;
    instance.connect();
    instance.emit("authenticate", { token });
    setSocket(instance);
    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, [instance, token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
