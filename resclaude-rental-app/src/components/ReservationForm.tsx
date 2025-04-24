"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";

interface ReservationFormProps {
  onSubmit: (data: ReservationFormData) => void;
  isLoading: boolean;
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
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

export function ReservationForm({ onSubmit, isLoading, selectedStartDate, selectedEndDate }: ReservationFormProps) {
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

  const validateForm = (): boolean => {
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
      }

      // Check minimum stay requirement (7 days in July-September)
      const startMonth = formData.startDate.getMonth();
      if (startMonth >= 6 && startMonth <= 8) {
        // July (6) to September (8)
        const diffDays = differenceInDays(formData.endDate, formData.startDate);
        if (diffDays < 7) {
          newErrors.endDate = "Le séjour minimum en juillet-septembre est de 7 jours";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
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
