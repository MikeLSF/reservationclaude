import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refreshActiveRules } from "@/lib/booking-rules";

export async function POST(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Refresh the active rules
    const refreshedRules = await refreshActiveRules();
    
    return NextResponse.json({
      success: true,
      message: "Booking rules refreshed successfully",
      rules: refreshedRules
    });
  } catch (error) {
    console.error("Error refreshing booking rules:", error);
    return NextResponse.json(
      { error: "Failed to refresh booking rules" },
      { status: 500 }
    );
  }
}
