"use client";

import { forwardRef, useEffect } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Register French locale
registerLocale("fr", fr);

export interface DatePickerProps {
  label?: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  startDate?: Date | null;
  endDate?: Date | null;
  selectsStart?: boolean;
  selectsEnd?: boolean;
  minDate?: Date;
  maxDate?: Date;
  excludeDates?: Date[];
  placeholderText?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label,
      selected,
      onChange,
      startDate,
      endDate,
      selectsStart,
      selectsEnd,
      minDate,
      maxDate,
      excludeDates,
      placeholderText,
      error,
      className,
      disabled = false,
    },
    ref
  ) => {
    // Add custom styles for the date picker
    useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        .react-datepicker {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .react-datepicker__header {
          background-color: #f3f4f6;
          border-bottom: 1px solid #e5e7eb;
        }
        .react-datepicker__day--selected {
          background-color: #1e40af;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #3b82f6;
        }
        .react-datepicker__day:hover {
          background-color: #dbeafe;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }, []);

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <ReactDatePicker
          selected={selected}
          onChange={onChange}
          startDate={startDate}
          endDate={endDate}
          selectsStart={selectsStart}
          selectsEnd={selectsEnd}
          minDate={minDate}
          maxDate={maxDate}
          excludeDates={excludeDates}
          placeholderText={placeholderText}
          disabled={disabled}
          className={cn(
            "block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm text-gray-900",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          dateFormat="dd/MM/yyyy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          popperPlacement="bottom-start"
          locale="fr"
          monthsShown={1}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
