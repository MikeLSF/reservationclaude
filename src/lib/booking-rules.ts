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
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
 * Checks if a date range overlaps with high season
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @returns True if any part of the date range is in high season
 */
export function dateRangeOverlapsHighSeason(startDate: Date, endDate: Date): boolean {
  // Check if start date is in high season
  if (isHighSeason(startDate)) {
    return true;
  }
  
  // Check if end date is in high season
  if (isHighSeason(endDate)) {
    return true;
  }
  
  // Check if the range spans across high season
  // Create an array of all months in the range
  const months = new Set<number>();
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    months.add(currentDate.getMonth() + 1); // Add month (1-12)
    currentDate.setDate(currentDate.getDate() + 15); // Jump by 15 days to catch all months
  }
  
  // Check if any month in the range is in high season
  return Array.from(months).some(month => {
    const testDate = new Date(startDate.getFullYear(), month - 1, 15); // Middle of the month
    return isHighSeason(testDate);
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
  // Check if the date range overlaps with high season
  const overlapsHighSeason = dateRangeOverlapsHighSeason(startDate, endDate);
  
  // If the date range doesn't overlap with high season, no gap restrictions apply
  if (!overlapsHighSeason) {
    return { allowed: true };
  }
  
  // Log for debugging
  console.log("Checking gap between bookings for high season dates:", { 
    startDate, 
    endDate, 
    overlapsHighSeason 
  });
  
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
  
  // First, check if there are any existing reservations
  if (existingReservations.length === 0) {
    return { allowed: true };
  }
  
  // Sort reservations by start date
  const sortedReservations = [...existingReservations].sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );
  
  // Find the closest reservation before the requested dates
  const previousReservation = sortedReservations
    .filter(res => res.endDate < startDate)
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];
  
  // Find the closest reservation after the requested dates
  const nextReservation = sortedReservations
    .filter(res => res.startDate > endDate)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];
  
  console.log("Closest reservations:", {
    previousReservation: previousReservation ? {
      id: previousReservation.id,
      startDate: previousReservation.startDate,
      endDate: previousReservation.endDate
    } : null,
    nextReservation: nextReservation ? {
      id: nextReservation.id,
      startDate: nextReservation.startDate,
      endDate: nextReservation.endDate
    } : null
  });
  
  // Check if previous reservation's end date is in high season
  const isPrevReservationEndInHighSeason = previousReservation ? 
    isHighSeason(previousReservation.endDate) || dateRangeOverlapsHighSeason(previousReservation.startDate, previousReservation.endDate) : 
    false;
  
  // Check if next reservation's start date is in high season
  const isNextReservationStartInHighSeason = nextReservation ? 
    isHighSeason(nextReservation.startDate) || dateRangeOverlapsHighSeason(nextReservation.startDate, nextReservation.endDate) : 
    false;
  
  // Calculate days between reservations
  // We need to calculate the exact number of days between the end of the previous reservation
  // and the start of the new reservation, or between the end of the new reservation and the
  // start of the next reservation.
  
  // Normalize dates to remove time part (set to 00:00:00)
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };
  
  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);
  
  // For debugging, let's log the exact dates we're comparing
  if (previousReservation) {
    const normalizedPrevEndDate = normalizeDate(previousReservation.endDate);
    console.log("Previous reservation end date (normalized):", normalizedPrevEndDate.toISOString());
    console.log("Current reservation start date (normalized):", normalizedStartDate.toISOString());
    
    // Calculate days between dates using the normalized dates
    const diffTime = normalizedStartDate.getTime() - normalizedPrevEndDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    console.log("Time difference in ms:", diffTime);
    console.log("Time difference in days (normalized):", diffDays);
  }
  
  if (nextReservation) {
    const normalizedNextStartDate = normalizeDate(nextReservation.startDate);
    console.log("Current reservation end date (normalized):", normalizedEndDate.toISOString());
    console.log("Next reservation start date (normalized):", normalizedNextStartDate.toISOString());
    
    // Calculate days between dates using the normalized dates
    const diffTime = normalizedNextStartDate.getTime() - normalizedEndDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    console.log("Time difference in ms:", diffTime);
    console.log("Time difference in days (normalized):", diffDays);
  }
  
  // Calculate days between reservations using normalized dates
  // We need to be careful about the calculation to avoid "off by one" errors
  // If the previous reservation ends on day X and the new one starts on day X+1, they are consecutive (0 days gap)
  // If the previous reservation ends on day X and the new one starts on day X+2, there's 1 day gap, etc.
  const daysBefore = previousReservation ? 
    Math.max(0, Math.floor((normalizedStartDate.getTime() - normalizeDate(previousReservation.endDate).getTime()) / (1000 * 60 * 60 * 24) - 1)) : 
    Number.MAX_SAFE_INTEGER;
  
  const daysAfter = nextReservation ? 
    Math.max(0, Math.floor((normalizeDate(nextReservation.startDate).getTime() - normalizedEndDate.getTime()) / (1000 * 60 * 60 * 24) - 1)) : 
    Number.MAX_SAFE_INTEGER;
  
  console.log("Gap check:", {
    overlapsHighSeason,
    isPrevReservationEndInHighSeason,
    isNextReservationStartInHighSeason,
    daysBefore,
    daysAfter,
    requiredGap
  });
  
  // Check if there's a reservation too close before and either this reservation or the previous one is in high season
  // Allow reservations that start immediately after an existing reservation (daysBefore === 0)
  if (previousReservation && daysBefore > 0 && daysBefore < requiredGap && (overlapsHighSeason || isPrevReservationEndInHighSeason)) {
    return { 
      allowed: false, 
      reason: `Il doit y avoir soit 0 jour (réservation consécutive), soit au moins ${requiredGap} jours entre les réservations en haute saison. (${daysBefore} jours avant)` 
    };
  }
  
  // Check if there's a reservation too close after and either this reservation or the next one is in high season
  // Allow reservations that end immediately before an existing reservation (daysAfter === 0)
  if (nextReservation && daysAfter > 0 && daysAfter < requiredGap && (overlapsHighSeason || isNextReservationStartInHighSeason)) {
    return { 
      allowed: false, 
      reason: `Il doit y avoir soit 0 jour (réservation consécutive), soit au moins ${requiredGap} jours entre les réservations en haute saison. (${daysAfter} jours après)` 
    };
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
  
  // Check if the reservation overlaps with high season
  const overlapsHighSeason = dateRangeOverlapsHighSeason(startDate, endDate);
  
  // Get the appropriate minimum stay requirement based on whether the reservation overlaps with high season
  const requiredMinimumStay = overlapsHighSeason ? 
    // If in high season, get the high season minimum stay
    Math.max(...activeRules
      .filter(rule => rule.isActive && rule.isHighSeason)
      .map(rule => rule.minimumStayDays)) :
    // Otherwise, get the low season minimum stay
    Math.max(...activeRules
      .filter(rule => rule.isActive && !rule.isHighSeason)
      .map(rule => rule.minimumStayDays));
  
  // If no rules found, default to 1 day
  const finalMinimumStay = requiredMinimumStay || 1;
  
  // Check minimum stay requirement
  if (durationDays < finalMinimumStay) {
    return {
      valid: false,
      reason: `La durée minimum de séjour est de ${finalMinimumStay} jour${
        finalMinimumStay > 1 ? 's' : ''
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
  
  // Additional logging for debugging
  console.log("Booking validation passed:", {
    startDate,
    endDate,
    durationDays,
    requiredMinimumStay,
    gapCheck
  });
  
  return { valid: true };
}

// Cache for active rules
let activeRules: BookingRule[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 0; // Always fetch fresh data

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

/**
 * Forces a refresh of the active rules cache
 * Call this function after updating booking rules
 */
export async function refreshActiveRules(): Promise<BookingRule[]> {
  // Reset the last fetch time to force a refresh
  lastFetchTime = 0;
  console.log("Forcing refresh of active booking rules");
  return await fetchActiveRules();
}
