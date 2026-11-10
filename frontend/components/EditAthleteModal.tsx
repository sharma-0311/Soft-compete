"use client";

import React, { useState, useMemo, useRef } from "react";
import { Edit3, X, Calendar, Sparkles } from "lucide-react";
import { CategorizedAthlete } from "@/lib/api";
import { categorizeAthleteClient, DEFAULT_RULES } from "@/lib/rules";
import { DivisionBadge } from "@/components/DivisionBadge";

interface EditAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: CategorizedAthlete | null;
  onSave: (updated: CategorizedAthlete) => void;
}

export const EditAthleteModal: React.FC<EditAthleteModalProps> = ({
  isOpen,
  onClose,
  athlete,
  onSave,
}) => {
  if (!isOpen || !athlete) return null;

  const [name, setName] = useState(athlete.name);
  const [dob, setDob] = useState(athlete.dob || "");
  const [gender, setGender] = useState<"M" | "F">(athlete.gender === "F" ? "F" : "M");
  const [weight, setWeight] = useState(athlete.weight_kg ? athlete.weight_kg.toString() : "32");
  const [height, setHeight] = useState(athlete.height_cm ? athlete.height_cm.toString() : "");
  const [club, setClub] = useState(athlete.club || "");

  const datePickerRef = useRef<HTMLInputElement>(null);

  // Live Recategorization
  const liveRecat = useMemo(() => {
    return categorizeAthleteClient(
      {
        id: athlete.id,
        sr_no: athlete.sr_no,
        name: name || athlete.name,
        dob: dob || null,
        gender,
        weight_kg: parseFloat(weight) || athlete.weight_kg,
        height_cm: height ? parseFloat(height) : null,
        club: club || null,
      },
      DEFAULT_RULES
    );
  }, [athlete, name, dob, gender, weight, height, club]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...athlete,
      ...liveRecat,
      name: name.trim().toUpperCase(),
      club: club.trim() || undefined,
    });
    onClose();
  };

  const handleCalendarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [y, m, d] = val.split("-");
      setDob(`${d}/${m}/${y}`);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card text-card-foreground rounded-lg border border-border shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            <span>Edit Athlete #{athlete.sr_no}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body with 2 Columns */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            {/* Left Column: Form Fields */}
            <form onSubmit={handleSubmit} className="grid gap-3">
              {/* Name */}
              <div className="grid gap-1">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold tracking-wide uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Gender (Tactile Blocks) */}
              <div className="grid gap-1">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Gender *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender("M")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md border-2 font-display text-sm font-bold uppercase transition-all ${
                      gender === "M"
                        ? "border-male bg-male/15 text-male shadow-xs"
                        : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                  >
                    <span>👦 MALE / BOY</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("F")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md border-2 font-display text-sm font-bold uppercase transition-all ${
                      gender === "F"
                        ? "border-female bg-female/15 text-female shadow-xs"
                        : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                  >
                    <span>👧 FEMALE / GIRL</span>
                  </button>
                </div>
              </div>

              {/* DOB & Club */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    DOB
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="h-10 w-full rounded-md border border-input bg-background pl-3 pr-9 text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <input
                      ref={datePickerRef}
                      type="date"
                      onChange={handleCalendarPick}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        datePickerRef.current?.showPicker
                          ? datePickerRef.current.showPicker()
                          : datePickerRef.current?.click()
                      }
                      title="Open calendar"
                      className="absolute right-2 p-1 text-muted-foreground hover:text-primary rounded transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Club / Team
                  </label>
                  <input
                    type="text"
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-bold tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Height (cm) <span className="opacity-70">(Sub-Jr)</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Sub-Jr only"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="h-10 flex-1 rounded-md bg-primary text-primary-foreground font-display text-sm font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 rounded-md border border-input bg-background text-foreground text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Right Column: Live Recategorization Preview Card */}
            <div className="rounded-lg border border-border bg-muted/40 bg-hero p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Updated category
                </div>

                <div className="mt-2">
                  <DivisionBadge group={liveRecat.age_group} className="text-sm" />
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Age</dt>
                    <dd className="font-medium tabular-nums">
                      {liveRecat.calculated_age == null
                        ? "—"
                        : `${liveRecat.calculated_age} yrs`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Weight class</dt>
                    <dd className="font-medium">{liveRecat.weight_class}</dd>
                  </div>
                  {liveRecat.age_group === "Sub-Jr" && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Height bracket</dt>
                      <dd className="font-medium">{liveRecat.height_category ?? "—"}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-3 rounded bg-background/60 p-2 font-display text-sm font-semibold text-foreground border border-border/50">
                  {liveRecat.full_category}
                </div>

                {liveRecat.notes && liveRecat.notes.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-warning">
                    {liveRecat.notes.map((note, idx) => (
                      <li key={idx}>• {note}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                Official federation rules apply automatically.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
