"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { useToast } from "@/components/ui/Toast";
import { ReservationSummaryTable } from "@/components/ReservationSummaryTable";

interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  locality: string;
  city: string;
  numberOfPeople: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    fetchReservations();
  }, [activeTab]);

  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reservations?status=${activeTab}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }

      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError("Failed to load reservations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reservation status");
      }

      // Show success toast
      showToast(
        `Réservation ${status === "approved" ? "approuvée" : "refusée"} avec succès`,
        "success"
      );

      // Refresh the list
      fetchReservations();
    } catch (error) {
      console.error("Error updating reservation status:", error);
      setError("Failed to update reservation status. Please try again.");
      showToast("Erreur lors de la mise à jour du statut", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reservation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reservation");
      }

      // Show success toast
      showToast("Réservation supprimée avec succès", "success");

      // Refresh the list
      fetchReservations();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      setError("Failed to delete reservation. Please try again.");
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tableau de Bord Administrateur</h1>
        <p className="text-gray-600">Gérer les demandes de réservation et les dates bloquées</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "pending"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            En attente
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "approved"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("approved")}
          >
            Approuvées
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "rejected"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("rejected")}
          >
            Refusées
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="mb-6 flex space-x-4">
        <Link href="/admin/blocked-dates">
          <Button>Gérer les Dates Bloquées</Button>
        </Link>
        <Link href="/admin/calendar">
          <Button>Calendrier Administrateur</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Chargement des réservations...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-600">Aucune réservation {activeTab === "pending" ? "en attente" : activeTab === "approved" ? "approuvée" : "refusée"} trouvée.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demandé le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.firstName} {reservation.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.numberOfPeople} personne(s)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {reservation.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.phone}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {reservation.address}, {reservation.locality}, {reservation.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(reservation.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {activeTab === "pending" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(reservation.id, "approved")}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleStatusChange(reservation.id, "rejected")}
                          className="text-red-600 hover:text-red-900 mr-4"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(reservation.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-12 border-t border-gray-200 pt-8">
        <ReservationSummaryTable />
      </div>
    </div>
  );
}
