import { NextResponse } from "next/server";
import { refreshActiveRules } from "@/lib/booking-rules";

export async function POST() {
  try {
    await refreshActiveRules();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refreshing booking rules:", error);
    return NextResponse.json(
      { error: "Failed to refresh booking rules" },
      { status: 500 }
    );
  }
}
