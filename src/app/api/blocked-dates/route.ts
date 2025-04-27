import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { startDate, endDate, reason } = body;

    // Validate input
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create blocked date
    const blockedDate = await db.blockedDate.create({
      data: {
        startDate: start,
        endDate: end,
        reason,
      },
    });

    return NextResponse.json(blockedDate, { status: 201 });
  } catch (error) {
    console.error("Error creating blocked date:", error);
    return NextResponse.json(
      { error: "Failed to create blocked date" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const blockedDates = await db.blockedDate.findMany({
      orderBy: {
        startDate: "asc",
      },
    });
    
    return NextResponse.json(blockedDates);
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked dates" },
      { status: 500 }
    );
  }
}
