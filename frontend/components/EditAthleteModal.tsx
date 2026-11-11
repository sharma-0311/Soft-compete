"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Edit3, X } from "lucide-react";
import { CategorizedAthlete, RulesConfig } from "@/lib/api";
import { categorizeAthleteClient, DEFAULT_RULES, formatDisplayDate } from "@/lib/rules";
import { DivisionBadge } from "@/components/DivisionBadge";
import { DobInput } from "@/components/DobInput";

interface EditAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: CategorizedAthlete | null;
  onSave: (updated: CategorizedAthlete) => void;
  rules?: RulesConfig;
}

export const EditAthleteModal: React.FC<EditAthleteModalProps> = ({
  isOpen,
  onClose,
  athlete,
  onSave,
  rules = DEFAULT_RULES,
}) => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [club, setClub] = useState("");

  useEffect(() => {
    if (isOpen && athlete) {
      setName(athlete.name || "");
      setDob(formatDisplayDate(athlete.dob) || "");
      setGender(athlete.gender === "F" ? "F" : "M");
      setWeight(athlete.weight_kg != null ? athlete.weight_kg.toString() : "");
      setHeight(athlete.height_cm != null ? athlete.height_cm.toString() : "");
      setClub(athlete.club || "");
    }
  }, [isOpen, athlete]);

  // Live Recategorization
  const liveRecat = useMemo(() => {
    if (!athlete) return null;
    const parsedW = weight.trim() ? parseFloat(weight) : null;
    const parsedH = height.trim() ? parseFloat(height) : null;
    const dobTrim = dob.trim();
    const fallbackAge =
      !dobTrim && !athlete.dob && athlete.calculated_age != null ? athlete.calculated_age : undefined;

    return categorizeAthleteClient(
      {
        id: athlete.id,
        sr_no: athlete.sr_no,
        name: name || athlete.name,
        dob: dobTrim || null,
        age_years: fallbackAge,
        gender,
        weight_kg: parsedW && parsedW > 0 ? parsedW : null,
        height_cm: parsedH && parsedH > 0 ? parsedH : null,
        club: club || null,
      },
      rules
    );
  }, [athlete, name, dob, gender, weight, height, club, rules]);

  if (!isOpen || !athlete || !liveRecat) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight.trim() && !height.trim()) return;
    onSave({
      ...athlete,
      ...liveRecat,
      name: name.trim().toUpperCase(),
      club: club.trim() || undefined,
      competition_age: liveRecat.calculated_age ?? null,
    });
    onClose();
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
            title="Close edit athlete modal"
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body with 2 Columns */}
        <div className="p-4 sm:p-5 overflow-y-auto thin-scrollbar">
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
                    title="Select Male / Boy division"
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md border-2 font-display text-sm font-bold uppercase transition-all ${gender === "M"
                        ? "border-male bg-male/15 text-male shadow-xs"
                        : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                  >
                    <span>Male / Boy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("F")}
                    title="Select Female / Girl division"
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md border-2 font-display text-sm font-bold uppercase transition-all ${gender === "F"
                        ? "border-female bg-female/15 text-female shadow-xs"
                        : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                  >
                    <span>Female / Girl</span>
                  </button>
                </div>
              </div>

              {/* DOB & Club */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    DOB
                  </label>
                  <DobInput value={dob} onChange={setDob} />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Weight (kg) <span className="opacity-70">(optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Uses height if empty"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-bold tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Fallback if no weight"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={!name.trim() || (!weight.trim() && !height.trim())}
                  title="Save changes and recalculate athlete category"
                  className="h-10 flex-1 rounded-md bg-primary text-primary-foreground font-display text-sm font-bold uppercase tracking-wide hover:bg-primary/90 disabled:opacity-45 transition-colors shadow-xs"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Discard edits and close modal"
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
