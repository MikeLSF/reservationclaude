"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface BookingRule {
  id: string;
  name: string;
  isActive: boolean;
  isHighSeason: boolean;
  highSeasonStartMonth: number | null;
  highSeasonEndMonth: number | null;
  minimumStayDays: number;
  enforceGapBetweenBookings: boolean;
  minimumGapDays: number | null;
  createdAt: string;
  updatedAt: string;
}

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function BookingRulesPage() {
  const { showToast } = useToast();
  const [bookingRules, setBookingRules] = useState<BookingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRule, setEditingRule] = useState<BookingRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isHighSeason, setIsHighSeason] = useState(false);
  const [highSeasonStartMonth, setHighSeasonStartMonth] = useState<number | null>(null);
  const [highSeasonEndMonth, setHighSeasonEndMonth] = useState<number | null>(null);
  const [minimumStayDays, setMinimumStayDays] = useState(1);
  const [enforceGapBetweenBookings, setEnforceGapBetweenBookings] = useState(false);
  const [minimumGapDays, setMinimumGapDays] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBookingRules();
  }, []);

  const fetchBookingRules = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/booking-rules");
      if (!response.ok) {
        throw new Error("Failed to fetch booking rules");
      }

      const data = await response.json();
      setBookingRules(data);
    } catch (error) {
      console.error("Error fetching booking rules:", error);
      setError("Failed to load booking rules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingRule(null);
    resetForm();
  };

  const handleEditRule = (rule: BookingRule) => {
    setIsEditing(true);
    setIsCreating(false);
    setEditingRule(rule);
    
    // Populate form with rule data
    setName(rule.name);
    setIsActive(rule.isActive);
    setIsHighSeason(rule.isHighSeason);
    setHighSeasonStartMonth(rule.highSeasonStartMonth);
    setHighSeasonEndMonth(rule.highSeasonEndMonth);
    setMinimumStayDays(rule.minimumStayDays);
    setEnforceGapBetweenBookings(rule.enforceGapBetweenBookings);
    setMinimumGapDays(rule.minimumGapDays);
  };

  const resetForm = () => {
    setName("");
    setIsActive(true);
    setIsHighSeason(false);
    setHighSeasonStartMonth(null);
    setHighSeasonEndMonth(null);
    setMinimumStayDays(1);
    setEnforceGapBetweenBookings(false);
    setMinimumGapDays(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditingRule(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ruleData = {
        name,
        isActive,
        isHighSeason,
        highSeasonStartMonth,
        highSeasonEndMonth,
        minimumStayDays,
        enforceGapBetweenBookings,
        minimumGapDays,
      };

      let response;
      
      if (isEditing && editingRule) {
        // Update existing rule
        response = await fetch(`/api/booking-rules/${editingRule.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ruleData),
        });
      } else {
        // Create new rule
        response = await fetch("/api/booking-rules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ruleData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save booking rule");
      }

      // Refresh the list
      await fetchBookingRules();
      
      // Show success message
      showToast(
        isEditing
          ? "Règle de réservation mise à jour avec succès"
          : "Règle de réservation créée avec succès",
        "success"
      );
      
      // Reset form and state
      cancelEdit();
    } catch (error: any) {
      console.error("Error saving booking rule:", error);
      showToast(error.message || "Failed to save booking rule", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette règle de réservation ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/booking-rules/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete booking rule");
      }

      // Refresh the list
      await fetchBookingRules();
      
      // Show success message
      showToast("Règle de réservation supprimée avec succès", "success");
    } catch (error: any) {
      console.error("Error deleting booking rule:", error);
      showToast(error.message || "Failed to delete booking rule", "error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Règles de Réservation</h1>
          <Link href="/admin">
            <Button variant="outline">Retour au Tableau de Bord</Button>
          </Link>
        </div>
        <p className="text-gray-600">
          Gérez les règles qui s&apos;appliquent aux réservations des clients
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Button onClick={handleCreateRule} disabled={isCreating || isEditing}>
          Ajouter une Nouvelle Règle
        </Button>
      </div>

      {(isCreating || isEditing) && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? "Modifier la Règle" : "Créer une Nouvelle Règle"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom de la règle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Règle Haute Saison"
              required
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Règle active
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isHighSeason"
                checked={isHighSeason}
                onChange={(e) => setIsHighSeason(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="isHighSeason" className="text-sm font-medium text-gray-700">
                Règle de haute saison
              </label>
            </div>

            {isHighSeason && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mois de début de haute saison
                  </label>
                  <select
                    value={highSeasonStartMonth || ""}
                    onChange={(e) => setHighSeasonStartMonth(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionnez un mois</option>
                    {monthNames.map((month, index) => (
                      <option key={index} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mois de fin de haute saison
                  </label>
                  <select
                    value={highSeasonEndMonth || ""}
                    onChange={(e) => setHighSeasonEndMonth(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionnez un mois</option>
                    {monthNames.map((month, index) => (
                      <option key={index} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée minimum de séjour (jours)
              </label>
              <input
                type="number"
                min="1"
                value={minimumStayDays}
                onChange={(e) => setMinimumStayDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enforceGapBetweenBookings"
                checked={enforceGapBetweenBookings}
                onChange={(e) => setEnforceGapBetweenBookings(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="enforceGapBetweenBookings" className="text-sm font-medium text-gray-700">
                Imposer un intervalle entre les réservations
              </label>
            </div>

            {enforceGapBetweenBookings && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intervalle minimum entre réservations (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={minimumGapDays || ""}
                  onChange={(e) => setMinimumGapDays(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <Button type="submit" isLoading={isSubmitting}>
                {isEditing ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Chargement des règles de réservation...</p>
        </div>
      ) : bookingRules.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-600">Aucune règle de réservation trouvée.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée Min.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intervalle
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookingRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rule.isHighSeason ? "Haute saison" : "Basse saison"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rule.isHighSeason && rule.highSeasonStartMonth && rule.highSeasonEndMonth
                        ? `${monthNames[rule.highSeasonStartMonth - 1]} - ${
                            monthNames[rule.highSeasonEndMonth - 1]
                          }`
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rule.minimumStayDays} jour{rule.minimumStayDays > 1 ? "s" : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {rule.enforceGapBetweenBookings && rule.minimumGapDays
                        ? `${rule.minimumGapDays} jour${rule.minimumGapDays > 1 ? "s" : ""}`
                        : "Non"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      disabled={isEditing || isCreating}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isEditing || isCreating}
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

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-2">À propos des règles de réservation</h3>
        <p className="text-sm text-blue-700 mb-2">
          Ces règles s&apos;appliquent uniquement au calendrier de réservation côté client.
          En tant qu&apos;administrateur, vous pouvez toujours créer des réservations manuelles
          sans ces restrictions.
        </p>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>
            <strong>Basse saison :</strong> Aucune contrainte particulière. La durée de séjour est libre
            (minimum 1 jour) et il peut y avoir des intervalles libres entre réservations.
          </li>
          <li>
            <strong>Haute saison :</strong> Vous pouvez définir une période (par exemple, juillet à septembre)
            avec des règles spécifiques comme une durée minimum de séjour et un intervalle obligatoire
            entre les réservations.
          </li>
        </ul>
      </div>
    </div>
  );
}
