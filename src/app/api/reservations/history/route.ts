import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all reservations, including deleted ones (no filter on deleted field)
    const reservations = await db.reservation.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching reservation history:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservation history" },
      { status: 500 }
    );
  }
}
