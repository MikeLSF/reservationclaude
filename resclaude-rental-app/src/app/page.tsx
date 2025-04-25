"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/Calendar";
import { ReservationForm, ReservationFormData } from "@/components/ReservationForm";

interface ApartmentInfo {
  id: string;
  title: string;
  description: string;
  rules: string;
  amenities: string;
  createdAt: string;
  updatedAt: string;
}

interface Reservation {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
}

interface BlockedDate {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [calendarData, setCalendarData] = useState({
    availableDates: [] as Date[],
    reservations: [] as Reservation[],
    blockedDates: [] as BlockedDate[],
  });
  const [apartmentInfo, setApartmentInfo] = useState<ApartmentInfo | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date());

  const fetchCalendarData = async (date: Date) => {
    try {
      setIsLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed

      console.log(`Fetching calendar data for ${year}-${month}`);
      const response = await fetch(`/api/calendar?year=${year}&month=${month}`);
      if (!response.ok) {
        throw new Error("Failed to fetch calendar data");
      }

      const data = await response.json();
      console.log("Calendar API response:", data);
      
      setCalendarData({
        availableDates: data.availableDates.map((date: string) => new Date(date)),
        reservations: data.reservations,
        blockedDates: data.blockedDates,
      });
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setErrorMessage("Failed to load calendar data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApartmentInfo = async () => {
    try {
      const response = await fetch("/api/apartment-info");
      if (!response.ok) {
        throw new Error("Failed to fetch apartment info");
      }

      const data = await response.json();
      setApartmentInfo(data);
    } catch (error) {
      console.error("Error fetching apartment info:", error);
    }
  };

  useEffect(() => {
    // Fetch calendar data for the current view month
    fetchCalendarData(currentViewMonth);
    
    // Fetch apartment info
    fetchApartmentInfo();
  }, [currentViewMonth]);

  const handleMonthChange = (date: Date) => {
    setCurrentViewMonth(date);
  };

  const handleDateClick = (date: Date) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // If no start date is selected or both dates are selected, set the start date
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else {
      // If only start date is selected, set the end date
      if (date < selectedStartDate) {
        // If clicked date is before start date, swap them
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
    }
  };

  const handleReservationSubmit = async (data: ReservationFormData) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit reservation");
      }

      setSuccessMessage(
        "Votre demande de réservation a été soumise avec succès. Nous vous contacterons bientôt."
      );
      // Reset form
      setSelectedStartDate(null);
      setSelectedEndDate(null);
    } catch (error: unknown) {
      console.error("Error submitting reservation:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit reservation. Please try again.";
      setErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Location d&apos;Appartement
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          Vérifiez la disponibilité et réservez votre séjour
        </p>
      </div>

      {successMessage && (
        <div className="mb-8 bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Vérifier la disponibilité</h2>
          <Calendar
            availableDates={calendarData.availableDates}
            reservations={calendarData.reservations}
            blockedDates={calendarData.blockedDates}
            onDateClick={handleDateClick}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            onMonthChange={handleMonthChange}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Demande de réservation</h2>
          <ReservationForm
            onSubmit={handleReservationSubmit}
            isLoading={isLoading}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
          />
        </div>
      </div>

      <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          {apartmentInfo?.title || "À propos de notre appartement"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-gray-700 mb-4 whitespace-pre-line">
              {apartmentInfo?.description || 
                "Notre bel appartement est situé dans un emplacement privilégié, offrant confort et commodité pour votre séjour. Que vous visitiez pour affaires ou pour le plaisir, notre appartement offre toutes les commodités dont vous avez besoin."}
            </div>
            <p className="text-gray-700 mb-4">
              Veuillez noter les règles de réservation suivantes :
            </p>
            <div className="text-gray-700 space-y-2 whitespace-pre-line pl-5">
              {apartmentInfo?.rules ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: apartmentInfo.rules
                    .split('\n')
                    .map(line => line.trim().startsWith('-') ? 
                      `<li>${line.substring(1).trim()}</li>` : 
                      line)
                    .join('\n')
                    .replace(/^(?!<li>)(.+)$/gm, '$1<br/>')
                }} />
              ) : (
                <ul className="list-disc">
                  <li>Entre juillet et septembre, la durée minimum de séjour est de 7 jours</li>
                  <li>Il ne peut pas y avoir de jours vides entre deux réservations</li>
                  <li>Certaines dates peuvent être bloquées pour maintenance ou autres raisons</li>
                </ul>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-900">Équipements</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              {apartmentInfo?.amenities ? 
                apartmentInfo.amenities.split('\n').map((amenity, index) => (
                  <li key={index}>{amenity.trim()}</li>
                )) : (
                <>
                  <li>Cuisine entièrement équipée</li>
                  <li>WiFi haut débit</li>
                  <li>Climatisation</li>
                  <li>Machine à laver</li>
                  <li>TV avec services de streaming</li>
                  <li>Lits confortables</li>
                  <li>Draps et serviettes propres</li>
                  <li>Assistance 24h/24 et 7j/7</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
