"use client";

import { useEffect } from "react";
import { initBookingRules } from "@/lib/booking-rules";

export function BookingRulesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize booking rules when the app loads
    initBookingRules().catch((error) => {
      console.error("Failed to initialize booking rules:", error);
    });
  }, []);

  return <>{children}</>;
}
