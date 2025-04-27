import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/apartment-info - Get apartment info
export async function GET() {
  try {
    // Try to get the first apartment info record
    let apartmentInfo;
    
    try {
      // @ts-expect-error - ApartmentInfo model might not exist yet
      apartmentInfo = await db.apartmentInfo.findFirst();
    } catch (error) {
      console.error("Error finding apartment info:", error);
      // Return default values if the model doesn't exist yet
      return NextResponse.json({
        id: "default",
        title: "À propos de notre appartement",
        description: "Notre bel appartement est situé dans un emplacement privilégié, offrant confort et commodité pour votre séjour. Que vous visitiez pour affaires ou pour le plaisir, notre appartement offre toutes les commodités dont vous avez besoin.",
        rules: "Veuillez noter les règles de réservation suivantes :\n- Entre juillet et septembre, la durée minimum de séjour est de 7 jours\n- Il ne peut pas y avoir de jours vides entre deux réservations\n- Certaines dates peuvent être bloquées pour maintenance ou autres raisons",
        amenities: "Cuisine entièrement équipée\nWiFi haut débit\nClimatisation\nMachine à laver\nTV avec services de streaming\nLits confortables\nDraps et serviettes propres\nAssistance 24h/24 et 7j/7",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // If no record exists, create a default one
    if (!apartmentInfo) {
      try {
        // @ts-expect-error - ApartmentInfo model might not exist yet
        apartmentInfo = await db.apartmentInfo.create({
          data: {}  // Use default values from schema
        });
      } catch (error) {
        console.error("Error creating apartment info:", error);
        // Return default values if creation fails
        return NextResponse.json({
          id: "default",
          title: "À propos de notre appartement",
          description: "Notre bel appartement est situé dans un emplacement privilégié, offrant confort et commodité pour votre séjour. Que vous visitiez pour affaires ou pour le plaisir, notre appartement offre toutes les commodités dont vous avez besoin.",
          rules: "Veuillez noter les règles de réservation suivantes :\n- Entre juillet et septembre, la durée minimum de séjour est de 7 jours\n- Il ne peut pas y avoir de jours vides entre deux réservations\n- Certaines dates peuvent être bloquées pour maintenance ou autres raisons",
          amenities: "Cuisine entièrement équipée\nWiFi haut débit\nClimatisation\nMachine à laver\nTV avec services de streaming\nLits confortables\nDraps et serviettes propres\nAssistance 24h/24 et 7j/7",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return NextResponse.json(apartmentInfo);
  } catch (error) {
    console.error("Error fetching apartment info:", error);
    return NextResponse.json(
      { error: "Failed to fetch apartment info" },
      { status: 500 }
    );
  }
}

// PATCH /api/apartment-info - Update apartment info
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // Get the first apartment info record
    let apartmentInfo;
    
    try {
      // @ts-expect-error - ApartmentInfo model might not exist yet
      apartmentInfo = await db.apartmentInfo.findFirst();
    } catch (error) {
      console.error("Error finding apartment info:", error);
      return NextResponse.json(
        { error: "Failed to find apartment info" },
        { status: 500 }
      );
    }

    // If no record exists, create a new one with the provided data
    if (!apartmentInfo) {
      try {
        // @ts-expect-error - ApartmentInfo model might not exist yet
        apartmentInfo = await db.apartmentInfo.create({
          data: {
            title: data.title,
            description: data.description,
            rules: data.rules,
            amenities: data.amenities
          }
        });
      } catch (error) {
        console.error("Error creating apartment info:", error);
        return NextResponse.json(
          { error: "Failed to create apartment info" },
          { status: 500 }
        );
      }
    } else {
      // Update the existing record
      try {
        // @ts-expect-error - ApartmentInfo model might not exist yet
        apartmentInfo = await db.apartmentInfo.update({
          where: { id: apartmentInfo.id },
          data: {
            title: data.title,
            description: data.description,
            rules: data.rules,
            amenities: data.amenities
          }
        });
      } catch (error) {
        console.error("Error updating apartment info:", error);
        return NextResponse.json(
          { error: "Failed to update apartment info" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(apartmentInfo);
  } catch (error) {
    console.error("Error updating apartment info:", error);
    return NextResponse.json(
      { error: "Failed to update apartment info" },
      { status: 500 }
    );
  }
}
