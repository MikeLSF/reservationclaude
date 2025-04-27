"use client";

import { ReactNode } from "react";
import { ToastProvider } from "./ui/Toast";

export function AdminToastProvider({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
