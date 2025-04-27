"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

type SortField = 
  | "name" 
  | "dates" 
  | "contact" 
  | "address" 
  | "locality" 
  | "city" 
  | "people" 
  | "created" 
  | "status";

type SortDirection = "asc" | "desc";

export function ReservationSummaryTable() {
  const [originalReservations, setOriginalReservations] = useState<Reservation[]>([]);
  const [sortedReservations, setSortedReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    fetchAllReservations();
  }, []);

  // Apply sorting whenever sort parameters change or original data changes
  useEffect(() => {
    if (originalReservations.length > 0) {
      const newSortedReservations = [...originalReservations].sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case "name":
            comparison = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
            break;
          case "dates":
            comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            break;
          case "contact":
            comparison = a.email.localeCompare(b.email);
            break;
          case "address":
            comparison = a.address.localeCompare(b.address);
            break;
          case "locality":
            comparison = a.locality.localeCompare(b.locality);
            break;
          case "city":
            comparison = a.city.localeCompare(b.city);
            break;
          case "people":
            comparison = parseInt(a.numberOfPeople) - parseInt(b.numberOfPeople);
            break;
          case "created":
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case "status":
            comparison = a.status.localeCompare(b.status);
            break;
          default:
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
      
      setSortedReservations(newSortedReservations);
    }
  }, [originalReservations, sortField, sortDirection]);

  const fetchAllReservations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reservations?status=all`);
      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }

      const data = await response.json();
      setOriginalReservations(data);
      setSortedReservations(data);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError("Failed to load reservations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const statusLabels = {
      pending: "En attente",
      approved: "Approuvée",
      rejected: "Refusée",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses]
        }`}
      >
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Chargement des réservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        {error}
      </div>
    );
  }

  if (sortedReservations.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-md">
        <p className="text-gray-600">Aucune réservation trouvée.</p>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === "asc" 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Récapitulatif de toutes les réservations</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("name")}
            >
              Client {getSortIcon("name")}
            </th>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("dates")}
            >
              Dates {getSortIcon("dates")}
            </th>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("contact")}
            >
              Contact {getSortIcon("contact")}
            </th>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("address")}
            >
              Adresse {getSortIcon("address")}
            </th>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("locality")}
            >
              Code postal {getSortIcon("locality")}
            </th>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("city")}
            >
              Localité {getSortIcon("city")}
            </th>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("people")}
            >
              Personnes {getSortIcon("people")}
            </th>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("created")}
            >
              Demandé le {getSortIcon("created")}
            </th>
            <th 
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort("status")}
            >
              Statut {getSortIcon("status")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedReservations.map((reservation: Reservation) => (
            <tr key={reservation.id} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {reservation.firstName} {reservation.lastName}
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{reservation.email}</div>
                <div className="text-sm text-gray-500">{reservation.phone}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{reservation.address}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{reservation.locality}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{reservation.city}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-center">
                <div className="text-sm text-gray-900">{reservation.numberOfPeople}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {formatDate(reservation.createdAt)}
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                {getStatusBadge(reservation.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
