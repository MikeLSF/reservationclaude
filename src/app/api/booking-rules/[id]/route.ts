import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refreshActiveRules } from "@/lib/booking-rules";

// Default rules for fallback
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

// GET /api/booking-rules/[id] - Get a specific booking rule
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    try {
      // @ts-expect-error - BookingRule model might not exist yet
      const bookingRule = await db.bookingRule.findUnique({
        where: { id },
      });

      if (!bookingRule) {
        // Check if it's one of our default rules
        const defaultRule = defaultRules.find(rule => rule.id === id);
        if (defaultRule) {
          return NextResponse.json(defaultRule);
        }
        
        return NextResponse.json(
          { error: "Booking rule not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(bookingRule);
    } catch (dbError) {
      console.error("Error accessing BookingRule model:", dbError);
      
      // Check if it's one of our default rules
      const defaultRule = defaultRules.find(rule => rule.id === id);
      if (defaultRule) {
        return NextResponse.json(defaultRule);
      }
      
      throw dbError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error fetching booking rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking rule" },
      { status: 500 }
    );
  }
}

// PATCH /api/booking-rules/[id] - Update a booking rule
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const data = await req.json();

    try {
      // Check if the booking rule exists
      // @ts-expect-error - BookingRule model might not exist yet
      const existingRule = await db.bookingRule.findUnique({
        where: { id },
      });

      if (!existingRule) {
        // Check if it's one of our default rules
        const defaultRuleIndex = defaultRules.findIndex(rule => rule.id === id);
        if (defaultRuleIndex >= 0) {
          // Create a mock updated rule based on the default rule
          const updatedRule = {
            ...defaultRules[defaultRuleIndex],
            name: data.name !== undefined ? data.name : defaultRules[defaultRuleIndex].name,
            isActive: data.isActive !== undefined ? data.isActive : defaultRules[defaultRuleIndex].isActive,
            isHighSeason: data.isHighSeason !== undefined ? data.isHighSeason : defaultRules[defaultRuleIndex].isHighSeason,
            highSeasonStartMonth: data.highSeasonStartMonth !== undefined ? data.highSeasonStartMonth : defaultRules[defaultRuleIndex].highSeasonStartMonth,
            highSeasonEndMonth: data.highSeasonEndMonth !== undefined ? data.highSeasonEndMonth : defaultRules[defaultRuleIndex].highSeasonEndMonth,
            minimumStayDays: data.minimumStayDays !== undefined ? data.minimumStayDays : defaultRules[defaultRuleIndex].minimumStayDays,
            enforceGapBetweenBookings: data.enforceGapBetweenBookings !== undefined ? data.enforceGapBetweenBookings : defaultRules[defaultRuleIndex].enforceGapBetweenBookings,
            minimumGapDays: data.minimumGapDays !== undefined ? data.minimumGapDays : defaultRules[defaultRuleIndex].minimumGapDays,
            updatedAt: new Date().toISOString()
          };
          
          // Update the default rule in our array
          defaultRules[defaultRuleIndex] = updatedRule;
          
      // Refresh the active rules cache
      await refreshActiveRules();
      
      return NextResponse.json(updatedRule);
        }
        
        return NextResponse.json(
          { error: "Booking rule not found" },
          { status: 404 }
        );
      }

      // Update the booking rule
      // @ts-expect-error - BookingRule model might not exist yet
      const updatedRule = await db.bookingRule.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
          isHighSeason: data.isHighSeason !== undefined ? data.isHighSeason : undefined,
          highSeasonStartMonth: data.highSeasonStartMonth !== undefined ? data.highSeasonStartMonth : undefined,
          highSeasonEndMonth: data.highSeasonEndMonth !== undefined ? data.highSeasonEndMonth : undefined,
          minimumStayDays: data.minimumStayDays !== undefined ? data.minimumStayDays : undefined,
          enforceGapBetweenBookings: data.enforceGapBetweenBookings !== undefined ? data.enforceGapBetweenBookings : undefined,
          minimumGapDays: data.minimumGapDays !== undefined ? data.minimumGapDays : undefined,
        },
      });

      // Refresh the active rules cache
      await refreshActiveRules();
      
      return NextResponse.json(updatedRule);
    } catch (dbError) {
      console.error("Error accessing BookingRule model:", dbError);
      
      // Check if it's one of our default rules
      const defaultRuleIndex = defaultRules.findIndex(rule => rule.id === id);
      if (defaultRuleIndex >= 0) {
        // Create a mock updated rule based on the default rule
        const updatedRule = {
          ...defaultRules[defaultRuleIndex],
          name: data.name !== undefined ? data.name : defaultRules[defaultRuleIndex].name,
          isActive: data.isActive !== undefined ? data.isActive : defaultRules[defaultRuleIndex].isActive,
          isHighSeason: data.isHighSeason !== undefined ? data.isHighSeason : defaultRules[defaultRuleIndex].isHighSeason,
          highSeasonStartMonth: data.highSeasonStartMonth !== undefined ? data.highSeasonStartMonth : defaultRules[defaultRuleIndex].highSeasonStartMonth,
          highSeasonEndMonth: data.highSeasonEndMonth !== undefined ? data.highSeasonEndMonth : defaultRules[defaultRuleIndex].highSeasonEndMonth,
          minimumStayDays: data.minimumStayDays !== undefined ? data.minimumStayDays : defaultRules[defaultRuleIndex].minimumStayDays,
          enforceGapBetweenBookings: data.enforceGapBetweenBookings !== undefined ? data.enforceGapBetweenBookings : defaultRules[defaultRuleIndex].enforceGapBetweenBookings,
          minimumGapDays: data.minimumGapDays !== undefined ? data.minimumGapDays : defaultRules[defaultRuleIndex].minimumGapDays,
          updatedAt: new Date().toISOString()
        };
        
        // Update the default rule in our array
        defaultRules[defaultRuleIndex] = updatedRule;
        
        return NextResponse.json(updatedRule);
      }
      
      throw dbError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error updating booking rule:", error);
    return NextResponse.json(
      { error: "Failed to update booking rule" },
      { status: 500 }
    );
  }
}

