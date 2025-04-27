import { db } from "./db";
import { isGapBetweenBookingsAllowed } from "./booking-rules";

/**
 * Check if a date range is available for booking
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @param isAdmin Whether the check is being performed for an admin reservation
 * @returns True if the date range is available, false otherwise
 */
export async function isDateAvailable(
  startDate: Date,
  endDate: Date,
  isAdmin: boolean = false
): Promise<boolean> {
  // Get the month before and after the requested dates to check for adjacent reservations
  const extendedStartDate = new Date(startDate);
  extendedStartDate.setMonth(extendedStartDate.getMonth() - 1);
  
  const extendedEndDate = new Date(endDate);
  extendedEndDate.setMonth(extendedEndDate.getMonth() + 1);
  
  console.log("Checking date availability with extended range:", {
    requestedDates: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    extendedRange: {
      start: extendedStartDate.toISOString(),
      end: extendedEndDate.toISOString()
    }
  });

  // Check for existing reservations that overlap with the requested dates
  const overlappingReservations = await db.reservation.findMany({
    where: {
      status: "approved",
      OR: [
        // Case 1: startDate is between an existing reservation's start and end dates
        {
          startDate: { lte: startDate },
          endDate: { gte: startDate },
        },
        // Case 2: endDate is between an existing reservation's start and end dates
        {
          startDate: { lte: endDate },
          endDate: { gte: endDate },
        },
        // Case 3: startDate and endDate completely encompass an existing reservation
        {
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
    },
  });

  if (overlappingReservations.length > 0) {
    return false;
  }

  // Check for blocked dates that overlap with the requested dates
  const overlappingBlockedDates = await db.blockedDate.findMany({
    where: {
      OR: [
        // Case 1: startDate is between a blocked date's start and end dates
        {
          startDate: { lte: startDate },
          endDate: { gte: startDate },
        },
        // Case 2: endDate is between a blocked date's start and end dates
        {
          startDate: { lte: endDate },
          endDate: { gte: endDate },
        },
        // Case 3: startDate and endDate completely encompass a blocked date
        {
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
      ],
    },
  });

  if (overlappingBlockedDates.length > 0) {
    return false;
  }

  // Check for empty days between reservations
  // Get the closest reservations before and after the requested dates
  // Use the extended date range to find reservations in adjacent months
  const previousReservation = await db.reservation.findFirst({
    where: {
      status: "approved",
      endDate: { lt: startDate, gte: extendedStartDate },
    },
    orderBy: {
      endDate: "desc",
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
    },
  });

  const nextReservation = await db.reservation.findFirst({
    where: {
      status: "approved",
      startDate: { gt: endDate, lte: extendedEndDate },
    },
    orderBy: {
      startDate: "asc",
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
    },
  });
  
  console.log("Adjacent reservations:", {
    previousReservation: previousReservation ? {
      id: previousReservation.id,
      startDate: previousReservation.startDate.toISOString(),
      endDate: previousReservation.endDate.toISOString()
    } : null,
    nextReservation: nextReservation ? {
      id: nextReservation.id,
      startDate: nextReservation.startDate.toISOString(),
      endDate: nextReservation.endDate.toISOString()
    } : null
  });

  // If this is an admin reservation, skip the gap check
  if (isAdmin) {
    return true;
  }
  
  // Check if the reservation is consecutive with an existing reservation
  let isConsecutive = false;
  
  if (previousReservation) {
    // Calculate days between reservations
    // If the previous reservation ends on day X and the new one starts on day X+1, they are consecutive (0 days gap)
    const normalizeDate = (date: Date): Date => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedPrevEndDate = normalizeDate(previousReservation.endDate);
    
    // Calculate days between dates using the normalized dates
    const diffTime = normalizedStartDate.getTime() - normalizedPrevEndDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    console.log("Time difference in days (normalized):", diffDays);
    
    // If diffDays is 1, the reservations are consecutive
    if (Math.abs(diffDays - 1) < 0.001) { // Using a small epsilon for floating point comparison
      console.log("Reservation is consecutive with a previous reservation");
      isConsecutive = true;
    }
  }
  
  if (nextReservation) {
    // Calculate days between reservations
    // If the current reservation ends on day X and the next one starts on day X+1, they are consecutive (0 days gap)
    const normalizeDate = (date: Date): Date => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const normalizedEndDate = normalizeDate(endDate);
    const normalizedNextStartDate = normalizeDate(nextReservation.startDate);
    
    // Calculate days between dates using the normalized dates
    const diffTime = normalizedNextStartDate.getTime() - normalizedEndDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    console.log("Time difference in days (normalized):", diffDays);
    
    // If diffDays is 1, the reservations are consecutive
    if (Math.abs(diffDays - 1) < 0.001) { // Using a small epsilon for floating point comparison
      console.log("Reservation is consecutive with a next reservation");
      isConsecutive = true;
    }
  }
  
  // Convert reservations to the format expected by isGapBetweenBookingsAllowed
  const existingReservations = [];
  
  if (previousReservation) {
    existingReservations.push({
      id: previousReservation.id,
      startDate: new Date(previousReservation.startDate),
      endDate: new Date(previousReservation.endDate)
    });
  }
  
  if (nextReservation) {
    existingReservations.push({
      id: nextReservation.id,
      startDate: new Date(nextReservation.startDate),
      endDate: new Date(nextReservation.endDate)
    });
  }
  
  // Use the isGapBetweenBookingsAllowed function from booking-rules.ts
  // This function will check if the reservation is allowed based on the gap rules
  // It will allow consecutive reservations (0 day gap) or reservations with a gap >= requiredGap
  const { allowed, reason } = isGapBetweenBookingsAllowed(startDate, endDate, existingReservations);
  
  if (!allowed) {
    console.log("Reservation rejected:", reason);
    return false;
  }
  
  // If we get here, the reservation is allowed
  if (isConsecutive) {
    console.log("Reservation is consecutive and allowed");
  } else {
    console.log("Reservation has sufficient gap and is allowed");
  }

  return true;
}

/**
 * Get all available dates for a given month
 * @param year The year
 * @param month The month (0-11)
 * @returns An array of available dates
 */
export async function getAvailableDates(
  year: number,
  month: number
): Promise<Date[]> {
  console.log(`Getting available dates for year: ${year}, month: ${month}`);
  // Include adjacent months for checking gaps between reservations
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  // For checking reservations, we need to look at adjacent months
  const extendedStartDate = new Date(year, month - 1, 1); // Include previous month
  const extendedEndDate = new Date(year, month + 2, 0); // Include next month
  
  console.log(`Date range for available dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log(`Extended date range for reservations: ${extendedStartDate.toISOString()} to ${extendedEndDate.toISOString()}`);
  
  try {
    // Get all approved reservations for the month and adjacent months
    const reservations = await db.reservation.findMany({
      where: {
        status: "approved",
        OR: [
          {
            startDate: { lte: extendedEndDate },
            endDate: { gte: extendedStartDate },
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });
    
    console.log(`Found ${reservations.length} reservations for the month`);
    
    // Get all blocked dates for the month
    const blockedDates = await db.blockedDate.findMany({
      where: {
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });
    
    console.log(`Found ${blockedDates.length} blocked date ranges for the month`);
    
    // Create an array of all dates in the month
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Created array of ${dates.length} dates for the month`);
    
    // Filter out dates that are not available
    const availableDates = dates.filter((date) => {
      // Check if date is within any approved reservation
      const isReserved = reservations.some((reservation) => {
        return (
          (date >= reservation.startDate && date <= reservation.endDate)
        );
      });
      
      // Check if date is within any blocked date
      const isBlocked = blockedDates.some((blockedDate) => {
        return (
          (date >= blockedDate.startDate && date <= blockedDate.endDate)
        );
      });
      
      return !isReserved && !isBlocked;
    });
    
    console.log(`Found ${availableDates.length} available dates for the month`);
    return availableDates;
  } catch (error) {
    console.error("Error getting available dates:", error);
    return [];
  }
}
