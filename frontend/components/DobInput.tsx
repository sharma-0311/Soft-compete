"use client";

import React, { useRef } from "react";
import { Calendar } from "lucide-react";

interface DobInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  compact?: boolean;
  className?: string;
  title?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Formats DOB text automatically as DD/MM/YYYY while typing digits or spaces/dashes.
 * Examples:
 *  - "13 11 2004" -> "13/11/2004"
 *  - "13112004"   -> "13/11/2004"
 *  - "5 2 2013"   -> "05/02/2013"
 */
export function formatDobAutoSlash(rawNext: string, prev: string): string {
  // Allow clean backspace when user deletes characters or trailing "/"
  if (rawNext.length < prev.length) {
    return rawNext;
  }

  // Handle pressing space, hyphen, dot, or slash as delimiter -> pad single digit and add "/"
  if (/[\s.\-]$/.test(rawNext)) {
    const cleaned = rawNext.replace(/[\s.\-]+/g, "/");
    const parts = cleaned.split("/");
    // Pad single-digit day or month (e.g. "5/" -> "05/")
    if (parts.length === 2 && parts[0].length === 1 && parts[1] === "") {
      return `0${parts[0]}/`;
    }
    if (parts.length === 3 && parts[1].length === 1 && parts[2] === "") {
      return `${parts[0].padStart(2, "0")}/0${parts[1]}/`;
    }
    return cleaned.slice(0, 10);
  }

  // Normalize any delimiter groups (spaces, dots, dashes) to "/"
  const normalizedSeparators = rawNext.replace(/[\s.\-]+/g, "/");

  // If pasted or entered with spaces like "13 11 2004" or "5 2 2013"
  if (normalizedSeparators.includes("/") && rawNext.length - prev.length > 1) {
    const segs = normalizedSeparators.split("/").filter((s, idx) => idx < 3);
    if (segs.length >= 2) {
      const dd = segs[0].slice(0, 2).padStart(2, "0");
      const mm = segs[1].slice(0, 2).padStart(2, "0");
      const yyyy = (segs[2] || "").slice(0, 4);
      return yyyy ? `${dd}/${mm}/${yyyy}` : `${dd}/${mm}/`;
    }
  }

  // Extract only digits for automatic "/" insertion
  const digits = normalizedSeparators.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 1) return digits;
  if (digits.length === 2) return `${digits}/`;
  if (digits.length <= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/** Converts DD/MM/YYYY to YYYY-MM-DD for native <input type="date"> value */
function toIsoValue(displayVal: string): string {
  const m = displayVal.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export const DobInput: React.FC<DobInputProps> = ({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  compact = false,
  className = "",
  title = "Type DOB (e.g. 13 11 2004 auto-formats to 13/11/2004) or click the calendar icon",
  onKeyDown,
}) => {
  const pickerRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDobAutoSlash(e.target.value, value);
    onChange(formatted);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value; // YYYY-MM-DD
    if (iso) {
      const [y, m, d] = iso.split("-");
      onChange(`${d}/${m}/${y}`);
    }
  };

  const openCalendar = () => {
    const el = pickerRef.current;
    if (!el) return;
    try {
      if (typeof (el as any).showPicker === "function") {
        (el as any).showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        value={value}
        onChange={handleTextChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        title={title}
        className={`w-full rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 transition-shadow ${
          compact ? "h-8 pl-2 pr-7 text-xs font-mono" : "h-10 pl-3 pr-9 text-sm"
        }`}
      />
      <button
        type="button"
        onClick={openCalendar}
        title="Open calendar date picker"
        aria-label="Open calendar date picker"
        className={`absolute right-1 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
          compact ? "h-6 w-6" : "h-8 w-8"
        }`}
      >
        <Calendar className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={toIsoValue(value)}
        onChange={handlePickerChange}
        className="sr-only"
      />
    </div>
  );
};

