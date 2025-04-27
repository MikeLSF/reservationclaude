"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
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
  // We don't use bookingRules directly, but we need setBookingRules for the API response
  const [, setBookingRules] = useState<BookingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // High Season Form State
  const [highSeasonRule, setHighSeasonRule] = useState<BookingRule | null>(null);
  const [highSeasonMonths, setHighSeasonMonths] = useState<boolean[]>(Array(12).fill(false));
  const [highSeasonMinStay, setHighSeasonMinStay] = useState(7);
  const [highSeasonMinGap, setHighSeasonMinGap] = useState(7);

  // Low Season Form State
  const [lowSeasonRule, setLowSeasonRule] = useState<BookingRule | null>(null);
  const [lowSeasonMonths, setLowSeasonMonths] = useState<boolean[]>(Array(12).fill(false));
  const [lowSeasonMinStay, setLowSeasonMinStay] = useState(1);
  const [lowSeasonMinGap, setLowSeasonMinGap] = useState(0);

  // Update low season months whenever high season months change
  useEffect(() => {
    const newLowSeasonMonths = highSeasonMonths.map(isHighSeason => !isHighSeason);
    setLowSeasonMonths(newLowSeasonMonths);
  }, [highSeasonMonths]);

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
      console.log("Booking rules fetched:", data);
      setBookingRules(data);

      // Initialize form state from existing rules
      const highSeason = data.find((rule: BookingRule) => rule.isHighSeason);
      const lowSeason = data.find((rule: BookingRule) => !rule.isHighSeason);
      
      console.log("High season rule:", highSeason);
      console.log("Low season rule:", lowSeason);

      if (highSeason) {
        setHighSeasonRule(highSeason);
        setHighSeasonMinStay(highSeason.minimumStayDays || 7);
        setHighSeasonMinGap(highSeason.minimumGapDays || 7);

        // Set high season months
        console.log("High season months:", highSeason.highSeasonStartMonth, highSeason.highSeasonEndMonth);
        
        // Initialize high season months (July to September by default)
        const newHighSeasonMonths = Array(12).fill(false);
        
        if (highSeason.highSeasonStartMonth !== null && highSeason.highSeasonEndMonth !== null) {
          const start = highSeason.highSeasonStartMonth - 1; // Convert to 0-indexed
          const end = highSeason.highSeasonEndMonth - 1; // Convert to 0-indexed

          if (start <= end) {
            // Normal range (e.g., July to September)
            for (let i = start; i <= end; i++) {
              newHighSeasonMonths[i] = true;
            }
          } else {
            // Wrapping range (e.g., November to February)
            for (let i = start; i < 12; i++) {
              newHighSeasonMonths[i] = true;
            }
            for (let i = 0; i <= end; i++) {
              newHighSeasonMonths[i] = true;
            }
          }
        } else {
          // Default to July-September if no months are specified
          newHighSeasonMonths[6] = true; // July (0-indexed)
          newHighSeasonMonths[7] = true; // August
          newHighSeasonMonths[8] = true; // September
        }

        console.log("Setting high season months:", newHighSeasonMonths);
        setHighSeasonMonths(newHighSeasonMonths);
      } else {
        // If no high season rule exists, set default high season months (July-September)
        const defaultHighSeasonMonths = Array(12).fill(false);
        defaultHighSeasonMonths[6] = true; // July (0-indexed)
        defaultHighSeasonMonths[7] = true; // August
        defaultHighSeasonMonths[8] = true; // September
        setHighSeasonMonths(defaultHighSeasonMonths);
      }

      // Initialize low season months as the inverse of high season months
      const newLowSeasonMonths = Array(12).fill(false);
      
      // Update low season months based on high season months (inverse)
      for (let i = 0; i < 12; i++) {
        // If the month is not in high season, it's in low season
        newLowSeasonMonths[i] = !highSeasonMonths[i];
      }
      
      console.log("Setting low season months:", newLowSeasonMonths);
      setLowSeasonMonths(newLowSeasonMonths);
      
      if (lowSeason) {
        setLowSeasonRule(lowSeason);
        setLowSeasonMinStay(lowSeason.minimumStayDays || 1);
        setLowSeasonMinGap(lowSeason.minimumGapDays || 0);
      }
    } catch (error) {
      console.error("Error fetching booking rules:", error);
      setError("Failed to load booking rules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHighSeasonMonth = (index: number) => {
    const newHighSeasonMonths = [...highSeasonMonths];
    newHighSeasonMonths[index] = !newHighSeasonMonths[index];
    setHighSeasonMonths(newHighSeasonMonths);

    // Update low season months (inverse of high season)
    const newLowSeasonMonths = lowSeasonMonths.map((value, i) => 
      i === index ? !newHighSeasonMonths[i] : value
    );
    setLowSeasonMonths(newLowSeasonMonths);
  };

  const toggleLowSeasonMonth = (index: number) => {
    const newLowSeasonMonths = [...lowSeasonMonths];
    newLowSeasonMonths[index] = !newLowSeasonMonths[index];
    setLowSeasonMonths(newLowSeasonMonths);

    // Update high season months (inverse of low season)
    const newHighSeasonMonths = highSeasonMonths.map((value, i) => 
      i === index ? !newLowSeasonMonths[i] : value
    );
    setHighSeasonMonths(newHighSeasonMonths);
  };

  const getMonthRangeFromArray = (monthsArray: boolean[]): { start: number | null, end: number | null } => {
    // Find the longest continuous sequence of true values
    let currentStart = -1;
    let currentLength = 0;
    let maxStart = -1;
    let maxLength = 0;

    // Handle wrapping around (December to January)
    const wrappedArray = [...monthsArray, ...monthsArray];
    
    for (let i = 0; i < wrappedArray.length; i++) {
      if (wrappedArray[i]) {
        if (currentStart === -1) {
          currentStart = i % 12;
        }
        currentLength++;
      } else {
        if (currentLength > maxLength) {
          maxLength = currentLength;
          maxStart = currentStart;
        }
        currentStart = -1;
        currentLength = 0;
      }
    }

    // Check the last sequence
    if (currentLength > maxLength) {
      maxLength = currentLength;
      maxStart = currentStart;
    }

    if (maxStart === -1 || maxLength === 0) {
      return { start: null, end: null };
    }

    // Convert to 1-indexed for the API
    const start = maxStart + 1;
    const end = ((maxStart + maxLength - 1) % 12) + 1;

    return { start, end };
  };

  const handleSaveRules = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setError(null);

    try {
      // Prepare high season rule data
      const highSeasonMonthRange = getMonthRangeFromArray(highSeasonMonths);
      const highSeasonData = {
        name: "Règle Haute Saison",
        isActive: true,
        isHighSeason: true,
        highSeasonStartMonth: highSeasonMonthRange.start,
        highSeasonEndMonth: highSeasonMonthRange.end,
        minimumStayDays: highSeasonMinStay,
        enforceGapBetweenBookings: true,
        minimumGapDays: highSeasonMinGap,
      };

      // Prepare low season rule data
      const lowSeasonData = {
        name: "Règle Basse Saison",
        isActive: true,
        isHighSeason: false,
        highSeasonStartMonth: null,
        highSeasonEndMonth: null,
        minimumStayDays: lowSeasonMinStay,
        enforceGapBetweenBookings: lowSeasonMinGap > 0,
        minimumGapDays: lowSeasonMinGap > 0 ? lowSeasonMinGap : null,
      };

      // Update or create high season rule
      if (highSeasonRule) {
        await fetch(`/api/booking-rules/${highSeasonRule.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(highSeasonData),
        });
      } else {
        await fetch("/api/booking-rules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(highSeasonData),
        });
      }

      // Update or create low season rule
      if (lowSeasonRule) {
        await fetch(`/api/booking-rules/${lowSeasonRule.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lowSeasonData),
        });
      } else {
        await fetch("/api/booking-rules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lowSeasonData),
        });
      }

      // Refresh the rules
      await fetchBookingRules();
      
      // Refresh the active rules cache on the server
      try {
        const refreshResponse = await fetch("/api/booking-rules/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (refreshResponse.ok) {
          console.log("Active rules cache refreshed successfully");
        } else {
          console.error("Failed to refresh active rules cache");
        }
      } catch (refreshError) {
        console.error("Error refreshing active rules cache:", refreshError);
      }
      
      setSuccessMessage("Règles de réservation mises à jour avec succès");
      showToast("Règles de réservation mises à jour avec succès", "success");
      
      // Force a complete page reload to refresh all JavaScript modules
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Wait 1.5 seconds to show the success message before reloading
    } catch (error: unknown) {
      console.error("Error saving booking rules:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save booking rules";
      setError(errorMessage);
      showToast("Erreur lors de la sauvegarde des règles", "error");
    } finally {
      setIsSubmitting(false);
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
          Configurez les règles qui s&apos;appliquent aux réservations des clients
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-md p-3">
          {successMessage}
          <p className="mt-2 text-sm">La page va se rafraîchir automatiquement pour appliquer les changements...</p>
        </div>
      )}
      
      <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3">
        <p className="text-sm">
          <strong>Note :</strong> Après avoir enregistré les règles, la page se rafraîchira automatiquement pour appliquer les changements au calendrier. 
          Si vous ne voyez pas les changements immédiatement, vous pouvez utiliser le bouton &ldquo;Rafraîchir la page&rdquo; ci-dessous.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Chargement des règles de réservation...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* High Season Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Haute Saison</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois de haute saison
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {monthNames.map((month, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`high-season-month-${index}`}
                      checked={highSeasonMonths[index]}
                      onChange={() => toggleHighSeasonMonth(index)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-2"
                    />
                    <label htmlFor={`high-season-month-${index}`} className="text-sm text-gray-700">
                      {month}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée minimum de séjour (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={highSeasonMinStay}
                  onChange={(e) => setHighSeasonMinStay(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jours minimum entre réservations
                </label>
                <input
                  type="number"
                  min="0"
                  value={highSeasonMinGap}
                  onChange={(e) => setHighSeasonMinGap(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Les réservations peuvent être consécutives (0 jour d&apos;écart) ou respecter cet écart minimum.
                </p>
              </div>
            </div>
          </div>
          
          {/* Low Season Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Basse Saison</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mois de basse saison
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {monthNames.map((month, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`low-season-month-${index}`}
                      checked={lowSeasonMonths[index]}
                      onChange={() => toggleLowSeasonMonth(index)}
                      className="h-4 w-4 text-green-600 rounded border-gray-300 mr-2"
                    />
                    <label htmlFor={`low-season-month-${index}`} className="text-sm text-gray-700">
                      {month}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée minimum de séjour (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowSeasonMinStay}
                  onChange={(e) => setLowSeasonMinStay(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jours minimum entre réservations
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowSeasonMinGap}
                  onChange={(e) => setLowSeasonMinGap(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Les réservations peuvent être consécutives (0 jour d&apos;écart) ou respecter cet écart minimum.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="px-6"
            >
              Rafraîchir la page
            </Button>
            
            <Button 
              onClick={handleSaveRules} 
              isLoading={isSubmitting}
              className="px-6"
            >
              Enregistrer les Règles
            </Button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">À propos des règles de réservation</h3>
            <p className="text-sm text-blue-700 mb-2">
              Ces règles s&apos;appliquent uniquement au calendrier de réservation côté client.
              En tant qu&apos;administrateur, vous pouvez toujours créer des réservations manuelles
              sans ces restrictions.
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>
                <strong>Haute saison :</strong> Sélectionnez les mois concernés et définissez une durée minimum 
                de séjour ainsi qu&apos;un intervalle minimum entre les réservations.
              </li>
              <li>
                <strong>Basse saison :</strong> Les mois non sélectionnés en haute saison sont automatiquement 
                en basse saison. Vous pouvez définir des règles moins strictes pour cette période.
              </li>
              <li>
                <strong>Important :</strong> Un mois ne peut pas être à la fois en haute saison et en basse saison.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
