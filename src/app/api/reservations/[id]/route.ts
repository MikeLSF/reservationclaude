import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { Reservation } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const reservation = await db.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservation" },
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
    const { status } = body;

    // Validate status
    if (status && !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get the reservation before updating
    const existingReservation = await db.reservation.findUnique({
      where: { id },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // If status is being changed to "approved", check for overlapping approved reservations
    if (status === "approved" && existingReservation.status !== "approved") {
      // Check for existing approved reservations that overlap with the requested dates
      const overlappingReservations = await db.reservation.findMany({
        where: {
          id: { not: id }, // Exclude the current reservation
          status: "approved",
          OR: [
            // Case 1: startDate is between an existing reservation's start and end dates
            {
              startDate: { lte: existingReservation.startDate },
              endDate: { gte: existingReservation.startDate },
            },
            // Case 2: endDate is between an existing reservation's start and end dates
            {
              startDate: { lte: existingReservation.endDate },
              endDate: { gte: existingReservation.endDate },
            },
            // Case 3: startDate and endDate completely encompass an existing reservation
            {
              startDate: { gte: existingReservation.startDate },
              endDate: { lte: existingReservation.endDate },
            },
          ],
        },
      });

      if (overlappingReservations.length > 0) {
        return NextResponse.json(
          { error: "Impossible d'accepter cette demande : les dates sont déjà réservées." },
          { status: 400 }
        );
      }
    }

    // Update the reservation
    const updatedReservation = await db.reservation.update({
      where: { id },
      data: { status },
    });

    // Send email notification to guest
    if (status && status !== existingReservation.status) {
      const { email, firstName, lastName } = existingReservation as unknown as Reservation;

      await sendEmail({
        to: email,
        subject: `Réservation ${status === "approved" ? "Approuvée" : "Refusée"}`,
        text: `
          Cher/Chère ${firstName} ${lastName},
          
          Votre demande de réservation pour la période du ${existingReservation.startDate.toLocaleDateString()} au ${existingReservation.endDate.toLocaleDateString()} a été ${status === "approved" ? "approuvée" : "refusée"}.
          
          ${status === "approved" ? "Nous sommes impatients de vous accueillir!" : "Nous nous excusons pour tout inconvénient."}
          
          Cordialement,
          L'équipe de location
        `,
      });
    }

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      { error: "Failed to update reservation" },
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

    // Get the reservation before deleting
    const existingReservation = await db.reservation.findUnique({
      where: { id },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Delete the reservation
    // Note: We would normally mark it as deleted with { deleted: true }
    // but we're having issues with the Prisma client generation
    await db.reservation.delete({
      where: { id },
    });

    // Send email notification to guest
    const { email, firstName, lastName } = existingReservation as unknown as Reservation;
    // Ensure we have the required fields

    await sendEmail({
      to: email,
      subject: "Réservation Annulée",
      text: `
        Cher/Chère ${firstName} ${lastName},
        
        Votre réservation pour la période du ${existingReservation.startDate.toLocaleDateString()} au ${existingReservation.endDate.toLocaleDateString()} a été annulée.
        
        Si vous avez des questions, n'hésitez pas à nous contacter.
        
        Cordialement,
        L'équipe de location
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { error: "Failed to delete reservation" },
      { status: 500 }
    );
  }
}
