"use client";

import React, { useState, useMemo } from "react";
import {
  Search, ArrowUp, ArrowDown, ArrowUpDown, Pencil, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle, CheckSquare, Square,
  Check, X, FileSpreadsheet, Filter, Eye, ChevronDown
} from "lucide-react";
import { CategorizedAthlete, RulesConfig } from "@/lib/api";
import { categorizeAthleteClient, DEFAULT_RULES, formatDisplayDate } from "@/lib/rules";
import { DivisionBadge } from "@/components/DivisionBadge";
import { DobInput } from "@/components/DobInput";

interface AthletesTableProps {
  athletes: CategorizedAthlete[];
  filterAge: string;
  setFilterAge: (val: string) => void;
  onEditAthlete: (athlete: CategorizedAthlete) => void;
  onUpdateAthlete?: (updated: CategorizedAthlete) => void;
  onDeleteAthlete: (srNoOrId: number | string) => void;
  onDeleteSelected: (selectedIds: (number | string)[]) => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onOpenAddModal: () => void;
  rules?: RulesConfig;
}

const TABLE_COLUMNS = [
  { key: "sr_no", label: "Sr.", tip: "Sort by Serial Number" },
  { key: "name", label: "Name", tip: "Sort by Athlete Name" },
  { key: "gender", label: "G", tip: "Sort by Gender" },
  { key: "calculated_age", label: "Age / DOB", tip: "Sort by Competition Age" },
  { key: "weight_kg", label: "Wt (kg)", tip: "Sort by Weight (kg)" },
  { key: "height_cm", label: "Ht (cm)", tip: "Sort by Height (cm)" },
  { key: "full_category", label: "Assigned Category", tip: "Sort by Assigned Category" },
  { key: "club", label: "Club", tip: "Sort by Club / Academy" },
];

const DIVISIONS = ["All", "Sub-Jr", "Cadet", "Junior", "Senior"];

function getCategoryAssignmentMode(a: Pick<CategorizedAthlete, "weight_kg" | "height_category" | "age_group" | "weight_class">): "weight" | "height" | "unassigned" {
  if (a.age_group === "Unknown" || a.weight_class === "Unassigned") return "unassigned";
  if ((a.weight_kg === null || a.weight_kg === undefined) && a.height_category) return "height";
  return "weight";
}

function getVisiblePages(current: number, total: number): (number | "dots")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set<number>([0, total - 1, current, Math.max(0, current - 1), Math.min(total - 1, current + 1)]);
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | "dots")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("dots");
    out.push(sorted[i]);
  }
  return out;
}

