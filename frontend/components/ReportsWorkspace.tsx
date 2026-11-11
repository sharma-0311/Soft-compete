"use client";

import React, { useState, useMemo } from "react";
import { Download, FileSpreadsheet, AlertTriangle, Layers } from "lucide-react";
import { CategorizedAthlete } from "@/lib/api";
import { DivisionBadge } from "@/components/DivisionBadge";

interface ReportsWorkspaceProps {
  athletes: CategorizedAthlete[];
  onExportExcel: () => void;
  onExportCsv: () => void;
  onOpenPrint: () => void;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
}

function ReportTable({
  head,
  rows,
}: {
  head: string[];
  rows: (React.ReactNode | string | number | null | undefined)[][];
}) {
  return (
    <div className="max-h-[60vh] overflow-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/95 backdrop-blur-sm border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-border/70 hover:bg-muted/30">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5 tabular-nums text-foreground">
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={head.length} className="px-4 py-12 text-center text-muted-foreground">
                Nothing to report.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export const ReportsWorkspace: React.FC<ReportsWorkspaceProps> = ({
  athletes,
  onExportExcel,
  onExportCsv,
  eventTitle,
  eventDate,
  eventLocation,
}) => {
  const [activeTab, setActiveTab] = useState<"categories" | "weighin" | "exceptions" | "summary">(
    "categories"
  );

  // Group by full_category
  const categoriesList = useMemo(() => {
    const map = new Map<string, CategorizedAthlete[]>();
    for (const a of athletes) {
      const cat = a.full_category;
      map.set(cat, [...(map.get(cat) ?? []), a]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [athletes]);

  // Exceptions list
  const exceptions = useMemo(() => {
    return athletes.filter((a) => (a.notes && a.notes.length > 0) || a.age_group === "Unknown");
  }, [athletes]);

  // Weigh-in recorded athletes
  const weighInRecords = useMemo(() => {
    return athletes.filter((a) => a.weigh_in_status && a.weigh_in_status !== "pending");
  }, [athletes]);

  // Summary by Club
  const clubCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of athletes) {
      const club = a.club || "Independent";
      map.set(club, (map.get(club) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [athletes]);

  return (
    <div className="space-y-5 print:hidden">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 py-2">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{eventTitle}</span>
            {eventDate ? ` • ${eventDate}` : ""}
            {eventLocation ? ` • ${eventLocation}` : ""} · {athletes.length} athlete{athletes.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            disabled={!athletes.length}
            title={athletes.length ? "Download roster as CSV spreadsheet" : "Add athletes first to export CSV"}
            className="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted font-medium text-foreground text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-65 disabled:cursor-not-allowed"
          >
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={!athletes.length}
            title={athletes.length ? "Download styled multi-sheet Excel (.xlsx) workbook" : "Add athletes first to export Excel"}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-display text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors disabled:opacity-65 shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel workbook</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/60 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          title="View athletes grouped by assigned competition category"
          className={`rounded-md px-3 py-1 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "categories"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-card/80"
          }`}
        >
          Category lists
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("weighin")}
          title="View official scale weights and pass/fail statuses"
          className={`rounded-md px-3 py-1 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "weighin"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-card/80"
          }`}
        >
          Weigh-in report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("exceptions")}
          title="Review uncategorized records or warnings requiring attention"
          className={`rounded-md px-3 py-1 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "exceptions"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-card/80"
          }`}
        >
          Exceptions ({exceptions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          title="View registration totals grouped by club and age division"
          className={`rounded-md px-3 py-1 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
            activeTab === "summary"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-card/80"
          }`}
        >
          Summary
        </button>
      </div>

      {/* 3. Tab Contents */}
      {/* TAB A: Category Lists */}
      {activeTab === "categories" && (
        <div className="space-y-5 pt-3">
          {categoriesList.map(([catName, athletesInCat]) => (
            <section key={catName}>
              <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <DivisionBadge group={athletesInCat[0].age_group} />
                <span>{catName}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({athletesInCat.length})
                </span>
              </h2>
              <ReportTable
                head={["Sr", "Name", "Gender", "Club", "Declared Wt"]}
                rows={athletesInCat.map((a) => [
                  a.sr_no,
                  a.name,
                  a.gender,
                  a.club || "—",
                  a.weight_kg != null ? `${a.weight_kg} kg` : "—",
                ])}
              />
            </section>
          ))}

          {!categoriesList.length && (
            <p className="py-12 text-center text-muted-foreground">No athletes yet.</p>
          )}
        </div>
      )}

      {/* TAB B: Weigh-In Report */}
      {activeTab === "weighin" && (
        <div className="pt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Weigh-in records are stored locally on this device.
          </p>
          <ReportTable
            head={["Sr", "Name", "Category", "Declared", "Scale", "Result", "Note", "Recorded at"]}
            rows={weighInRecords.map((a) => [
              a.sr_no,
              a.name,
              a.full_category,
              a.weight_kg != null ? `${a.weight_kg} kg` : "—",
              a.scale_weight_kg ? `${a.scale_weight_kg} kg` : "—",
              a.weigh_in_status,
              a.weigh_in_notes || "—",
              a.weigh_in_time || "—",
            ])}
          />
        </div>
      )}

      {/* TAB C: Exceptions */}
      {activeTab === "exceptions" && (
        <div className="pt-3 space-y-2">
          <ReportTable
            head={["Sr", "Name", "Division", "Issues"]}
            rows={exceptions.map((a) => [
              a.sr_no,
              a.name,
              a.age_group,
              (a.notes && a.notes.length > 0 ? a.notes.join("; ") : "Uncategorized"),
            ])}
          />
        </div>
      )}

      {/* TAB D: Summary */}
      {activeTab === "summary" && (
        <div className="pt-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">
                By club
              </h2>
              <ReportTable head={["Club", "Athletes"]} rows={clubCounts} />
            </div>

            <div>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">
                By division
              </h2>
              <ReportTable
                head={["Division", "Athletes"]}
                rows={["Sub-Jr", "Cadet", "Junior", "Senior", "Unknown"].map((div) => [
                  div === "Sub-Jr" ? "Sub-Junior" : div,
                  athletes.filter((a) => a.age_group === div).length,
                ])}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
