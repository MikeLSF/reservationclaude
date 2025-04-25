import { db } from "./db";

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
  createdAt?: string;
  updatedAt?: string;
}

interface Reservation {
  id: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Checks if a date is within the high season based on active booking rules
 */
export function isHighSeason(date: Date): boolean {
  // Get the month (1-12)
  const month = date.getMonth() + 1;
  
  // Find active high season rules
  const highSeasonRules = activeRules.filter(
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

/**
 * Gets the minimum stay duration for a given date
 */
export function getMinimumStayDays(date: Date): number {
  // Default minimum stay is 1 day
  let minimumStay = 1;
  
  // Check if the date is in high season
  const isDateInHighSeason = isHighSeason(date);
  
  // Find applicable rules
  const applicableRules = activeRules.filter((rule) => {
    // For high season dates, only apply high season rules
    if (isDateInHighSeason) {
      return rule.isActive && rule.isHighSeason;
    }
    // For low season dates, apply low season rules
    return rule.isActive && !rule.isHighSeason;
  });
  
  // Get the maximum minimum stay from applicable rules
  if (applicableRules.length > 0) {
    minimumStay = Math.max(...applicableRules.map((rule) => rule.minimumStayDays));
  }
  
  return minimumStay;
}

/**
 * Checks if a booking is allowed based on the gap between bookings rule
 */
export function isGapBetweenBookingsAllowed(
  startDate: Date,
  endDate: Date,
  existingReservations: Reservation[]
): { allowed: boolean; reason?: string } {
  // Check if the date range is in high season
  const isStartInHighSeason = isHighSeason(startDate);
  const isEndInHighSeason = isHighSeason(endDate);
  
  // If neither start nor end date is in high season, no gap restrictions apply
  if (!isStartInHighSeason && !isEndInHighSeason) {
    return { allowed: true };
  }
  
  // Find applicable high season rules with gap enforcement
  const gapRules = activeRules.filter(
    (rule) => 
      rule.isActive && 
      rule.isHighSeason && 
      rule.enforceGapBetweenBookings && 
      rule.minimumGapDays !== null
  );
  
  // If no gap rules, allow the booking
  if (gapRules.length === 0) {
    return { allowed: true };
  }
  
  // Get the maximum required gap
  const requiredGap = Math.max(...gapRules.map((rule) => rule.minimumGapDays as number));
  
  // Check for conflicts with existing reservations
  for (const reservation of existingReservations) {
    // Skip the current reservation if we're checking against itself
    if (reservation.id === 'current') continue;
    
    // Calculate days between reservations
    const daysBefore = Math.floor(
      (startDate.getTime() - reservation.endDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysAfter = Math.floor(
      (reservation.startDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Check if there's a reservation too close before or after
    if (daysBefore > 0 && daysBefore < requiredGap) {
      return { 
        allowed: false, 
        reason: `Il doit y avoir au moins ${requiredGap} jours entre les réservations en haute saison.` 
      };
    }
    
    if (daysAfter > 0 && daysAfter < requiredGap) {
      return { 
        allowed: false, 
        reason: `Il doit y avoir au moins ${requiredGap} jours entre les réservations en haute saison.` 
      };
    }
  }
  
  return { allowed: true };
}

/**
 * Validates a booking against all rules
 */
export function validateBooking(
  startDate: Date,
  endDate: Date,
  existingReservations: Reservation[]
): { valid: boolean; reason?: string } {
  // Calculate the duration of stay in days
  const durationDays = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1; // +1 because both start and end dates are inclusive
  
  // Check minimum stay requirement
  const requiredMinimumStay = getMinimumStayDays(startDate);
  if (durationDays < requiredMinimumStay) {
    return {
      valid: false,
      reason: `La durée minimum de séjour est de ${requiredMinimumStay} jour${
        requiredMinimumStay > 1 ? 's' : ''
      } pour cette période.`
    };
  }
  
  // Check gap between bookings
  const gapCheck = isGapBetweenBookingsAllowed(startDate, endDate, existingReservations);
  if (!gapCheck.allowed) {
    return {
      valid: false,
      reason: gapCheck.reason
    };
  }
  
  return { valid: true };
}

// Cache for active rules
let activeRules: BookingRule[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches active booking rules from the database
 */
export async function fetchActiveRules(): Promise<BookingRule[]> {
  const now = Date.now();
  
  // Return cached rules if they're still fresh
  if (activeRules.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return activeRules;
  }
  
  try {
    // Fetch active rules from the database
    // Use a try-catch block to handle the case where the BookingRule model doesn't exist yet
    try {
      // @ts-expect-error - BookingRule model might not exist yet
      const rules = await db.bookingRule.findMany({
        where: {
          isActive: true,
        },
      });
      
      // Update cache
      activeRules = rules;
      lastFetchTime = now;
      
      return rules;
    } catch (dbError) {
      console.error("Error accessing BookingRule model:", dbError);
      
      // If the model doesn't exist yet, return default rules
      const defaultRules: BookingRule[] = [
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
      ];
      
      // Update cache with default rules
      activeRules = defaultRules;
      lastFetchTime = now;
      
      return defaultRules;
    }
  } catch (error) {
    console.error("Error fetching booking rules:", error);
    
    // If all else fails, return default rules or cached rules
    if (activeRules.length > 0) {
      return activeRules;
    }
    
    // Return hardcoded default rules as a last resort
    return [
      {
        id: "high-season-fallback",
        name: "Règle Haute Saison (Secours)",
        isActive: true,
        isHighSeason: true,
        highSeasonStartMonth: 7,
        highSeasonEndMonth: 9,
        minimumStayDays: 7,
        enforceGapBetweenBookings: true,
        minimumGapDays: 7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

/**
 * Initializes the booking rules module
 * Call this function when the application starts
 */
export async function initBookingRules(): Promise<void> {
  await fetchActiveRules();
}
