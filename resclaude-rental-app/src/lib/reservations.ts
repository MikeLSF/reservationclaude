import { db } from "./db";
import { addDays, isBefore, isAfter, isEqual } from "date-fns";

/**
 * Check if a date range is available for booking
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @returns True if the date range is available, false otherwise
 */
export async function isDateAvailable(
  startDate: Date,
  endDate: Date
): Promise<boolean> {
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
  const previousReservation = await db.reservation.findFirst({
    where: {
      status: "approved",
      endDate: { lt: startDate },
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
      startDate: { gt: endDate },
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

  // If there's a previous reservation and it ends exactly one day before the requested start date,
  // or if there's a next reservation and it starts exactly one day after the requested end date,
  // then there are no empty days between reservations
  if (
    (previousReservation &&
      isEqual(addDays(previousReservation.endDate, 1), startDate)) ||
    (nextReservation &&
      isEqual(addDays(endDate, 1), nextReservation.startDate))
  ) {
    return true;
  }

  // If there's a previous reservation and it doesn't end exactly one day before the requested start date,
  // or if there's a next reservation and it doesn't start exactly one day after the requested end date,
  // then there are empty days between reservations, which is not allowed
  if (
    (previousReservation &&
      isBefore(previousReservation.endDate, startDate) &&
      !isEqual(addDays(previousReservation.endDate, 1), startDate)) ||
    (nextReservation &&
      isAfter(nextReservation.startDate, endDate) &&
      !isEqual(addDays(endDate, 1), nextReservation.startDate))
  ) {
    return false;
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
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  // Get all approved reservations for the month
  const reservations = await db.reservation.findMany({
    where: {
      status: "approved",
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
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
  
  // Create an array of all dates in the month
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
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
  
  return availableDates;
}
