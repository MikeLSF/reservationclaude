"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useBookingRules } from "./BookingRulesProvider";

interface ReservationFormProps {
  onSubmit: (data: ReservationFormData) => void;
  isLoading: boolean;
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
  existingReservations?: { id: string; startDate: string | Date; endDate: string | Date }[];
}

export interface ReservationFormData {
  startDate: Date | null;
  endDate: Date | null;
  lastName: string;
  firstName: string;
  address: string;
  locality: string;
  city: string;
  email: string;
  phone: string;
  numberOfPeople: string;
  message: string;
}

// Define the BookingRule type
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

// Helper function to check if a date is in high season based on rules
function isDateInHighSeason(date: Date, rules: BookingRule[]): boolean {
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

// Helper function to check if a date range overlaps with high season
function dateRangeOverlapsHighSeason(startDate: Date, endDate: Date, rules: BookingRule[]): boolean {
  // Check if start date is in high season
  if (isDateInHighSeason(startDate, rules)) {
    return true;
  }
  
  // Check if end date is in high season
  if (isDateInHighSeason(endDate, rules)) {
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
    return isDateInHighSeason(testDate, rules);
  });
}

// Function to validate booking against rules
function validateBookingWithRules(
  startDate: Date, 
  endDate: Date, 
  existingReservations: { id: string; startDate: Date; endDate: Date }[],
  rules: BookingRule[]
): { valid: boolean; reason?: string } {
  // Calculate the duration of stay in days
  const durationDays = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1; // +1 because both start and end dates are inclusive
  
  // Check if the reservation overlaps with high season
  const overlapsHighSeason = dateRangeOverlapsHighSeason(startDate, endDate, rules);
  
  // Get the appropriate minimum stay requirement based on whether the reservation overlaps with high season
  const requiredMinimumStay = overlapsHighSeason ? 
    // If in high season, get the high season minimum stay
    Math.max(...rules
      .filter(rule => rule.isActive && rule.isHighSeason)
      .map(rule => rule.minimumStayDays)) :
    // Otherwise, get the low season minimum stay
    Math.max(...rules
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
  
  // Check gap between bookings for high season
  if (overlapsHighSeason) {
    // Find applicable high season rules with gap enforcement
    const gapRules = rules.filter(
      (rule) => 
        rule.isActive && 
        rule.isHighSeason && 
        rule.enforceGapBetweenBookings && 
        rule.minimumGapDays !== null
    );
    
    // If no gap rules, allow the booking
    if (gapRules.length > 0) {
      // Get the maximum required gap
      const requiredGap = Math.max(...gapRules.map((rule) => rule.minimumGapDays as number));
      
      // First, check if there are any existing reservations
      if (existingReservations.length > 0) {
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
        
        // Check if previous reservation's end date is in high season
        const isPrevReservationEndInHighSeason = previousReservation ? 
          isDateInHighSeason(previousReservation.endDate, rules) || 
          dateRangeOverlapsHighSeason(previousReservation.startDate, previousReservation.endDate, rules) : 
          false;
        
        // Check if next reservation's start date is in high season
        const isNextReservationStartInHighSeason = nextReservation ? 
          isDateInHighSeason(nextReservation.startDate, rules) || 
          dateRangeOverlapsHighSeason(nextReservation.startDate, nextReservation.endDate, rules) : 
          false;
        
        // Normalize dates to remove time part (set to 00:00:00)
        const normalizeDate = (date: Date): Date => {
          const normalized = new Date(date);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        };
        
        const normalizedStartDate = normalizeDate(startDate);
        const normalizedEndDate = normalizeDate(endDate);
        
        // Calculate days between reservations
        const daysBefore = previousReservation ? 
          Math.max(0, Math.floor((normalizedStartDate.getTime() - normalizeDate(previousReservation.endDate).getTime()) / (1000 * 60 * 60 * 24) - 1)) : 
          Number.MAX_SAFE_INTEGER;
        
        const daysAfter = nextReservation ? 
          Math.max(0, Math.floor((normalizeDate(nextReservation.startDate).getTime() - normalizedEndDate.getTime()) / (1000 * 60 * 60 * 24) - 1)) : 
          Number.MAX_SAFE_INTEGER;
        
        // Check if there's a reservation too close before and either this reservation or the previous one is in high season
        // Allow reservations that start immediately after an existing reservation (daysBefore === 0)
        if (previousReservation && daysBefore > 0 && daysBefore < requiredGap && (overlapsHighSeason || isPrevReservationEndInHighSeason)) {
          return { 
            valid: false, 
            reason: `Il doit y avoir soit 0 jour (réservation consécutive), soit au moins ${requiredGap} jours entre les réservations en haute saison. (${daysBefore} jours avant)` 
          };
        }
        
        // Check if there's a reservation too close after and either this reservation or the next one is in high season
        // Allow reservations that end immediately before an existing reservation (daysAfter === 0)
        if (nextReservation && daysAfter > 0 && daysAfter < requiredGap && (overlapsHighSeason || isNextReservationStartInHighSeason)) {
          return { 
            valid: false, 
            reason: `Il doit y avoir soit 0 jour (réservation consécutive), soit au moins ${requiredGap} jours entre les réservations en haute saison. (${daysAfter} jours après)` 
          };
        }
      }
    }
  }
  
  return { valid: true };
}

export function ReservationForm({ onSubmit, isLoading, selectedStartDate, selectedEndDate, existingReservations = [] }: ReservationFormProps) {
  const { rules, refreshRules } = useBookingRules();
  const [formData, setFormData] = useState<ReservationFormData>({
    startDate: null,
    endDate: null,
    lastName: "",
    firstName: "",
    address: "",
    locality: "",
    city: "",
    email: "",
    phone: "",
    numberOfPeople: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form dates when calendar selection changes
  useEffect(() => {
    if (selectedStartDate) {
      setFormData(prev => ({ ...prev, startDate: selectedStartDate }));
    }
  }, [selectedStartDate]);

  useEffect(() => {
    if (selectedEndDate) {
      setFormData(prev => ({ ...prev, endDate: selectedEndDate }));
    }
  }, [selectedEndDate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // These functions are no longer used since we're using non-interactive date display
  // But we keep them in case we need to revert to interactive date pickers
  /* 
  const handleStartDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, startDate: date }));
    if (errors.startDate) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.startDate;
        return newErrors;
      });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, endDate: date }));
    if (errors.endDate) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.endDate;
        return newErrors;
      });
    }
  };
  */

  // Refresh booking rules when component mounts
  useEffect(() => {
    refreshRules();
    // refreshRules is now stable thanks to useCallback in the provider
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = "La date d&apos;arrivée est requise";
    }

    if (!formData.endDate) {
      newErrors.endDate = "La date de départ est requise";
    }

    if (formData.startDate && formData.endDate) {
      if (formData.startDate >= formData.endDate) {
        newErrors.endDate = "La date de départ doit être après la date d&apos;arrivée";
      } else {
        // Validate against booking rules
        try {
          // Convert existingReservations to the format expected by validateBooking
          const formattedReservations = existingReservations.map(res => ({
            id: res.id,
            startDate: res.startDate instanceof Date ? res.startDate : new Date(res.startDate),
            endDate: res.endDate instanceof Date ? res.endDate : new Date(res.endDate)
          }));
          
          console.log("Validating booking with existing reservations:", formattedReservations);
          
          // Check if the reservation is consecutive with an existing reservation
          let isConsecutive = false;
          
          // Find the closest reservation before the requested dates
          const previousReservation = formattedReservations
            .filter(res => formData.startDate && res.endDate < formData.startDate)
            .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];
          
          // Find the closest reservation after the requested dates
          const nextReservation = formattedReservations
            .filter(res => formData.endDate && res.startDate > formData.endDate)
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];
          
          if (previousReservation && formData.startDate) {
            // Calculate days between reservations
            // If the previous reservation ends on day X and the new one starts on day X+1, they are consecutive (0 days gap)
            const normalizeDate = (date: Date): Date => {
              const normalized = new Date(date);
              normalized.setHours(0, 0, 0, 0);
              return normalized;
            };
            
            const normalizedStartDate = normalizeDate(formData.startDate);
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
          
          if (nextReservation && formData.endDate) {
            // Calculate days between reservations
            const normalizeDate = (date: Date): Date => {
              const normalized = new Date(date);
              normalized.setHours(0, 0, 0, 0);
              return normalized;
            };
            
            const normalizedEndDate = normalizeDate(formData.endDate);
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
          
          console.log("Is reservation consecutive?", isConsecutive);
          
          // Implement booking validation using rules from context
          const validation = validateBookingWithRules(formData.startDate, formData.endDate, formattedReservations, rules);
          
          if (!validation.valid && validation.reason) {
            newErrors.endDate = validation.reason;
          }
        } catch (error) {
          console.error("Error validating booking rules:", error);
          // Fall back to basic validation if booking rules validation fails
          const startMonth = formData.startDate.getMonth();
          if (startMonth >= 6 && startMonth <= 8) {
            // July (6) to September (8)
            const diffDays = differenceInDays(formData.endDate, formData.startDate);
            if (diffDays < 7) {
              newErrors.endDate = "Le séjour minimum en juillet-septembre est de 7 jours";
            }
          }
        }
      }
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!formData.address.trim()) {
      newErrors.address = "L&apos;adresse est requise";
    }

    if (!formData.locality.trim()) {
      newErrors.locality = "Le code postal est requis";
    } else if (!/^\d+$/.test(formData.locality)) {
      newErrors.locality = "Le code postal doit être un nombre";
    }

    if (!formData.city.trim()) {
      newErrors.city = "La localité est requise";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L&apos;adresse email est requise";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Adresse email invalide";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Le numéro de téléphone est requis";
    }

    if (!formData.numberOfPeople.trim()) {
      newErrors.numberOfPeople = "Le nombre de personnes est requis";
    } else if (!/^[1-9]$/.test(formData.numberOfPeople)) {
      newErrors.numberOfPeople = "Le nombre de personnes doit être entre 1 et 9";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Date d&apos;arrivée
          </label>
          <div className="block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm sm:text-sm text-gray-900">
            {formData.startDate ? format(formData.startDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionnez une date"}
          </div>
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Date de départ
          </label>
          <div className="block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm sm:text-sm text-gray-900">
            {formData.endDate ? format(formData.endDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionnez une date"}
          </div>
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      <Input
        label="Nom"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        placeholder="Entrez votre nom"
        error={errors.lastName}
      />

      <Input
        label="Prénom"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        placeholder="Entrez votre prénom"
        error={errors.firstName}
      />

      <Input
        label="Adresse"
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Entrez votre adresse"
        error={errors.address}
      />

      <Input
        label="Code postal"
        name="locality"
        type="number"
        value={formData.locality}
        onChange={handleChange}
        placeholder="Entrez votre code postal"
        error={errors.locality}
      />

      <Input
        label="Localité"
        name="city"
        value={formData.city}
        onChange={handleChange}
        placeholder="Entrez votre localité"
        error={errors.city}
      />

      <Input
        label="Adresse email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Entrez votre adresse email"
        error={errors.email}
      />

      <Input
        label="Numéro de téléphone"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Entrez votre numéro de téléphone"
        error={errors.phone}
      />

      <Input
        label="Nombre de personnes"
        type="number"
        min="1"
        max="9"
        name="numberOfPeople"
        value={formData.numberOfPeople}
        onChange={handleChange}
        placeholder="Entrez le nombre de personnes (1-9)"
        error={errors.numberOfPeople}
      />

      <Textarea
        label="Message (Optionnel)"
        name="message"
        value={formData.message}
        onChange={handleChange}
        placeholder="Demandes spéciales ou informations supplémentaires"
      />

      <Button type="submit" isLoading={isLoading} className="w-full">
        Envoyer la demande de réservation
      </Button>
    </form>
  );
}
