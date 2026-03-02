"use client";

import { AuthProvider } from "../lib/auth";
import { SocketProvider } from "../lib/socket";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>{children}</SocketProvider>
    </AuthProvider>
  );
}
