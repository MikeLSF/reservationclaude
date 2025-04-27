import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/booking-rules/active - Get active booking rules
export async function GET() {
  try {
    // Use a try-catch block to handle the case where the BookingRule model doesn't exist yet
    try {
      // @ts-expect-error - BookingRule model might not exist yet
      const bookingRules = await db.bookingRule.findMany({
        where: {
          isActive: true,
        },
      });

      return NextResponse.json(bookingRules);
    } catch (dbError) {
      console.error("Error accessing BookingRule model:", dbError);
      
      // Return default rules if the model doesn't exist
      const defaultRules = [
        {
          id: "high-season-default",
          name: "Règle Haute Saison (Par défaut)",
          isActive: true,
          isHighSeason: true,
          highSeasonStartMonth: 7, // July
          highSeasonEndMonth: 9, // September
          minimumStayDays: 7,
          enforceGapBetweenBookings: true,
          minimumGapDays: 7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "low-season-default",
          name: "Règle Basse Saison (Par défaut)",
          isActive: true,
          isHighSeason: false,
          highSeasonStartMonth: null,
          highSeasonEndMonth: null,
          minimumStayDays: 1,
          enforceGapBetweenBookings: false,
          minimumGapDays: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return NextResponse.json(defaultRules);
    }
  } catch (error) {
    console.error("Error fetching active booking rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch active booking rules" },
      { status: 500 }
    );
  }
}
