import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDateAvailable } from "@/lib/reservations";
import { sendEmail } from "@/lib/email";
import { validateBooking } from "@/lib/booking-rules";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      startDate, 
      endDate, 
      lastName, 
      firstName, 
      address, 
      locality, 
      city, 
      email, 
      phone, 
      numberOfPeople, 
      message,
      isAdmin = false, // Default to false if not provided
      status = "pending" // Default to pending if not provided
    } = body;

    // Validate input
    if (!startDate || !endDate || !lastName || !firstName || !address || !locality || !city || !email || !phone || !numberOfPeople) {
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

    // Check if dates are available
    console.log("Checking if dates are available:", { start, end, isAdmin });
    const isAvailable = await isDateAvailable(start, end, isAdmin);
    console.log("Dates available:", isAvailable);
    
    if (!isAvailable) {
      console.log("Dates not available, rejecting reservation");
      return NextResponse.json(
        { error: "Selected dates are not available" },
        { status: 400 }
      );
    }

    // Get existing reservations to check for gaps
    const existingReservations = await db.reservation.findMany({
      where: {
        status: "approved",
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    });
    
    // Convert to the format expected by validateBooking
    const formattedReservations = existingReservations.map(res => ({
      id: res.id,
      startDate: new Date(res.startDate),
      endDate: new Date(res.endDate)
    }));
    
    // Only validate booking rules for non-admin reservations
    if (!isAdmin) {
      console.log("Validating booking rules for client reservation:", {
        start: start.toISOString(),
        end: end.toISOString(),
        existingReservations: formattedReservations.map(res => ({
          id: res.id,
          startDate: res.startDate.toISOString(),
          endDate: res.endDate.toISOString()
        }))
      });
      
      // Validate booking against rules
      const validation = validateBooking(start, end, formattedReservations);
      
      if (!validation.valid) {
        console.log("Booking validation failed:", validation.reason);
        return NextResponse.json(
          { error: validation.reason || "Reservation does not meet booking rules" },
          { status: 400 }
        );
      }
      
      console.log("Booking validation passed");
    } else {
      console.log("Admin reservation - bypassing booking rules validation");
    }

    // Create reservation
    const reservation = await db.reservation.create({
      data: {
        startDate: start,
        endDate: end,
        lastName,
        firstName,
        address,
        locality,
        city,
        email,
        phone,
        numberOfPeople,
        message,
        status, // Use the status from the request (defaults to "pending")
      },
    });

    // Send email notification to admin
    await sendEmail({
      to: "admin@example.com", // Replace with actual admin email
      subject: "Nouvelle demande de réservation",
      text: `
        Nouvelle demande de réservation de ${firstName} ${lastName}
        Email: ${email}
        Téléphone: ${phone}
        Adresse: ${address}, ${locality}, ${city}
        Nombre de personnes: ${numberOfPeople}
        Dates: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}
        ${message ? `Message: ${message}` : ""}
      `,
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    
    // Build the where clause
    const where: Record<string, unknown> = {};
    
    if (status && status !== "all") {
      where.status = status;
    }
    
    // Note: We would normally filter out deleted reservations here with { deleted: false }
    // but we're having issues with the Prisma client generation
    
    const reservations = await db.reservation.findMany({
      where,
      orderBy: {
        startDate: "asc",
      },
    });
    
    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
