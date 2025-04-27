"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
// import { format } from "date-fns";
// import { fr } from "date-fns/locale";
import { useToast } from "@/components/ui/Toast";
import { Calendar as CalendarComponent } from "@/components/Calendar";

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

type ReservationType = "blocked" | "manual";

export default function CalendarPage() {
  const { showToast } = useToast();
  const [calendarData, setCalendarData] = useState({
    availableDates: [] as Date[],
    reservations: [] as Reservation[],
    blockedDates: [] as BlockedDate[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date());

  // Form state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [reservationType, setReservationType] = useState<ReservationType>("blocked");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Manual reservation form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("");

  // Fetch calendar data on initial load
  useEffect(() => {
    // Check if there's a date parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam) {
      try {
        // Parse the date from the URL
        const date = new Date(dateParam);
        console.log("Date from URL:", date);
        
        // Set the start date
        setStartDate(date);
        
        // Set the end date to the next day by default
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        setEndDate(nextDay);
        
        // Fetch calendar data for the month containing this date
        fetchCalendarData(date);
      } catch (error) {
        console.error("Error parsing date from URL:", error);
        fetchCalendarData(new Date());
      }
    } else {
      fetchCalendarData(new Date());
    }
  }, []);

  const fetchCalendarData = async (date: Date) => {
    try {
      setIsLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed

      console.log(`Fetching calendar data for year: ${year}, month: ${month}`);
      const response = await fetch(`/api/calendar?year=${year}&month=${month}`);
      if (!response.ok) {
        throw new Error("Failed to fetch calendar data");
      }

      const data = await response.json();
      console.log("Received calendar data:", data);
      
      setCalendarData({
        availableDates: data.availableDates.map((date: string) => new Date(date)),
        reservations: data.reservations,
        blockedDates: data.blockedDates,
      });
      
      // Update current view month after data is loaded
      setCurrentViewMonth(date);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setError("Failed to load calendar data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (date: Date) => {
    console.log("Month changed in admin calendar page:", date);
    // Directly fetch data for the new month instead of just updating state
    fetchCalendarData(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    setSuccessMessage(null);
    setError(null);

    // Validate form
    const errors: Record<string, string> = {};
    if (!startDate) {
      errors.startDate = "La date de début est requise";
    }
    if (!endDate) {
      errors.endDate = "La date de fin est requise";
    }
    if (startDate && endDate && startDate >= endDate) {
      errors.endDate = "La date de fin doit être après la date de début";
    }

    if (reservationType === "manual") {
      if (!guestName) {
        errors.guestName = "Le nom du client est requis";
      }
      if (!guestEmail) {
        errors.guestEmail = "L'email du client est requis";
      }
      if (!guestPhone) {
        errors.guestPhone = "Le téléphone du client est requis";
      }
      if (!numberOfPeople) {
        errors.numberOfPeople = "Le nombre de personnes est requis";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (reservationType === "blocked") {
        // Create blocked date
        const response = await fetch("/api/blocked-dates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate,
            endDate,
            reason,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create blocked date");
        }

        showToast("Dates bloquées avec succès", "success");
        setSuccessMessage("Dates bloquées avec succès");
      } else {
        // Create manual reservation
        const [firstName, lastName] = guestName.split(" ", 2);
        
        const response = await fetch("/api/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate,
            endDate,
            firstName: firstName || guestName,
            lastName: lastName || "",
            email: guestEmail,
            phone: guestPhone,
            address: "Réservation manuelle",
            locality: "N/A",
            city: "N/A",
            numberOfPeople,
            message: reason,
            status: "approved", // Auto-approve manual reservations
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create reservation");
        }

        showToast("Réservation créée avec succès", "success");
        setSuccessMessage("Réservation créée avec succès");
      }

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setReason("");
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setNumberOfPeople("");
      
      // Refresh calendar data
      fetchCalendarData(currentViewMonth);
    } catch (error: unknown) {
      console.error("Error creating entry:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create entry. Please try again.";
      setError(errorMessage);
      showToast("Erreur lors de la création", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Calendrier Administrateur</h1>
          <Link href="/admin">
            <Button variant="outline">Retour au Tableau de Bord</Button>
          </Link>
        </div>
        <p className="text-gray-600">Gérez les réservations et les dates bloquées</p>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-md p-3">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Calendrier</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Chargement du calendrier...</p>
            </div>
          ) : (
            <CalendarComponent
              availableDates={calendarData.availableDates}
              reservations={calendarData.reservations}
              blockedDates={calendarData.blockedDates}
              onDateClick={(date) => {
                console.log("Date clicked in calendar:", date);
                // If startDate is not set, set it
                if (!startDate) {
                  setStartDate(date);
                } 
                // If startDate is set but endDate is not, set endDate
                else if (!endDate) {
                  // Make sure endDate is after startDate
                  if (date >= startDate) {
                    setEndDate(date);
                  } else {
                    // If user clicked a date before startDate, swap them
                    setEndDate(startDate);
                    setStartDate(date);
                  }
                } 
                // If both are set, reset and set startDate
                else {
                  setStartDate(date);
                  setEndDate(null);
                }
              }}
              selectedStartDate={startDate}
              selectedEndDate={endDate}
              onMonthChange={handleMonthChange}
            />
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Ajouter une période</h2>
          
          <div className="mb-4">
            <div className="flex space-x-4">
              <button
                type="button"
                className={`px-4 py-2 rounded-md ${
                  reservationType === "blocked"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setReservationType("blocked")}
              >
                Bloquer des dates
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md ${
                  reservationType === "manual"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setReservationType("manual")}
              >
                Réservation manuelle
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label="Date de début"
                selected={startDate}
                onChange={setStartDate}
                placeholderText="Sélectionnez la date de début"
                error={formErrors.startDate}
              />
              <DatePicker
                label="Date de fin"
                selected={endDate}
                onChange={setEndDate}
                minDate={startDate || undefined}
                placeholderText="Sélectionnez la date de fin"
                error={formErrors.endDate}
              />
            </div>

            {reservationType === "manual" && (
              <>
                <Input
                  label="Nom du client"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Entrez le nom du client"
                  error={formErrors.guestName}
                />
                <Input
                  label="Email du client"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Entrez l'email du client"
                  error={formErrors.guestEmail}
                />
                <Input
                  label="Téléphone du client"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Entrez le téléphone du client"
                  error={formErrors.guestPhone}
                />
                <Input
                  label="Nombre de personnes"
                  type="number"
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(e.target.value)}
                  placeholder="Entrez le nombre de personnes"
                  error={formErrors.numberOfPeople}
                />
              </>
            )}

            <Textarea
              label={reservationType === "blocked" ? "Raison (Optionnel)" : "Notes (Optionnel)"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                reservationType === "blocked"
                  ? "Entrez la raison du blocage de ces dates"
                  : "Entrez des notes sur cette réservation"
              }
            />
            
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              {reservationType === "blocked" ? "Bloquer les Dates" : "Créer la Réservation"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
