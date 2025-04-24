import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAvailableDates } from "@/lib/reservations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    
    if (!yearParam || !monthParam) {
      return NextResponse.json(
        { error: "Year and month parameters are required" },
        { status: 400 }
      );
    }
    
    const year = parseInt(yearParam);
    const month = parseInt(monthParam) - 1; // JavaScript months are 0-indexed
    
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return NextResponse.json(
        { error: "Invalid year or month" },
        { status: 400 }
      );
    }
    
    // Get all available dates for the month
    const availableDates = await getAvailableDates(year, month);
    
    // Get all approved reservations for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const reservations = await db.reservation.findMany({
      where: {
        status: "approved",
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    });
    
    // Get all blocked dates for the month
    const blockedDates = await db.blockedDate.findMany({
      where: {
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
      },
    });
    
    return NextResponse.json({
      availableDates,
      reservations,
      blockedDates,
    });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}
