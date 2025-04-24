import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const blockedDate = await db.blockedDate.findUnique({
      where: { id },
    });

    if (!blockedDate) {
      return NextResponse.json(
        { error: "Blocked date not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(blockedDate);
  } catch (error) {
    console.error("Error fetching blocked date:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked date" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await req.json();
    const { startDate, endDate, reason } = body;

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Get the blocked date before updating
    const existingBlockedDate = await db.blockedDate.findUnique({
      where: { id },
    });

    if (!existingBlockedDate) {
      return NextResponse.json(
        { error: "Blocked date not found" },
        { status: 404 }
      );
    }

    // Update the blocked date
    const updatedBlockedDate = await db.blockedDate.update({
      where: { id },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        reason,
      },
    });

    return NextResponse.json(updatedBlockedDate);
  } catch (error) {
    console.error("Error updating blocked date:", error);
    return NextResponse.json(
      { error: "Failed to update blocked date" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const id = params.id;

    // Get the blocked date before deleting
    const existingBlockedDate = await db.blockedDate.findUnique({
      where: { id },
    });

    if (!existingBlockedDate) {
      return NextResponse.json(
        { error: "Blocked date not found" },
        { status: 404 }
      );
    }

    // Delete the blocked date
    await db.blockedDate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blocked date:", error);
    return NextResponse.json(
      { error: "Failed to delete blocked date" },
      { status: 500 }
    );
  }
}
