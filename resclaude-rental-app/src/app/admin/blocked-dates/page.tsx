"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";
import { format } from "date-fns";
import { useToast } from "@/components/ui/Toast";

interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  createdAt: string;
}

export default function BlockedDatesPage() {
  const { showToast } = useToast();
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/blocked-dates");
      if (!response.ok) {
        throw new Error("Failed to fetch blocked dates");
      }

      const data = await response.json();
      setBlockedDates(data);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      setError("Failed to load blocked dates. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
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

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setReason("");
      setSuccessMessage("Dates bloquées avec succès");
      showToast("Dates bloquées avec succès", "success");

      // Refresh the list
      fetchBlockedDates();
    } catch (error: unknown) {
      console.error("Error creating blocked date:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to block dates. Please try again.";
      setError(errorMessage);
      showToast("Erreur lors du blocage des dates", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blocked date?")) {
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
      // Refresh the list
      fetchBlockedDates();
    } catch (error) {
      console.error("Error deleting blocked date:", error);
      setError("Failed to delete blocked date. Please try again.");
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gérer les Dates Bloquées</h1>
          <Link href="/admin">
            <Button variant="outline">Retour au Tableau de Bord</Button>
          </Link>
        </div>
        <p className="text-gray-600">Bloquez des dates pour empêcher les réservations</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Bloquer de Nouvelles Dates</h2>
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
            <Textarea
              label="Raison (Optionnel)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Entrez la raison du blocage de ces dates"
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Bloquer les Dates
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Dates Actuellement Bloquées</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Chargement des dates bloquées...</p>
            </div>
          ) : blockedDates.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-600">Aucune date bloquée trouvée.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockedDates.map((blockedDate) => (
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
                      onClick={() => handleDelete(blockedDate.id)}
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
    </div>
  );
}