export const AthletesTable: React.FC<AthletesTableProps> = ({
  athletes,
  filterAge,
  setFilterAge,
  onEditAthlete,
  onUpdateAthlete,
  onDeleteAthlete,
  onDeleteSelected,
  onExportExcel,
  rules = DEFAULT_RULES,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState<"All" | "M" | "F">("All");
  const [filterCategoryMode, setFilterCategoryMode] = useState<"All" | "weight" | "height" | "unassigned">("All");
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: number }>({
    key: "sr_no",
    dir: 1,
  });
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedKeys, setSelectedKeys] = useState<Set<number | string>>(new Set());

  // Inline cell editing state
  const [editingKey, setEditingKey] = useState<number | string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    gender: "M" | "F";
    dob: string;
    weight: string;
    height: string;
    club: string;
  }>({
    name: "",
    gender: "M",
    dob: "",
    weight: "",
    height: "",
    club: "",
  });

  // Division counts for badges in tabs
  const divisionCounts = useMemo(() => {
    const counts: Record<string, number> = { All: athletes.length };
    for (const a of athletes) {
      counts[a.age_group] = (counts[a.age_group] || 0) + 1;
    }
    return counts;
  }, [athletes]);

  const activeExtraFilters = (filterGender !== "All" ? 1 : 0) + (filterCategoryMode !== "All" ? 1 : 0);

  // Filtered & Sorted Athletes
  const filteredAthletes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = athletes.filter((a) => {
      const matchDivision = filterAge === "All" || a.age_group === filterAge;
      const matchGender = filterGender === "All" || a.gender === filterGender;
      const matchCategoryMode =
        filterCategoryMode === "All" || getCategoryAssignmentMode(a) === filterCategoryMode;
      const matchSearch =
        !query ||
        `${a.name} ${a.club ?? ""} ${a.full_category} ${a.weight_class}`
          .toLowerCase()
          .includes(query);
      return matchDivision && matchGender && matchCategoryMode && matchSearch;
    });

    const { key, dir } = sortConfig;
    return result.sort((a: any, b: any) => {
      const valA = a[key] ?? "";
      const valB = b[key] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * dir;
      }
      return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
    });
  }, [athletes, filterAge, filterGender, filterCategoryMode, searchQuery, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAthletes.length / pageSize));
  const validPage = Math.min(currentPage, totalPages - 1);
  const paginatedAthletes = filteredAthletes.slice(
    validPage * pageSize,
    validPage * pageSize + pageSize
  );
  const visiblePages = useMemo(() => getVisiblePages(validPage, totalPages), [validPage, totalPages]);

  // Live preview category for active inline-edited row
  const inlinePreview = useMemo(() => {
    if (editingKey === null) return null;
    const orig = athletes.find((a) => (a.id ?? a.sr_no ?? a.name) === editingKey) || null;
    const w = editDraft.weight.trim() ? parseFloat(editDraft.weight) : null;
    const h = editDraft.height.trim() ? parseFloat(editDraft.height) : null;
    const dobTrim = editDraft.dob.trim();
    const fallbackAge =
      !dobTrim && orig && !orig.dob && orig.calculated_age != null ? orig.calculated_age : undefined;

    return categorizeAthleteClient(
      {
        id: orig?.id,
        sr_no: orig?.sr_no,
        name: editDraft.name || "ATHLETE",
        dob: dobTrim || null,
        age_years: fallbackAge,
        gender: editDraft.gender,
        weight_kg: w && w > 0 ? w : null,
        height_cm: h && h > 0 ? h : null,
        club: editDraft.club || null,
      },
      rules
    );
  }, [editingKey, editDraft, athletes, rules]);

  const toggleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key ? -prev.dir : 1,
    }));
  };

  const handleToggleSelectAll = () => {
    if (selectedKeys.size === paginatedAthletes.length && paginatedAthletes.length > 0) {
      setSelectedKeys(new Set());
    } else {
      const next = new Set<number | string>();
      paginatedAthletes.forEach((a) => next.add(a.id ?? a.sr_no ?? a.name));
      setSelectedKeys(next);
    }
  };

  const handleToggleRow = (key: number | string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const startInlineEdit = (a: CategorizedAthlete, key: number | string) => {
    setEditingKey(key);
    setEditDraft({
      name: a.name || "",
      gender: a.gender === "F" ? "F" : "M",
      dob: formatDisplayDate(a.dob) || "",
      weight: a.weight_kg !== null && a.weight_kg !== undefined ? String(a.weight_kg) : "",
      height: a.height_cm !== null && a.height_cm !== undefined ? String(a.height_cm) : "",
      club: a.club || "",
    });
  };

  const cancelInlineEdit = () => {
    setEditingKey(null);
  };

  const saveInlineEdit = (original: CategorizedAthlete) => {
    if (!editDraft.name.trim()) return;
    const w = editDraft.weight.trim() ? parseFloat(editDraft.weight) : null;
    const h = editDraft.height.trim() ? parseFloat(editDraft.height) : null;
    const dobTrim = editDraft.dob.trim();
    const fallbackAge =
      !dobTrim && !original.dob && original.calculated_age != null
        ? original.calculated_age
        : undefined;

    const recategorized = categorizeAthleteClient(
      {
        id: original.id,
        sr_no: original.sr_no,
        name: editDraft.name,
        dob: dobTrim || null,
        age_years: fallbackAge,
        gender: editDraft.gender,
        weight_kg: w && w > 0 ? w : null,
        height_cm: h && h > 0 ? h : null,
        club: editDraft.club.trim() || null,
      },
      rules
    );

    const updated: CategorizedAthlete = {
      ...original,
      ...recategorized,
      id: original.id,
      sr_no: original.sr_no,
      competition_age: recategorized.calculated_age ?? null,
    };

    if (onUpdateAthlete) {
      onUpdateAthlete(updated);
    } else {
      onEditAthlete(updated);
    }
    setEditingKey(null);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent, original: CategorizedAthlete) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveInlineEdit(original);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelInlineEdit();
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs print:hidden">
      {/* 1. Header Toolbar: Division Pill Tabs, Search, Filters, Delete & Export */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-3.5">
        {/* Division Filter Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {DIVISIONS.map((div) => {
            const isActive = filterAge === div;
            const count = divisionCounts[div] ?? 0;
            return (
              <button
                key={div}
                type="button"
                onClick={() => {
                  setFilterAge(div);
                  setCurrentPage(0);
                }}
                title={`Filter roster to ${div === "Sub-Jr" ? "Sub-Junior" : div} athletes (${count})`}
                className={`h-8 rounded-lg px-3 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/75 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>{div}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] tabular-nums leading-none ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Search + Filters + Conditional Delete + Export */}
        <div className="flex flex-wrap items-center gap-2 ml-auto w-full lg:w-auto justify-end">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
              placeholder="Search name, club, category..."
              title="Search athletes by name, club, or category"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Clear search filter"
                aria-label="Clear search"
                className="absolute right-2 top-2 p-0.5 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Expandable Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            title="Filter athletes by gender or assigned category mode"
            className={`h-9 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs ${
              showFilters || activeExtraFilters > 0
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-muted text-foreground"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeExtraFilters > 0 && (
              <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[10px] font-bold">
                {activeExtraFilters}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {/* Always-Visible Bulk Delete Button (Active when >=1 row selected, disabled otherwise) */}
          <button
            type="button"
            disabled={selectedKeys.size === 0}
            onClick={() => {
              onDeleteSelected(Array.from(selectedKeys));
              setSelectedKeys(new Set());
            }}
            title={
              selectedKeys.size > 0
                ? `Delete ${selectedKeys.size} selected athlete${selectedKeys.size === 1 ? "" : "s"}`
                : "Select one or more rows using the checkboxes to enable Delete"
            }
            className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
              selectedKeys.size > 0
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs"
                : "border border-border bg-card text-muted-foreground opacity-50 cursor-not-allowed"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete{selectedKeys.size > 0 ? ` (${selectedKeys.size})` : ""}</span>
          </button>

          {/* Export Quick Action */}
          <button
            type="button"
            disabled={athletes.length === 0}
            onClick={onExportExcel}
            title={athletes.length ? "Export categorized multi-sheet Excel (.xlsx)" : "Add athletes first to export Excel"}
            className="h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Expandable Filter Controls Strip */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 border-b border-border bg-muted/25 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
              Gender:
            </span>
            {(["All", "M", "F"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setFilterGender(g);
                  setCurrentPage(0);
                }}
                title={`Filter gender: ${g === "All" ? "All genders" : g === "M" ? "Male only" : "Female only"}`}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filterGender === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {g === "All" ? "All" : g === "M" ? "Male (M)" : "Female (F)"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
              Assigned Category:
            </span>
            {(
              [
                { id: "All", label: "All Categories", tip: "Show all athletes regardless of category source" },
                { id: "weight", label: "Weight Class", tip: "Athletes assigned to a division weight class" },
                { id: "height", label: "Height Bracket", tip: "Athletes assigned by height bracket (weight omitted)" },
                { id: "unassigned", label: "Unassigned", tip: "Athletes missing category assignment" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setFilterCategoryMode(opt.id);
                  setCurrentPage(0);
                }}
                title={opt.tip}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filterCategoryMode === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {activeExtraFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setFilterGender("All");
                setFilterCategoryMode("All");
                setCurrentPage(0);
              }}
              title="Reset gender and assigned category filters"
              className="ml-auto text-xs font-semibold text-primary hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* 2. Roster Table (Supports Direct In-Cell Inline Editing) */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground bg-muted/30">
              <th className="w-9 px-3 py-2.5">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  title={
                    selectedKeys.size > 0 && selectedKeys.size === paginatedAthletes.length
                      ? "Deselect all athletes on this page"
                      : "Select all athletes on this page"
                  }
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Select all on this page"
                >
                  {selectedKeys.size > 0 && selectedKeys.size === paginatedAthletes.length ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              {TABLE_COLUMNS.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  <button
                    type="button"
                    title={col.tip}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort(col.key)}
                  >
                    <span>{col.label}</span>
                    {sortConfig.key === col.key ? (
                      sortConfig.dir === 1 ? (
                        <ArrowUp className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-primary" />
                      )
                    ) : col.key === "sr_no" ? (
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    ) : null}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAthletes.map((a, idx) => {
              const rowKey = a.id ?? a.sr_no ?? a.name ?? idx;
              const isChecked = selectedKeys.has(rowKey);
              const isEditing = editingKey === rowKey;
              const hasNotes = a.notes && a.notes.length > 0;

              return (
                <tr
                  key={rowKey}
                  onDoubleClick={() => !isEditing && startInlineEdit(a, rowKey)}
                  title={!isEditing ? "Double-click row or click Pencil icon to edit cells inline" : undefined}
                  className={`border-b border-border/60 transition-colors ${
                    isEditing
                      ? "bg-primary/5 ring-1 ring-inset ring-primary/30"
                      : isChecked
                      ? "bg-accent/40 hover:bg-accent/50"
                      : "hover:bg-muted/40"
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleRow(rowKey)}
                      title={isChecked ? `Deselect ${a.name}` : `Select ${a.name} for bulk actions`}
                      aria-label={`Select ${a.name}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  {/* 1. Sr. */}
                  <td className="px-3 py-2 tabular-nums text-muted-foreground font-medium">
                    {a.sr_no || validPage * pageSize + idx + 1}
                  </td>

                  {/* 2. Name (Inline Input when Editing) */}
                  <td className="px-2.5 py-2 font-medium text-foreground">
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editDraft.name}
                        onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                        onKeyDown={(e) => handleInlineKeyDown(e, a)}
                        placeholder="Full name"
                        title="Edit athlete name"
                        className="h-8 w-full min-w-[130px] rounded-md border border-primary/50 bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>{a.name}</span>
                        {hasNotes && (
                          <span
                            title={a.notes.join("; ")}
                            className="inline-flex items-center text-warning cursor-help"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 3. Gender (Inline Toggle when Editing) */}
                  <td className="px-2.5 py-2 font-semibold">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() =>
                          setEditDraft({ ...editDraft, gender: editDraft.gender === "M" ? "F" : "M" })
                        }
                        title="Click to toggle Male (M) / Female (F)"
                        className={`h-8 w-10 rounded-md border border-input text-xs font-bold transition-colors ${
                          editDraft.gender === "M"
                            ? "bg-blue-500/15 text-male border-blue-500/30"
                            : "bg-pink-500/15 text-female border-pink-500/30"
                        }`}
                      >
                        {editDraft.gender}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                          a.gender === "M"
                            ? "bg-blue-50 text-blue-600 dark:bg-male/20 dark:text-male"
                            : "bg-pink-50 text-pink-600 dark:bg-female/20 dark:text-female"
                        }`}
                      >
                        {a.gender}
                      </span>
                    )}
                  </td>

                  {/* 4. Age / DOB (Inline DobInput with auto "/" when Editing) */}
                  <td className="whitespace-nowrap px-2.5 py-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <DobInput
                          compact
                          value={editDraft.dob}
                          onChange={(val) => setEditDraft({ ...editDraft, dob: val })}
                          onKeyDown={(e) => handleInlineKeyDown(e, a)}
                          className="w-36"
                          title="Type DOB (auto '/') or use calendar button"
                        />
                        {inlinePreview?.calculated_age !== null && inlinePreview?.calculated_age !== undefined && (
                          <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                            ({inlinePreview.calculated_age}y)
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="tabular-nums font-bold text-foreground">
                          {a.competition_age ?? a.calculated_age ?? "—"}
                        </span>
                        {a.dob && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {" "}/ {a.dob}
                          </span>
                        )}
                      </>
                    )}
                  </td>

                  {/* 5. Weight (Optional Inline Input) */}
                  <td className="px-2.5 py-2 tabular-nums font-medium text-foreground">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="250"
                        value={editDraft.weight}
                        onChange={(e) => setEditDraft({ ...editDraft, weight: e.target.value })}
                        onKeyDown={(e) => handleInlineKeyDown(e, a)}
                        placeholder="Opt"
                        title="Edit weight in kg (optional — leave empty to categorize by height)"
                        className="h-8 w-20 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      <span>{a.weight_kg ? `${a.weight_kg} kg` : "—"}</span>
                    )}
                  </td>

                  {/* 6. Height (Inline Input) */}
                  <td className="px-2.5 py-2 tabular-nums text-muted-foreground">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="260"
                        value={editDraft.height}
                        onChange={(e) => setEditDraft({ ...editDraft, height: e.target.value })}
                        onKeyDown={(e) => handleInlineKeyDown(e, a)}
                        placeholder="cm"
                        title="Edit height in cm"
                        className="h-8 w-20 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      <span>{a.height_cm ? `${a.height_cm} cm` : "—"}</span>
                    )}
                  </td>

                  {/* 7. Assigned Category (Live-updating preview while Editing!) */}
                  <td className="whitespace-nowrap px-3 py-2">
                    {(() => {
                      const target = isEditing && inlinePreview ? inlinePreview : a;
                      const byHeightOnly = !target.weight_kg && Boolean(target.height_category);
                      return (
                        <div className="flex items-center gap-2">
                          <DivisionBadge group={target.age_group} />
                          <span
                            className={`font-semibold ${
                              isEditing && inlinePreview ? "text-primary text-xs" : "text-foreground"
                            }`}
                          >
                            {target.weight_class}
                          </span>
                          {target.height_category && target.weight_kg && (
                            <span className="text-muted-foreground text-xs">
                              · {target.height_category}
                            </span>
                          )}
                          {byHeightOnly && (
                            <span
                              title="Assigned from height bracket because weight was not provided"
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              Ht
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* 8. Club (Inline Input when Editing) */}
                  <td className="px-2.5 py-2 text-muted-foreground">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editDraft.club}
                        onChange={(e) => setEditDraft({ ...editDraft, club: e.target.value })}
                        onKeyDown={(e) => handleInlineKeyDown(e, a)}
                        placeholder="Club"
                        title="Edit club / school name"
                        className="h-8 w-full min-w-[100px] rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      <span>{a.club || "—"}</span>
                    )}
                  </td>

                  {/* 9. Actions (Save/Cancel inline when Editing, Eye/Pencil/Trash otherwise) */}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {isEditing ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => saveInlineEdit(a)}
                          title="Save inline edits (Enter)"
                          aria-label="Save changes"
                          className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelInlineEdit}
                          title="Cancel inline editing (Esc)"
                          aria-label="Cancel editing"
                          className="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onEditAthlete(a)}
                          title={`Inspect or edit full record for ${a.name}`}
                          aria-label={`View details for ${a.name}`}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startInlineEdit(a, rowKey)}
                          title={`Edit ${a.name} directly in this row`}
                          aria-label={`Edit ${a.name}`}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAthlete(rowKey)}
                          title={`Delete ${a.name} from roster`}
                          aria-label={`Delete ${a.name}`}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {paginatedAthletes.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-16 text-center text-muted-foreground">
                  No athletes found matching the active selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground border-t border-border">
        <span className="tabular-nums">
          {filteredAthletes.length > 0
            ? `Showing ${validPage * pageSize + 1}–${Math.min(
                filteredAthletes.length,
                (validPage + 1) * pageSize
              )} of ${filteredAthletes.length} athletes`
            : "Showing 0 of 0 athletes"}
        </span>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              title="Select number of athletes shown per page"
              className="rounded-md border border-input bg-background px-2 py-1 text-foreground focus:outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              {[5, 10, 15, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={validPage === 0}
              onClick={() => setCurrentPage(validPage - 1)}
              title="Go to previous page"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {visiblePages.map((p, i) =>
              p === "dots" ? (
                <span key={`dots-${i}`} className="px-1.5 text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  title={`Go to page ${p + 1}`}
                  className={`h-7 min-w-7 px-2 rounded-md text-xs font-semibold tabular-nums transition-colors ${
                    p === validPage
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {p + 1}
                </button>
              )
            )}

            <button
              type="button"
              disabled={validPage >= totalPages - 1}
              onClick={() => setCurrentPage(validPage + 1)}
              title="Go to next page"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
