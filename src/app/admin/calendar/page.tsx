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
  const [blockedDatesList, setBlockedDatesList] = useState<BlockedDate[]>([]);
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("");

  // Fetch calendar data and blocked dates on initial load
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
    
    // Fetch blocked dates
    fetchBlockedDates();
  }, []);
  
  const fetchBlockedDates = async () => {
    try {
      const response = await fetch("/api/blocked-dates");
      if (!response.ok) {
        throw new Error("Failed to fetch blocked dates");
      }

      const data = await response.json();
      setBlockedDatesList(data);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      setError("Failed to load blocked dates. Please try again.");
    }
  };
  
  const handleDeleteBlockedDate = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette période bloquée ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/blocked-dates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete blocked date");
      }

      setSuccessMessage("Période bloquée supprimée avec succès");
      showToast("Période bloquée supprimée avec succès", "success");
      
      // Refresh the lists
      fetchBlockedDates();
      fetchCalendarData(currentViewMonth);
    } catch (error) {
      console.error("Error deleting blocked date:", error);
      setError("Failed to delete blocked date. Please try again.");
      showToast("Erreur lors de la suppression", "error");
    }
  };
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

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
    // Fetch data for the new month
    fetchCalendarData(date);
    // Update the current view month state to ensure the Calendar component updates
    setCurrentViewMonth(date);
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
      if (!firstName) {
        errors.firstName = "Le prénom du client est requis";
      }
      if (!lastName) {
        errors.lastName = "Le nom du client est requis";
      }
      if (!guestEmail) {
        errors.guestEmail = "L'email du client est requis";
      }
      if (!guestPhone) {
        errors.guestPhone = "Le téléphone du client est requis";
      }
      if (!address) {
        errors.address = "L'adresse est requise";
      }
      if (!locality) {
        errors.locality = "Le code postal est requis";
      }
      if (!city) {
        errors.city = "La localité est requise";
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
        const response = await fetch("/api/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate,
            endDate,
            firstName,
            lastName,
            email: guestEmail,
            phone: guestPhone,
            address,
            locality,
            city,
            numberOfPeople,
            message: reason,
            status: "approved", // Auto-approve manual reservations
            isAdmin: true, // Flag to indicate this is an admin reservation
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
      setFirstName("");
      setLastName("");
      setGuestEmail("");
      setGuestPhone("");
      setAddress("");
      setLocality("");
      setCity("");
      setNumberOfPeople("");
      
      // Refresh calendar data
      fetchCalendarData(currentViewMonth);
      fetchBlockedDates();
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
                onChange={(date) => {
                  console.log("Start date changed:", date);
                  setStartDate(date);
                }}
                placeholderText="Sélectionnez la date de début"
                error={formErrors.startDate}
              />
              <DatePicker
                label="Date de fin"
                selected={endDate}
                onChange={(date) => {
                  console.log("End date changed:", date);
                  setEndDate(date);
                }}
                minDate={startDate || undefined}
                placeholderText="Sélectionnez la date de fin"
                error={formErrors.endDate}
              />
            </div>

            {reservationType === "manual" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Entrez le nom du client"
                    error={formErrors.lastName}
                  />
                  <Input
                    label="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Entrez le prénom du client"
                    error={formErrors.firstName}
                  />
                </div>
                <Input
                  label="Adresse email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Entrez l'email du client"
                  error={formErrors.guestEmail}
                />
                <Input
                  label="Numéro de téléphone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Entrez le téléphone du client"
                  error={formErrors.guestPhone}
                />
                <Input
                  label="Adresse"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Entrez l'adresse du client"
                  error={formErrors.address}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Code postal"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="Entrez le code postal"
                    error={formErrors.locality}
                  />
                  <Input
                    label="Localité"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Entrez la localité"
                    error={formErrors.city}
                  />
                </div>
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
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Dates Actuellement Bloquées</h2>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Chargement des dates bloquées...</p>
          </div>
        ) : blockedDatesList.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <p className="text-gray-600">Aucune date bloquée trouvée.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blockedDatesList.map((blockedDate) => (
              <div
                key={blockedDate.id}
                className="bg-gray-50 p-4 rounded-md border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {formatDate(blockedDate.startDate)} - {formatDate(blockedDate.endDate)}
                    </div>
                    {blockedDate.reason && (
                      <div className="text-sm text-gray-600 mt-1">
                        {blockedDate.reason}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteBlockedDate(blockedDate.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
