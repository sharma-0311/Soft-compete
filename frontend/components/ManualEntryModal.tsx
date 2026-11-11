"use client";

import React, { useState, useMemo } from "react";
import {
  Plus, Trash2, CheckCircle2, X, Clipboard, AlertTriangle
} from "lucide-react";
import { CategorizedAthlete, RulesConfig } from "@/lib/api";
import { categorizeAthleteClient, DEFAULT_RULES, parseDateString } from "@/lib/rules";
import { DivisionBadge } from "@/components/DivisionBadge";
import { DobInput } from "@/components/DobInput";

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAthlete: (athlete: CategorizedAthlete) => void;
  onAddBulkAthletes: (athletes: CategorizedAthlete[]) => void;
  existingClubs?: string[];
  existingAthletes?: CategorizedAthlete[];
  rules?: RulesConfig;
  eventName?: string;
}

interface GridRow {
  name: string;
  dob: string;
  gender: "M" | "F";
  weight: string;
  height: string;
  club: string;
}

const EMPTY_ROW = (club: string = ""): GridRow => ({
  name: "",
  dob: "",
  gender: "M",
  weight: "",
  height: "",
  club,
});

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onAddAthlete,
  onAddBulkAthletes,
  existingClubs = [],
  existingAthletes = [],
  rules = DEFAULT_RULES,
  eventName,
}) => {
  const [activeTab, setActiveTab] = useState<"single" | "grid">("single");

  // Single Entry State
  const [singleName, setSingleName] = useState("");
  const [singleDob, setSingleDob] = useState("");
  const [singleGender, setSingleGender] = useState<"M" | "F">("F");
  const [singleWeight, setSingleWeight] = useState<string>("");
  const [singleHeight, setSingleHeight] = useState<string>("");
  const [singleClub, setSingleClub] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  // Quick Grid (Bulk) State
  const [gridRows, setGridRows] = useState<GridRow[]>([
    EMPTY_ROW(),
    { ...EMPTY_ROW(), gender: "F" },
    EMPTY_ROW(),
    { ...EMPTY_ROW(), gender: "F" },
    EMPTY_ROW(),
  ]);

  const parsedWeight = singleWeight.trim() ? parseFloat(singleWeight) : null;
  const parsedHeight = singleHeight.trim() ? parseFloat(singleHeight) : null;

  // Live reactive categorization for single athlete
  const liveCategory = useMemo(() => {
    return categorizeAthleteClient(
      {
        name: singleName.trim() || "ATHLETE PREVIEW",
        dob: singleDob.trim() || null,
        gender: singleGender,
        weight_kg: parsedWeight && parsedWeight > 0 ? parsedWeight : null,
        height_cm: parsedHeight && parsedHeight > 0 ? parsedHeight : null,
        club: singleClub.trim() || null,
      },
      rules
    );
  }, [singleName, singleDob, singleGender, parsedWeight, parsedHeight, singleClub, rules]);

  // Duplicate check
  const duplicateAthlete = useMemo(() => {
    const targetName = singleName.trim().toUpperCase();
    if (!targetName) return null;
    const dobParsed = parseDateString(singleDob);
    const dobIso = dobParsed
      ? `${dobParsed.getFullYear()}-${String(dobParsed.getMonth() + 1).padStart(2, "0")}-${String(dobParsed.getDate()).padStart(2, "0")}`
      : null;
    return (
      existingAthletes.find(
        (a) =>
          a.name.trim().toUpperCase() === targetName &&
          (!dobIso || !a.dob || a.dob === dobIso)
      ) || null
    );
  }, [singleName, singleDob, existingAthletes]);

  // Preview rows for Quick Grid
  const validGridCount = useMemo(
    () =>
      gridRows.filter(
        (r) =>
          r.name.trim() &&
          ((r.weight.trim() && parseFloat(r.weight) > 0) ||
            (r.height.trim() && parseFloat(r.height) > 0))
      ).length,
    [gridRows]
  );

  if (!isOpen) return null;

  const birthDateObj = parseDateString(singleDob);
  const birthYear = birthDateObj ? birthDateObj.getFullYear() : null;
  const hasMeasurement =
    (parsedWeight !== null && !isNaN(parsedWeight) && parsedWeight > 0) ||
    (parsedHeight !== null && !isNaN(parsedHeight) && parsedHeight > 0);
  const categorizedByHeight =
    (!parsedWeight || parsedWeight <= 0) && parsedHeight !== null && parsedHeight > 0;

  const handleSingleSubmit = (e?: React.FormEvent, addAnother: boolean = false) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!singleName.trim()) {
      setFormError("Please enter the athlete's full name.");
      return;
    }
    if (!hasMeasurement) {
      setFormError("Please enter either Declared weight (kg) or Height (cm).");
      return;
    }

    onAddAthlete(liveCategory);
    setSingleName("");
    setSingleDob("");
    setSingleWeight("");
    setSingleHeight("");
    setFormError(null);

    if (addAnother) {
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } else {
      setSavedToast(false);
      onClose();
    }
  };

  // Grid operations
  const handleAddGridRows = (count: number = 1) => {
    const newRows = Array.from({ length: count }, () => EMPTY_ROW(singleClub));
    setGridRows((prev) => [...prev, ...newRows]);
  };

  const updateGridCell = (idx: number, field: keyof GridRow, val: any) => {
    setGridRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleDeleteGridRow = (idx: number) => {
    setGridRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [EMPTY_ROW()]));
  };

  const handleClearGrid = () => {
    setGridRows([
      EMPTY_ROW(),
      { ...EMPTY_ROW(), gender: "F" },
      EMPTY_ROW(),
      { ...EMPTY_ROW(), gender: "F" },
      EMPTY_ROW(),
    ]);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const parsedRows: GridRow[] = [];

      for (const line of lines) {
        const parts = line.split("\t");
        if (parts.length >= 2) {
          const rawGender = (parts[2] || "").trim().toUpperCase();
          const genderNorm: "M" | "F" =
            rawGender.startsWith("F") || rawGender === "GIRL" || rawGender === "G" ? "F" : "M";
          parsedRows.push({
            name: parts[0] || "",
            dob: parts[1] || "",
            gender: genderNorm,
            weight: parts[3] || "",
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
      alert("Please allow clipboard access to paste rows copied from Excel.");
    }
  };

  const handleSaveGrid = () => {
    const validRows = gridRows.filter(
      (r) =>
        r.name.trim() &&
        ((r.weight.trim() && parseFloat(r.weight) > 0) ||
          (r.height.trim() && parseFloat(r.height) > 0))
    );
    if (validRows.length === 0) {
      alert("Please enter at least one athlete with Name and either Weight or Height.");
      return;
    }

    const categorizedList = validRows.map((r, idx) => {
      const w = r.weight.trim() ? parseFloat(r.weight) : null;
      const h = r.height.trim() ? parseFloat(r.height) : null;
      return categorizeAthleteClient(
        {
          sr_no: idx + 1,
          name: r.name,
          dob: r.dob || null,
          gender: r.gender,
          weight_kg: w && w > 0 ? w : null,
          height_cm: h && h > 0 ? h : null,
          club: r.club || null,
        },
        rules
      );
    });

    onAddBulkAthletes(categorizedList);
    onClose();
  };

  const genderLabel = liveCategory.gender === "M" ? "Male" : "Female";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-[1px] animate-in fade-in duration-150"
    >
      {/* Right Slide-Over Drawer (Matches Reference Sheet Layout) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-card text-card-foreground h-full shadow-2xl border-l border-border flex flex-col transition-all duration-200 ${activeTab === "single" ? "w-full max-w-[480px]" : "w-full max-w-[1180px]"
          }`}
      >
        {/* 1. Drawer Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border/70 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Add athlete
              </h2>
              {eventName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Competition: <span className="font-semibold text-primary">{eventName}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close Add athlete drawer"
              aria-label="Close drawer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              <span>Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Tabs matching reference design */}
          <div className="flex items-center gap-2 mt-3.5">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              title="Add one athlete at a time with instant category preview"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "single"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-foreground hover:bg-muted"
                }`}
            >
              One athlete
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("grid")}
              title="Add multiple athletes together in a structured spreadsheet grid"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "grid"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-foreground hover:bg-muted"
                }`}
            >
              Quick Grid (many)
            </button>
          </div>
        </div>

        {/* 2. ONE ATHLETE FORM */}
        {activeTab === "single" && (
          <form
            onSubmit={(e) => handleSingleSubmit(e, false)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Saved Toast */}
              {savedToast && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Athlete saved! Form cleared for next entry.</span>
                </div>
              )}

              {/* Validation Error */}
              {formError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="e.g. Nisha Tiwari"
                  title="Enter athlete's full name"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>

              {/* Date of Birth & Gender (2-Column Row) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Date of birth
                  </label>
                  <DobInput
                    value={singleDob}
                    onChange={setSingleDob}
                    placeholder="DD/MM/YYYY"
                    title="Type digits or spaces (e.g. 13 11 2004 auto-formats to 13/11/2004) or click calendar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Gender
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-10 p-1 rounded-lg border border-input bg-muted/50">
                    <button
                      type="button"
                      onClick={() => setSingleGender("M")}
                      title="Select Male division"
                      className={`rounded-md text-sm font-medium transition-all ${singleGender === "M"
                        ? "bg-card text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleGender("F")}
                      title="Select Female division"
                      className={`rounded-md text-sm font-medium transition-all ${singleGender === "F"
                        ? "bg-card text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>

              {/* Weight & Height (2-Column Row) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Declared weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="250"
                    value={singleWeight}
                    onChange={(e) => setSingleWeight(e.target.value)}
                    placeholder="Optional (e.g. 40.2)"
                    title="Enter weight in kg (optional — if omitted, category is assigned by height)"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Height (cm){" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {!singleWeight.trim() ? "— used if no weight" : "— optional"}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="260"
                    value={singleHeight}
                    onChange={(e) => setSingleHeight(e.target.value)}
                    placeholder="e.g. 139.5"
                    title="Enter height in cm (required if weight is omitted, also used for Sub-Junior height brackets)"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                  />
                </div>
              </div>

              {/* Club / Academy */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Club / academy
                </label>
                <input
                  type="text"
                  list="existing-clubs-list"
                  value={singleClub}
                  onChange={(e) => setSingleClub(e.target.value)}
                  placeholder="e.g. Vrindavan Dojang"
                  title="Enter club, school, or academy name"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
                <datalist id="existing-clubs-list">
                  {existingClubs.map((club) => (
                    <option key={club} value={club} />
                  ))}
                </datalist>
              </div>

              {/* Live Assigned Category Preview Card (Matches Screenshot Style) */}
              <div className="rounded-xl border border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  ASSIGNED CATEGORY (live preview)
                </div>

                <div className="mt-1.5 text-lg font-bold text-foreground">
                  {liveCategory.age_group} · {genderLabel} ·{" "}
                  {hasMeasurement ? liveCategory.weight_class : "Enter Weight or Height"}
                  {liveCategory.height_category && !categorizedByHeight && (
                    <span className="text-muted-foreground font-medium">
                      {" "}
                      · {liveCategory.height_category}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {liveCategory.calculated_age !== null
                      ? `Competition age ${liveCategory.calculated_age}${birthYear ? ` (${rules.event_year} - ${birthYear})` : ""
                      }.`
                      : "Enter DOB to compute competition age."}{" "}
                    Rule profile: Tournament {rules.event_year} v1.
                  </span>

                  {!hasMeasurement ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      Needs weight or height
                    </span>
                  ) : categorizedByHeight ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                      Assigned by Height
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Duplicate / Save Notice */}
              <div className="text-xs">
                {duplicateAthlete ? (
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Possible duplicate: <b>{duplicateAthlete.name}</b> is already in the roster.
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No duplicate found. Nothing is saved until you press Save.
                  </p>
                )}
              </div>
            </div>

            {/* Pinned Drawer Footer */}
            <div className="px-6 py-4 border-t border-border bg-card flex flex-wrap items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                title="Cancel without saving"
                className="h-10 px-4 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSingleSubmit(undefined, true)}
                title="Save this athlete and reset fields for the next entry"
                className="h-10 px-4 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition-colors"
              >
                Save and add another
              </button>
              <button
                type="submit"
                title="Save athlete to roster and close drawer"
                className="h-10 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors shadow-xs"
              >
                Save athlete
              </button>
            </div>
          </form>
        )}

        {/* 3. QUICK GRID (MANY) BULK MODE — Proper Spacing, Gridlines & Alignment */}
        {activeTab === "grid" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Grid Toolbar */}
            <div className="px-6 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddGridRows(1)}
                  title="Append 1 empty row"
                  className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add row</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddGridRows(5)}
                  title="Append 5 empty rows at once"
                  className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add 5 rows</span>
                </button>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  title="Paste copied Excel/TSV rows (Name, DOB, Gender, Weight, Height, Club)"
                  className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  <span>Paste from Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearGrid}
                  title="Reset grid back to blank rows"
                  className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-muted inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              <span className="text-xs text-muted-foreground">
                Weight is optional — if omitted, category is assigned by Height. DOB auto-inserts{" "}
                <code className="px-1 py-0.5 rounded bg-muted font-mono">/</code>.
              </span>
            </div>

            {/* Grid Table with Crisp Gridlines & Generous Cell Padding */}
            <div className="flex-1 overflow-auto p-6">
              <div className="rounded-xl border border-border overflow-x-auto shadow-xs bg-card">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/70 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="w-10 px-3 py-3 text-center border-r border-border">#</th>
                      <th className="min-w-[180px] px-3 py-3 text-left border-r border-border">
                        Full Name *
                      </th>
                      <th className="w-36 px-3 py-3 text-left border-r border-border">Gender</th>
                      <th className="w-44 px-3 py-3 text-left border-r border-border">
                        Date of Birth
                      </th>
                      <th className="w-28 px-3 py-3 text-left border-r border-border">
                        Weight (kg)
                      </th>
                      <th className="w-28 px-3 py-3 text-left border-r border-border">
                        Height (cm)
                      </th>
                      <th className="min-w-[140px] px-3 py-3 text-left border-r border-border">
                        Club / Academy
                      </th>
                      <th className="min-w-[210px] px-3 py-3 text-left border-r border-border">
                        Live Category Preview
                      </th>
                      <th className="w-12 px-2 py-3 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {gridRows.map((row, idx) => {
                      const wVal = row.weight.trim() ? parseFloat(row.weight) : null;
                      const hVal = row.height.trim() ? parseFloat(row.height) : null;
                      const hasRowMeas =
                        (wVal !== null && !isNaN(wVal) && wVal > 0) ||
                        (hVal !== null && !isNaN(hVal) && hVal > 0);
                      const rowPreview =
                        row.name.trim() || hasRowMeas
                          ? categorizeAthleteClient(
                            {
                              name: row.name || "ATHLETE",
                              dob: row.dob || null,
                              gender: row.gender,
                              weight_kg: wVal && wVal > 0 ? wVal : null,
                              height_cm: hVal && hVal > 0 ? hVal : null,
                              club: row.club || null,
                            },
                            rules
                          )
                          : null;

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-muted/25 transition-colors align-middle"
                        >
                          <td className="px-3 py-2.5 text-center text-xs font-mono text-muted-foreground border-r border-border">
                            {idx + 1}
                          </td>

                          <td className="px-2.5 py-2 border-r border-border">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateGridCell(idx, "name", e.target.value)}
                              placeholder="Athlete Name"
                              title="Enter full name"
                              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                            />
                          </td>

                          <td className="px-2.5 py-2 border-r border-border">
                            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-md border border-input bg-muted/50 h-8">
                              <button
                                type="button"
                                onClick={() => updateGridCell(idx, "gender", "M")}
                                title="Set gender to Male"
                                className={`rounded text-xs font-medium transition-colors ${row.gender === "M"
                                  ? "bg-card text-foreground shadow-xs font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                Male
                              </button>
                              <button
                                type="button"
                                onClick={() => updateGridCell(idx, "gender", "F")}
                                title="Set gender to Female"
                                className={`rounded text-xs font-medium transition-colors ${row.gender === "F"
                                  ? "bg-card text-foreground shadow-xs font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                Female
                              </button>
                            </div>
                          </td>

                          <td className="px-2.5 py-2 border-r border-border">
                            <DobInput
                              compact
                              value={row.dob}
                              onChange={(val) => updateGridCell(idx, "dob", val)}
                              placeholder="DD/MM/YYYY"
                              title="Enter DOB (e.g. 13 11 2004 auto-formats to 13/11/2004)"
                            />
                          </td>

                          <td className="px-2.5 py-2 border-r border-border">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="250"
                              value={row.weight}
                              onChange={(e) => updateGridCell(idx, "weight", e.target.value)}
                              placeholder="Optional"
                              title="Weight in kg (leave empty to categorize by Height)"
                              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                            />
                          </td>

                          <td className="px-2.5 py-2 border-r border-border">
                            <input
                              type="number"
                              step="0.1"
                              min="30"
                              max="260"
                              value={row.height}
                              onChange={(e) => updateGridCell(idx, "height", e.target.value)}
                              placeholder="cm"
                              title="Height in cm (used if weight omitted, or for Sub-Jr)"
                              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                            />
                          </td>

                          <td className="px-2.5 py-2 border-r border-border">
                            <input
                              type="text"
                              value={row.club}
                              onChange={(e) => updateGridCell(idx, "club", e.target.value)}
                              placeholder="Club / School"
                              title="Enter club or school name"
                              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                            />
                          </td>

                          <td className="px-3 py-2 border-r border-border">
                            {rowPreview && hasRowMeas ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <DivisionBadge group={rowPreview.age_group} />
                                <span className="text-xs font-medium text-foreground">
                                  {rowPreview.weight_class}
                                </span>
                                {rowPreview.height_category && rowPreview.weight_kg && (
                                  <span className="text-[11px] text-muted-foreground">
                                    · {rowPreview.height_category}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Enter Name & Wt/Ht
                              </span>
                            )}
                          </td>

                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteGridRow(idx)}
                              title="Remove this row"
                              aria-label="Remove row"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grid Footer */}
            <div className="px-6 py-4 border-t border-border bg-card flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{validGridCount}</span>{" "}
                athlete{validGridCount === 1 ? "" : "s"} ready to save
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  title="Discard grid entries and close"
                  className="h-10 px-4 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={validGridCount === 0}
                  onClick={handleSaveGrid}
                  title={
                    validGridCount > 0
                      ? `Save ${validGridCount} categorized athletes to roster`
                      : "Enter at least one valid athlete row to save"
                  }
                  className="h-10 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save {validGridCount > 0 ? `${validGridCount} Athletes` : "Athletes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
