"use client";

import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";
import { isHighSeason } from "@/lib/booking-rules";

interface CalendarProps {
  availableDates: Date[];
  reservations: {
    id: string;
    startDate: string | Date;
    endDate: string | Date;
  }[];
  blockedDates: {
    id: string;
    startDate: string | Date;
    endDate: string | Date;
    reason?: string;
  }[];
  onDateClick?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
}

export function Calendar({
  availableDates,
  reservations,
  blockedDates,
  onDateClick,
  onMonthChange,
  selectedStartDate,
  selectedEndDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Use state to store normalized dates
  const [normalizedReservations, setNormalizedReservations] = useState<{
    id: string;
    startDate: Date;
    endDate: Date;
  }[]>([]);
  
  const [normalizedBlockedDates, setNormalizedBlockedDates] = useState<{
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }[]>([]);

  // Reset state when month changes to ensure we get fresh data
  useEffect(() => {
    // Reset the normalized dates when the month changes
    setNormalizedReservations([]);
    setNormalizedBlockedDates([]);
    
    // Log the month change
    console.log(`Month changed to: ${format(currentMonth, 'MMMM yyyy')}`);
  }, [currentMonth]);

  // Debug props and update normalized dates when props change
  useEffect(() => {
    console.log("Calendar component received props:");
    console.log("Current month:", currentMonth);
    console.log("Reservations:", reservations);
    console.log("Blocked dates:", blockedDates);
    
    // Update normalized reservations
    const normalizedRes = reservations.map((res) => ({
      ...res,
      startDate: new Date(res.startDate),
      endDate: new Date(res.endDate),
    }));
    console.log("Normalized reservations:", normalizedRes);
    setNormalizedReservations(normalizedRes);
    
    // Update normalized blocked dates
    const normalizedBlocked = blockedDates.map((block) => ({
      ...block,
      startDate: new Date(block.startDate),
      endDate: new Date(block.endDate),
    }));
    console.log("Normalized blocked dates:", normalizedBlocked);
    setNormalizedBlockedDates(normalizedBlocked);
  }, [currentMonth, reservations, blockedDates]);

  useEffect(() => {
    // Get all days in the current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    setCalendarDays(days);
  }, [currentMonth]);

  const nextMonth = () => {
    console.log("Next month button clicked");
    const newMonth = addMonths(currentMonth, 1);
    
    // Call onMonthChange first to fetch new data
    if (onMonthChange) {
      console.log("Calling onMonthChange with:", newMonth);
      onMonthChange(newMonth);
    }
    
    // Then update the local state
    setCurrentMonth(newMonth);
  };

  const prevMonth = () => {
    console.log("Previous month button clicked");
    const newMonth = subMonths(currentMonth, 1);
    
    // Call onMonthChange first to fetch new data
    if (onMonthChange) {
      console.log("Calling onMonthChange with:", newMonth);
      onMonthChange(newMonth);
    }
    
    // Then update the local state
    setCurrentMonth(newMonth);
  };

  const isDateReserved = (date: Date) => {
    return normalizedReservations.some((reservation) =>
      isWithinInterval(date, {
        start: reservation.startDate,
        end: reservation.endDate,
      })
    );
  };

  const isDateBlocked = (date: Date) => {
    // If there are no blocked dates, return false immediately
    if (!normalizedBlockedDates || normalizedBlockedDates.length === 0) {
      return false;
    }
    
    console.log(`Checking if date ${date.toISOString()} is blocked`);
    console.log(`Month of date: ${date.getMonth() + 1}, Year of date: ${date.getFullYear()}`);
    console.log(`Current month view: ${currentMonth.getMonth() + 1}, Year: ${currentMonth.getFullYear()}`);
    console.log("Current normalized blocked dates:", normalizedBlockedDates);
    
    // Only check blocked dates that are in the same month/year as the current view
    const relevantBlockedDates = normalizedBlockedDates.filter(blockedDate => {
      const blockedStartMonth = blockedDate.startDate.getMonth();
      const blockedStartYear = blockedDate.startDate.getFullYear();
      const blockedEndMonth = blockedDate.endDate.getMonth();
      const blockedEndYear = blockedDate.endDate.getFullYear();
      
      const currentViewMonth = currentMonth.getMonth();
      const currentViewYear = currentMonth.getFullYear();
      
      // Check if the blocked date range overlaps with the current view month
      return (
        (blockedStartYear === currentViewYear && blockedStartMonth === currentViewMonth) ||
        (blockedEndYear === currentViewYear && blockedEndMonth === currentViewMonth) ||
        (blockedStartYear < currentViewYear || 
         (blockedStartYear === currentViewYear && blockedStartMonth < currentViewMonth)) &&
        (blockedEndYear > currentViewYear || 
         (blockedEndYear === currentViewYear && blockedEndMonth > currentViewMonth))
      );
    });
    
    console.log("Relevant blocked dates for current month:", relevantBlockedDates);
    
    for (const blockedDate of relevantBlockedDates) {
      const start = blockedDate.startDate;
      const end = blockedDate.endDate;
      
      console.log(`Comparing with blocked date: ${start.toISOString()} - ${end.toISOString()}`);
      
      // Check if date is within the blocked date range
      const isBlocked = date >= start && date <= end;
      console.log(`Is date blocked? ${isBlocked}`);
      
      if (isBlocked) {
        return true;
      }
    }
    
    return false;
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some((availableDate) =>
      isSameDay(new Date(availableDate), date)
    );
  };

  const isDateSelected = (date: Date) => {
    if (selectedStartDate && selectedEndDate) {
      return (
        isWithinInterval(date, {
          start: selectedStartDate,
          end: selectedEndDate,
        }) ||
        isSameDay(date, selectedStartDate) ||
        isSameDay(date, selectedEndDate)
      );
    }
    return (
      (selectedStartDate && isSameDay(date, selectedStartDate)) ||
      (selectedEndDate && isSameDay(date, selectedEndDate))
    );
  };

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const weekdays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={prevMonth}>
          Précédent
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </h2>
        <Button variant="outline" size="sm" onClick={nextMonth}>
          Suivant
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center font-medium text-sm text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isReserved = isDateReserved(day);
          const isBlocked = isDateBlocked(day);
          const isAvailable = isDateAvailable(day);
          const isSelected = isDateSelected(day);
          const isInHighSeason = isHighSeason(day);

          return (
            <div
              key={i}
              className={cn(
                "h-12 flex items-center justify-center rounded-md text-sm cursor-pointer",
                !isSameMonth(day, currentMonth) && "text-gray-300",
                isSameMonth(day, currentMonth) && "text-gray-900",
                isReserved && "bg-blue-100 text-blue-800",
                isBlocked && "bg-red-100 text-red-800",
                isAvailable && "bg-green-100 text-green-800",
                isSelected && "bg-blue-500 text-white",
                isInHighSeason && !isReserved && !isBlocked && !isSelected && "border border-yellow-400",
                (isReserved || isBlocked) && "cursor-not-allowed"
              )}
              onClick={() => {
                if (!isReserved && !isBlocked && isSameMonth(day, currentMonth)) {
                  handleDateClick(day);
                }
              }}
              title={
                isReserved
                  ? "Réservé"
                  : isBlocked
                  ? "Bloqué"
                  : isAvailable
                  ? isInHighSeason
                    ? "Disponible (Haute saison)"
                    : "Disponible"
                  : isInHighSeason
                  ? "Haute saison"
                  : ""
              }
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Réservé</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Bloqué</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Sélectionné</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 border border-yellow-400 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Haute saison</span>
        </div>
      </div>
    </div>
  );
}
