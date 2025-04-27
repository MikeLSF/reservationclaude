"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Define the shape of a booking rule
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

// Create a context for booking rules
interface BookingRulesContextType {
  rules: BookingRule[];
  isLoading: boolean;
  error: string | null;
  refreshRules: () => Promise<void>;
}

const BookingRulesContext = createContext<BookingRulesContextType>({
  rules: [],
  isLoading: true,
  error: null,
  refreshRules: async () => {},
});

// Hook to use booking rules
export function useBookingRules() {
  return useContext(BookingRulesContext);
}

// Function to check if a date is in high season
export function isHighSeason(date: Date, rules: BookingRule[]): boolean {
  // Get the month (1-12)
  const month = date.getMonth() + 1;
  
  // Find active high season rules
  const highSeasonRules = rules.filter(
    (rule) => 
      rule.isActive && 
      rule.isHighSeason && 
      rule.highSeasonStartMonth !== null && 
      rule.highSeasonEndMonth !== null
  );
  
  // Check if the date falls within any high season period
  return highSeasonRules.some((rule) => {
    const startMonth = rule.highSeasonStartMonth as number;
    const endMonth = rule.highSeasonEndMonth as number;
    
    // Handle cases where high season spans across years (e.g., November to February)
    if (startMonth > endMonth) {
      return month >= startMonth || month <= endMonth;
    } else {
      return month >= startMonth && month <= endMonth;
    }
  });
}

export function BookingRulesProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<BookingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch booking rules from the API
  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/booking-rules/active");
      
      if (!response.ok) {
        throw new Error("Failed to fetch booking rules");
      }
      
      const data = await response.json();
      setRules(data);
    } catch (err) {
      console.error("Error fetching booking rules:", err);
      setError("Failed to load booking rules");
      
      // Set default rules if fetch fails
      setRules([
        {
          id: "high-season-default",
          name: "Règle Haute Saison (Par défaut)",
          isActive: true,
          isHighSeason: true,
          highSeasonStartMonth: 7, // July
          highSeasonEndMonth: 9, // September
          minimumStayDays: 7,
          enforceGapBetweenBookings: true,
          minimumGapDays: 7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "low-season-default",
          name: "Règle Basse Saison (Par défaut)",
          isActive: true,
          isHighSeason: false,
          highSeasonStartMonth: null,
          highSeasonEndMonth: null,
          minimumStayDays: 1,
          enforceGapBetweenBookings: false,
          minimumGapDays: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch rules when the component mounts
  useEffect(() => {
    fetchRules();
  }, []);

  // Function to refresh rules - wrapped in useCallback to prevent infinite loops
  const refreshRules = useCallback(async () => {
    await fetchRules();
  }, []);

  return (
    <BookingRulesContext.Provider value={{ rules, isLoading, error, refreshRules }}>
      {children}
    </BookingRulesContext.Provider>
  );
}
