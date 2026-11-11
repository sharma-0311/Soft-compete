"use client";

import React, { useState, useMemo } from "react";
import {
  Search, ArrowUp, ArrowDown, Pencil, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle, CheckSquare, Square
} from "lucide-react";
import { CategorizedAthlete } from "@/lib/api";
import { DivisionBadge } from "@/components/DivisionBadge";

interface AthletesTableProps {
  athletes: CategorizedAthlete[];
  filterAge: string;
  setFilterAge: (val: string) => void;
  onEditAthlete: (athlete: CategorizedAthlete) => void;
  onDeleteAthlete: (srNoOrId: number | string) => void;
  onDeleteSelected: (selectedIds: (number | string)[]) => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onOpenAddModal: () => void;
}

const TABLE_COLUMNS = [
  { key: "sr_no", label: "Sr." },
  { key: "name", label: "Name" },
  { key: "gender", label: "G" },
  { key: "calculated_age", label: "Age / DOB" },
  { key: "weight_kg", label: "Wt (kg)" },
  { key: "height_cm", label: "Ht (cm)" },
  { key: "full_category", label: "Assigned Category" },
  { key: "club", label: "Club" },
];

const DIVISIONS = ["All", "Sub-Jr", "Cadet", "Junior", "Senior"];

export const AthletesTable: React.FC<AthletesTableProps> = ({
  athletes,
  filterAge,
  setFilterAge,
  onEditAthlete,
  onDeleteAthlete,
  onDeleteSelected,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: number }>({
    key: "sr_no",
    dir: 1,
  });
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedKeys, setSelectedKeys] = useState<Set<number | string>>(new Set());

  // Division counts for badges in tabs
  const divisionCounts = useMemo(() => {
    const counts: Record<string, number> = { All: athletes.length };
    for (const a of athletes) {
      counts[a.age_group] = (counts[a.age_group] || 0) + 1;
    }
    return counts;
  }, [athletes]);

  // Filtered & Sorted Athletes
  const filteredAthletes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = athletes.filter((a) => {
      const matchDivision = filterAge === "All" || a.age_group === filterAge;
      const matchSearch =
        !query ||
        `${a.name} ${a.club ?? ""} ${a.full_category} ${a.weight_class}`
          .toLowerCase()
          .includes(query);
      return matchDivision && matchSearch;
    });

    const { key, dir } = sortConfig;
    return result.sort((a: any, b: any) => {
      let valA = a[key] ?? "";
      let valB = b[key] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * dir;
      }
      return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
    });
  }, [athletes, filterAge, searchQuery, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAthletes.length / pageSize));
  const validPage = Math.min(currentPage, totalPages - 1);
  const paginatedAthletes = filteredAthletes.slice(
    validPage * pageSize,
    validPage * pageSize + pageSize
  );

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
      paginatedAthletes.forEach((a) => next.add(a.id || a.sr_no || a.name));
      setSelectedKeys(next);
    }
  };

  const handleToggleRow = (key: number | string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs print:hidden">
      {/* 1. Header Toolbar: Division Tabs & Search */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3.5">
        {/* Division Filter Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted/80 p-1">
          {DIVISIONS.map((div) => {
            const isActive = filterAge === div;
            return (
              <button
                key={div}
                onClick={() => {
                  setFilterAge(div);
                  setCurrentPage(0);
                }}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{div}</span>
                <span className="text-[11px] tabular-nums opacity-70">
                  {divisionCounts[div] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Rows Bulk Action */}
        {selectedKeys.size > 0 && (
          <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-xs font-semibold">
            <span>{selectedKeys.size} selected</span>
            <button
              onClick={() => {
                onDeleteSelected(Array.from(selectedKeys));
                setSelectedKeys(new Set());
              }}
              className="text-destructive hover:underline ml-1 font-bold"
            >
              Delete
            </button>
          </div>
        )}

        {/* Search Input */}
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search name, club, category…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>
      </div>

      {/* 2. Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="w-8 px-3 py-2">
                <button
                  onClick={handleToggleSelectAll}
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
                <th key={col.key} className="whitespace-nowrap px-3 py-2 font-medium">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort(col.key)}
                  >
                    <span>{col.label}</span>
                    {sortConfig.key === col.key &&
                      (sortConfig.dir === 1 ? (
                        <ArrowUp className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-primary" />
                      ))}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAthletes.map((a, idx) => {
              const rowKey = a.id || a.sr_no || a.name || idx;
              const isChecked = selectedKeys.has(rowKey);
              const hasNotes = a.notes && a.notes.length > 0;

              return (
                <tr
                  key={rowKey}
                  className={`border-b border-border/60 hover:bg-muted/40 transition-colors ${
                    isChecked ? "bg-accent/40" : ""
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleToggleRow(rowKey)}
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

                  {/* 2. Name */}
                  <td className="px-3 py-2 font-medium text-foreground">
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
                  </td>

                  {/* 3. Gender */}
                  <td
                    className={`px-3 py-2 font-semibold ${
                      a.gender === "M" ? "text-male" : "text-female"
                    }`}
                  >
                    {a.gender}
                  </td>

                  {/* 4. Age / DOB */}
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="tabular-nums font-medium text-foreground">
                      {a.competition_age ?? a.calculated_age ?? "—"}
                    </span>{" "}
                    {a.dob && (
                      <span className="text-xs text-muted-foreground">
                        {a.dob}
                      </span>
                    )}
                  </td>

                  {/* 5. Weight */}
                  <td className="px-3 py-2 tabular-nums font-medium text-foreground">
                    {a.weight_kg ? `${a.weight_kg} kg` : "—"}
                  </td>

                  {/* 6. Height */}
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {a.height_cm ? `${a.height_cm} cm` : "—"}
                  </td>

                  {/* 7. Assigned Category */}
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex items-center gap-2">
                      <DivisionBadge group={a.age_group} />
                      <span className="font-medium text-foreground">{a.weight_class}</span>
                      {a.height_category && (
                        <span className="text-muted-foreground text-xs">
                          · {a.height_category}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 8. Club */}
                  <td className="px-3 py-2 text-muted-foreground">
                    {a.club || "—"}
                  </td>

                  {/* 9. Actions */}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => onEditAthlete(a)}
                      aria-label="Edit athlete"
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors mr-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAthlete(a.id || a.sr_no || a.name)}
                      aria-label="Delete athlete"
                      className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
      <div className="flex items-center gap-3 p-3 text-xs text-muted-foreground border-t border-border">
        <span>Rows</span>
        <select
          className="rounded border border-input bg-background px-2 py-1 text-foreground focus:outline-none"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(0);
          }}
        >
          {[15, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <span className="ml-auto tabular-nums">
          {filteredAthletes.length > 0
            ? `${validPage * pageSize + 1}–${Math.min(
                filteredAthletes.length,
                (validPage + 1) * pageSize
              )} of ${filteredAthletes.length}`
            : "0 of 0"}
        </span>

        <button
          disabled={validPage === 0}
          onClick={() => setCurrentPage(validPage - 1)}
          className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="tabular-nums font-semibold text-foreground">
          {validPage + 1} / {totalPages}
        </span>

        <button
          disabled={validPage >= totalPages - 1}
          onClick={() => setCurrentPage(validPage + 1)}
          className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
