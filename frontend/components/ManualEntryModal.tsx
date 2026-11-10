"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  UserPlus, Table, Plus, Trash2, CheckCircle2, X,
  Clipboard, Calendar, ArrowRight, Sparkles
} from "lucide-react";
import { CategorizedAthlete } from "@/lib/api";
import { categorizeAthleteClient, DEFAULT_RULES } from "@/lib/rules";
import { DivisionBadge } from "@/components/DivisionBadge";

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAthlete: (athlete: CategorizedAthlete) => void;
  onAddBulkAthletes: (athletes: CategorizedAthlete[]) => void;
  existingClubs?: string[];
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onAddAthlete,
  onAddBulkAthletes,
}) => {
  const [activeTab, setActiveTab] = useState<"single" | "grid">("single");

  // Single Form State
  const [singleName, setSingleName] = useState("");
  const [singleDob, setSingleDob] = useState("");
  const [singleGender, setSingleGender] = useState<"M" | "F">("M");
  const [singleWeight, setSingleWeight] = useState<string>("32.0");
  const [singleHeight, setSingleHeight] = useState<string>("");
  const [singleClub, setSingleClub] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  const datePickerRef = useRef<HTMLInputElement>(null);

  // Live Reactive Categorization for Single Form
  const liveCategory = useMemo(() => {
    return categorizeAthleteClient(
      {
        name: singleName.trim() || "ATHLETE PREVIEW",
        dob: singleDob.trim() || null,
        gender: singleGender,
        weight_kg: parseFloat(singleWeight) || 30.0,
        height_cm: singleHeight ? parseFloat(singleHeight) : null,
        club: singleClub.trim() || null,
      },
      DEFAULT_RULES
    );
  }, [singleName, singleDob, singleGender, singleWeight, singleHeight, singleClub]);

  // Quick Grid State
  const [gridRows, setGridRows] = useState<
    Array<{
      name: string;
      dob: string;
      gender: "M" | "F";
      weight: string;
      height: string;
      club: string;
    }>
  >([
    { name: "", dob: "", gender: "M", weight: "", height: "", club: "" },
    { name: "", dob: "", gender: "F", weight: "", height: "", club: "" },
    { name: "", dob: "", gender: "M", weight: "", height: "", club: "" },
    { name: "", dob: "", gender: "F", weight: "", height: "", club: "" },
  ]);

  if (!isOpen) return null;

  // Single submit handler
  const handleSingleSubmit = (e?: React.FormEvent, addAnother: boolean = false) => {
    if (e) e.preventDefault();
    if (!singleName.trim()) {
      alert("Please enter athlete's name.");
      return;
    }

    onAddAthlete(liveCategory);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);

    if (addAnother) {
      setSingleName("");
      setSingleDob("");
      setSingleWeight("32.0");
      setSingleHeight("");
    } else {
      onClose();
    }
  };

  // Handle native date picker selection
  const handleCalendarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split("-");
      setSingleDob(`${d}/${m}/${y}`);
    }
  };

  // Adjust weight helper
  const adjustWeight = (delta: number) => {
    const current = parseFloat(singleWeight) || 30.0;
    const next = Math.max(10, Math.min(150, current + delta));
    setSingleWeight(next.toFixed(1));
  };

  // Adjust height helper
  const adjustHeight = (delta: number) => {
    const current = parseFloat(singleHeight) || 135.0;
    const next = Math.max(80, Math.min(220, current + delta));
    setSingleHeight(next.toFixed(1));
  };

  // Quick Grid helpers
  const handleAddGridRows = (count: number = 5) => {
    const newRows = Array.from({ length: count }, () => ({
      name: "",
      dob: "",
      gender: "M" as const,
      weight: "",
      height: "",
      club: singleClub || "",
    }));
    setGridRows([...gridRows, ...newRows]);
  };

  const updateGridCell = (idx: number, field: string, val: any) => {
    setGridRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleDeleteGridRow = (idx: number) => {
    setGridRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const parsedRows: any[] = [];

      for (const line of lines) {
        const parts = line.split("\t");
        if (parts.length >= 2) {
          const rawGender = (parts[2] || "").trim().toUpperCase();
          const genderNorm =
            rawGender.startsWith("F") || rawGender === "GIRL" || rawGender === "G" ? "F" : "M";

          parsedRows.push({
            name: parts[0] || "",
            dob: parts[1] || "",
            gender: genderNorm,
            weight: parts[3] || "32",
            height: parts[4] || "",
            club: parts[5] || "",
          });
        }
      }

      if (parsedRows.length > 0) {
        const existingNonEmpty = gridRows.filter((r) => r.name.trim());
        setGridRows([...existingNonEmpty, ...parsedRows]);
      }
    } catch {
      alert("Please allow clipboard access to paste rows from spreadsheet.");
    }
  };

  const handleSaveGrid = () => {
    const validRows = gridRows.filter((r) => r.name.trim() && r.weight.trim());
    if (validRows.length === 0) {
      alert("Please enter at least one athlete with Name and Weight.");
      return;
    }

    const categorizedList = validRows.map((r, idx) => {
      return categorizeAthleteClient(
        {
          sr_no: idx + 1,
          name: r.name,
          dob: r.dob || null,
          gender: r.gender,
          weight_kg: parseFloat(r.weight) || 30.0,
          height_cm: r.height ? parseFloat(r.height) : null,
          club: r.club || null,
        },
        DEFAULT_RULES
      );
    });

    onAddBulkAthletes(categorizedList);
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
        {/* Modal Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <span>Manual Entry</span>
          </h2>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="flex gap-1 rounded-md bg-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab("single")}
                className={`rounded px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide transition-colors ${
                  activeTab === "single"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Single entry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("grid")}
                className={`rounded px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide transition-colors ${
                  activeTab === "grid"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Quick grid
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Single Entry */}
        {activeTab === "single" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_260px]">
              {/* Left Column: Form Fields */}
              <form onSubmit={(e) => handleSingleSubmit(e, false)} className="grid gap-3">
                {/* 1. Athlete Name */}
                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="e.g. ADITYA VERMA"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold tracking-wide uppercase placeholder:normal-case placeholder:font-normal text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {/* 2. Gender Selection (Tactile Block Buttons) */}
                <div className="grid gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Gender *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleGender("M")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border-2 font-display text-sm font-bold uppercase transition-all ${
                        singleGender === "M"
                          ? "border-male bg-male/15 text-male shadow-xs"
                          : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                    >
                      <span>👦 MALE / BOY</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleGender("F")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border-2 font-display text-sm font-bold uppercase transition-all ${
                        singleGender === "F"
                          ? "border-female bg-female/15 text-female shadow-xs"
                          : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                    >
                      <span>👧 FEMALE / GIRL</span>
                    </button>
                  </div>
                </div>

                {/* 3. DOB & Calendar Picker */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      DOB
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={singleDob}
                        onChange={(e) => setSingleDob(e.target.value)}
                        placeholder="DD/MM/YYYY or YYYY-MM-DD"
                        className="h-10 w-full rounded-md border border-input bg-background pl-3 pr-9 text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {/* Hidden native calendar trigger */}
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
                        title="Open visual calendar"
                        className="absolute right-2 p-1 text-muted-foreground hover:text-primary rounded transition-colors"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Club */}
                  <div className="grid gap-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Club / Team
                    </label>
                    <input
                      type="text"
                      value={singleClub}
                      onChange={(e) => setSingleClub(e.target.value)}
                      placeholder="e.g. Tiger TKD Academy"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* 4. Weight and Height */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Weight (kg) */}
                  <div className="grid gap-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Weight (kg) *
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => adjustWeight(-0.5)}
                        className="h-10 px-3 rounded-l-md border border-r-0 border-input bg-muted hover:bg-muted/80 font-bold text-foreground transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={singleWeight}
                        onChange={(e) => setSingleWeight(e.target.value)}
                        placeholder="27.5"
                        className="h-10 w-full border-y border-input bg-background px-2 text-center text-sm font-bold tabular-nums text-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustWeight(0.5)}
                        className="h-10 px-3 rounded-r-md border border-l-0 border-input bg-muted hover:bg-muted/80 font-bold text-foreground transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Height (cm) */}
                  <div className="grid gap-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Height (cm) <span className="opacity-70">(Sub-Jr)</span>
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => adjustHeight(-1)}
                        className="h-10 px-3 rounded-l-md border border-r-0 border-input bg-muted hover:bg-muted/80 font-bold text-foreground transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        value={singleHeight}
                        onChange={(e) => setSingleHeight(e.target.value)}
                        placeholder="Sub-Jr only"
                        className="h-10 w-full border-y border-input bg-background px-2 text-center text-sm font-medium tabular-nums text-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustHeight(1)}
                        className="h-10 px-3 rounded-r-md border border-l-0 border-input bg-muted hover:bg-muted/80 font-bold text-foreground transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  {savedToast && (
                    <div className="p-2 rounded bg-success/15 text-success text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4" /> Athlete Added to Roster!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!singleName.trim()}
                    className="h-10 w-full rounded-md bg-primary text-primary-foreground font-display text-sm font-bold uppercase tracking-wide hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    Add Athlete
                  </button>

                  <button
                    type="button"
                    disabled={!singleName.trim()}
                    onClick={(e) => handleSingleSubmit(e, true)}
                    className="h-9 w-full rounded-md border border-input bg-background text-foreground text-xs font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    Add & Continue Next
                  </button>
                </div>
              </form>

              {/* Right Column: Live category preview matching Lovable */}
              <div className="rounded-lg border border-border bg-muted/40 bg-hero p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Live category
                  </div>

                  <div className="mt-2">
                    <DivisionBadge group={liveCategory.age_group} className="text-sm" />
                  </div>

                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Age</dt>
                      <dd className="font-medium tabular-nums">
                        {liveCategory.calculated_age == null
                          ? "—"
                          : `${liveCategory.calculated_age} yrs`}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Weight class</dt>
                      <dd className="font-medium">{liveCategory.weight_class}</dd>
                    </div>
                    {liveCategory.age_group === "Sub-Jr" && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Height bracket</dt>
                        <dd className="font-medium">{liveCategory.height_category ?? "—"}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-3 rounded bg-background/60 p-2 font-display text-sm font-semibold text-foreground border border-border/50">
                    {liveCategory.full_category}
                  </div>

                  {singleName.trim() && liveCategory.notes && liveCategory.notes.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-warning">
                      {liveCategory.notes.map((note, idx) => (
                        <li key={idx}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                  Changes update category automatically in real-time.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Quick Grid */}
        {activeTab === "grid" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <p className="text-muted-foreground">
                Paste straight from Excel or Google Sheets (Name, DOB, Gender, Weight, Height, Club).
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-2.5 py-1.5 rounded-md border border-input bg-background hover:bg-muted font-medium text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <Clipboard className="h-3.5 w-3.5 text-primary" />
                  <span>Paste clipboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddGridRows(5)}
                  className="px-2.5 py-1.5 rounded-md border border-input bg-background hover:bg-muted font-medium text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+5 rows</span>
                </button>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="w-8 px-2 py-1.5 text-center">#</th>
                    <th className="px-2 py-1.5 text-left font-medium min-w-[140px]">Name *</th>
                    <th className="px-2 py-1.5 text-left font-medium w-32">Gender</th>
                    <th className="px-2 py-1.5 text-left font-medium w-32">DOB</th>
                    <th className="px-2 py-1.5 text-left font-medium w-24">Weight</th>
                    <th className="px-2 py-1.5 text-left font-medium w-24">Height</th>
                    <th className="px-2 py-1.5 text-left font-medium min-w-[120px]">Club</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {gridRows.map((row, idx) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/20">
                      <td className="px-2 text-xs text-muted-foreground text-center tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="p-0">
                        <input
                          type="text"
                          className="w-full bg-transparent px-2 py-1.5 uppercase font-medium outline-none focus:bg-accent text-foreground"
                          placeholder="Athlete Name"
                          value={row.name}
                          onChange={(e) => updateGridCell(idx, "name", e.target.value)}
                        />
                      </td>
                      <td className="p-0">
                        <select
                          className="w-full bg-transparent px-2 py-1.5 outline-none focus:bg-accent font-semibold text-foreground"
                          value={row.gender}
                          onChange={(e) => updateGridCell(idx, "gender", e.target.value)}
                        >
                          <option value="M">👦 Male</option>
                          <option value="F">👧 Female</option>
                        </select>
                      </td>
                      <td className="p-0">
                        <input
                          type="text"
                          className="w-full bg-transparent px-2 py-1.5 tabular-nums outline-none focus:bg-accent text-foreground"
                          placeholder="DD/MM/YYYY"
                          value={row.dob}
                          onChange={(e) => updateGridCell(idx, "dob", e.target.value)}
                        />
                      </td>
                      <td className="p-0">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full bg-transparent px-2 py-1.5 tabular-nums font-bold outline-none focus:bg-accent text-foreground"
                          placeholder="kg"
                          value={row.weight}
                          onChange={(e) => updateGridCell(idx, "weight", e.target.value)}
                        />
                      </td>
                      <td className="p-0">
                        <input
                          type="number"
                          step="0.5"
                          className="w-full bg-transparent px-2 py-1.5 tabular-nums outline-none focus:bg-accent text-foreground"
                          placeholder="cm"
                          value={row.height}
                          onChange={(e) => updateGridCell(idx, "height", e.target.value)}
                        />
                      </td>
                      <td className="p-0">
                        <input
                          type="text"
                          className="w-full bg-transparent px-2 py-1.5 outline-none focus:bg-accent text-foreground"
                          placeholder="Club"
                          value={row.club}
                          onChange={(e) => updateGridCell(idx, "club", e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="p-1 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteGridRow(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-muted-foreground">
                {gridRows.filter((r) => r.name.trim()).length} athletes entered
              </span>
              <button
                type="button"
                disabled={!gridRows.some((r) => r.name.trim() && r.weight.trim())}
                onClick={handleSaveGrid}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-display text-xs font-bold uppercase tracking-wide hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
              >
                Categorize & add {gridRows.filter((r) => r.name.trim()).length} athletes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
