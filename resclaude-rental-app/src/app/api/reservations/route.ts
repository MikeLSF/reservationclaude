import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDateAvailable } from "@/lib/reservations";
import { sendEmail } from "@/lib/email";

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
      message 
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
    const isAvailable = await isDateAvailable(start, end);
    if (!isAvailable) {
      return NextResponse.json(
        { error: "Selected dates are not available" },
        { status: 400 }
      );
    }

    // Check minimum stay requirement (7 days in July-September)
    const startMonth = start.getMonth();
    if (startMonth >= 6 && startMonth <= 8) { // July (6) to September (8)
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        return NextResponse.json(
          { error: "Minimum stay during July-September is 7 days" },
          { status: 400 }
        );
      }
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
        status: "pending",
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
    
    const where = status && status !== "all" ? { status } : {};
    
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