// DELETE /api/booking-rules/[id] - Delete a booking rule
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    try {
      // Check if the booking rule exists
      // @ts-expect-error - BookingRule model might not exist yet
      const existingRule = await db.bookingRule.findUnique({
        where: { id },
      });

      if (!existingRule) {
        // Check if it's one of our default rules
        const defaultRuleIndex = defaultRules.findIndex(rule => rule.id === id);
        if (defaultRuleIndex >= 0) {
          // For default rules, we'll just mark them as inactive instead of deleting
          defaultRules[defaultRuleIndex] = {
            ...defaultRules[defaultRuleIndex],
            isActive: false,
            updatedAt: new Date().toISOString()
          };
          
          return NextResponse.json({ success: true });
        }
        
        return NextResponse.json(
          { error: "Booking rule not found" },
          { status: 404 }
        );
      }

      // Delete the booking rule
      // @ts-expect-error - BookingRule model might not exist yet
      await db.bookingRule.delete({
        where: { id },
      });

      // Refresh the active rules cache
      await refreshActiveRules();
      
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("Error accessing BookingRule model:", dbError);
      
      // Check if it's one of our default rules
      const defaultRuleIndex = defaultRules.findIndex(rule => rule.id === id);
      if (defaultRuleIndex >= 0) {
        // For default rules, we'll just mark them as inactive instead of deleting
        defaultRules[defaultRuleIndex] = {
          ...defaultRules[defaultRuleIndex],
          isActive: false,
          updatedAt: new Date().toISOString()
        };
        
        return NextResponse.json({ success: true });
      }
      
      throw dbError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error("Error deleting booking rule:", error);
    return NextResponse.json(
      { error: "Failed to delete booking rule" },
      { status: 500 }
    );
  }
}
