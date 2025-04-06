"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./auth-context";

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
