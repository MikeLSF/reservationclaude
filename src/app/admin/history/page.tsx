"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

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
  // Note: deleted field is not available yet due to Prisma client generation issues
  // deleted: boolean;
  message?: string;
  createdAt: string;
}

export default function ReservationHistoryPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchReservationHistory();
  }, []);

  const fetchReservationHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reservations/history");
      if (!response.ok) {
        throw new Error("Failed to fetch reservation history");
      }

      const data = await response.json();
      setReservations(data);
    } catch (error: unknown) {
      console.error("Error fetching reservation history:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to load reservation history. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "approved":
        return "Approuvée";
      case "rejected":
        return "Refusée";
      default:
        return status;
    }
  };

  // Filter reservations based on search term and status filter
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = 
      searchTerm === "" ||
      reservation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.phone.includes(searchTerm) ||
      `${formatDate(reservation.startDate)} - ${formatDate(reservation.endDate)}`.includes(searchTerm);
    
    // For now, we don't have the deleted field, so we'll just filter by status
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Historique des Demandes</h1>
        <p className="text-gray-600">Consultez l&apos;historique complet de toutes les demandes de réservation</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <Link href="/admin">
          <Button variant="outline">Retour au Tableau de Bord</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              id="search"
              placeholder="Nom, email, téléphone, dates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Refusées</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Chargement de l&apos;historique...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-600">Aucune réservation trouvée.</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
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
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demandé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
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
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(reservation.status)}`}>
                      {getStatusLabel(reservation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(reservation.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {reservation.message || "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
