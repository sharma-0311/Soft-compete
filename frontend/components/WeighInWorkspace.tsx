"use client";

import React, { useState, useMemo } from "react";
import {
  Scale, CheckCircle2, XCircle, Search, Printer,
  AlertTriangle
} from "lucide-react";
import { CategorizedAthlete } from "@/lib/api";
import { DivisionBadge } from "@/components/DivisionBadge";

interface WeighInWorkspaceProps {
  athletes: CategorizedAthlete[];
  onUpdateAthlete: (athlete: CategorizedAthlete) => void;
  onOpenPrint: () => void;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
}

const STATUS_BADGES: Record<string, string> = {
  pass: "bg-success/15 text-success",
  passed: "bg-success/15 text-success",
  fail: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
  review: "bg-warning/15 text-warning",
  pending: "bg-muted text-muted-foreground",
};

export const WeighInWorkspace: React.FC<WeighInWorkspaceProps> = ({
  athletes,
  onUpdateAthlete,
  onOpenPrint,
  eventTitle,
  eventDate,
  eventLocation,
}) => {
  const [filterDivision, setFilterDivision] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<CategorizedAthlete | null>(null);
  const [scaleInput, setScaleInput] = useState<string>("");
  const [weighNote, setWeighNote] = useState<string>("");

  const filteredAthletes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return athletes.filter((a) => {
      const matchDiv = filterDivision === "All" || a.age_group === filterDivision;
      const matchSearch =
        !q ||
        `${a.name} ${a.club ?? ""} ${a.full_category}`.toLowerCase().includes(q);
      return matchDiv && matchSearch;
    });
  }, [athletes, filterDivision, searchQuery]);

  const completedCount = useMemo(() => {
    return filteredAthletes.filter(
      (a) => a.weigh_in_status === "passed" || a.weigh_in_status === "failed"
    ).length;
  }, [filteredAthletes]);

  const reviewCount = useMemo(() => {
    return filteredAthletes.filter((a) => a.weigh_in_status === "review").length;
  }, [filteredAthletes]);

  const pendingCount = filteredAthletes.length - completedCount - reviewCount;

  const handleSelectAthlete = (athlete: CategorizedAthlete) => {
    setSelectedAthlete(athlete);
    setScaleInput(
      athlete.scale_weight_kg != null
        ? String(athlete.scale_weight_kg)
        : athlete.weight_kg != null
        ? String(athlete.weight_kg)
        : ""
    );
    setWeighNote(athlete.weigh_in_notes ?? "");
  };

  const handleRecord = (status: "pass" | "fail" | "review") => {
    if (!selectedAthlete) return;

    const parsedScale = parseFloat(scaleInput);
    const validScale = isNaN(parsedScale) ? (selectedAthlete.weight_kg ?? undefined) : parsedScale;

    const updated: CategorizedAthlete = {
      ...selectedAthlete,
      weigh_in_status: status === "pass" ? "passed" : status === "fail" ? "failed" : "review",
      scale_weight_kg: validScale,
      weigh_in_notes: weighNote.trim() || undefined,
      weigh_in_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onUpdateAthlete(updated);

    // Auto-advance to next pending athlete
    const nextPending = filteredAthletes.find(
      (a) =>
        (a.id || a.sr_no) !== (selectedAthlete.id || selectedAthlete.sr_no) &&
        (!a.weigh_in_status || a.weigh_in_status === "pending")
    );

    if (nextPending) {
      handleSelectAthlete(nextPending);
    } else {
      setSelectedAthlete(null);
      setScaleInput("");
      setWeighNote("");
    }
  };

  // Discrepancy warning
  const weightDiff = useMemo(() => {
    if (!selectedAthlete || !scaleInput || selectedAthlete.weight_kg == null) return null;
    const val = parseFloat(scaleInput);
    if (isNaN(val)) return null;
    const diff = val - selectedAthlete.weight_kg;
    if (Math.abs(diff) > 0.01) {
      return diff.toFixed(1);
    }
    return null;
  }, [selectedAthlete, scaleInput]);

  return (
    <div className="space-y-5 print:hidden">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-end justify-between gap-3 py-2">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
            Weigh-In
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{eventTitle}</span>
            {eventDate ? ` • ${eventDate}` : ""}
            {eventLocation ? ` • ${eventLocation}` : ""} — Official scale records saved strictly to this competition.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPrint}
          disabled={!athletes.length}
          title={athletes.length ? "Open printable weigh-in roster sheet" : "Add athletes before printing weigh-in sheet"}
          className="h-9 px-4 rounded-lg border border-border bg-card hover:bg-muted font-medium text-foreground text-sm flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-65 disabled:cursor-not-allowed"
        >
          <Printer className="h-4 w-4 text-primary" />
          <span>Print weigh-in sheet</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm">
        <select
          title="Filter weigh-in list by division"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none"
          value={filterDivision}
          onChange={(e) => setFilterDivision(e.target.value)}
        >
          {["All", "Sub-Jr", "Cadet", "Junior", "Senior"].map((d) => (
            <option key={d} value={d}>
              {d === "Sub-Jr" ? "Sub-Junior" : d}
            </option>
          ))}
        </select>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search athlete, club, category"
            title="Search athletes by name, club, or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="ml-auto flex items-center gap-5 text-sm font-medium">
          <span className="text-muted-foreground">
            Pending <b className="tabular-nums text-foreground">{pendingCount}</b>
          </span>
          <span className="text-success">
            Completed <b className="tabular-nums">{completedCount}</b>
          </span>
          <span className="text-warning">
            Review <b className="tabular-nums">{reviewCount}</b>
          </span>
        </div>
      </div>

      {/* 3. Split Screen Layout with Generous Spacing between Records and Details */}
      <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
        {/* Left: Athlete Records Table */}
        <div className="max-h-[65vh] overflow-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/95 backdrop-blur-sm border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                {["Sr", "Athlete", "Category", "Declared", "Scale", "Result"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAthletes.map((a) => {
                const isSelected =
                  selectedAthlete &&
                  (selectedAthlete.id || selectedAthlete.sr_no) === (a.id || a.sr_no);
                const statusKey = (a.weigh_in_status || "pending").toLowerCase();
                const badgeCls = STATUS_BADGES[statusKey] || STATUS_BADGES.pending;

                return (
                  <tr
                    key={a.id || a.sr_no || a.name}
                    onClick={() => handleSelectAthlete(a)}
                    className={`cursor-pointer border-t border-border/70 hover:bg-muted/40 transition-colors ${
                      isSelected ? "bg-accent/55" : ""
                    }`}
                  >
                    <td className="px-4 py-3 tabular-nums text-muted-foreground font-medium">
                      {a.sr_no}
                    </td>
                    <td className="px-4 py-3 space-y-0.5">
                      <div className="font-semibold text-foreground">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.club || "—"}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <DivisionBadge group={a.age_group} />
                        <span className="font-medium text-foreground">{a.weight_class}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-foreground">
                      {a.weight_kg != null ? `${a.weight_kg} kg` : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-bold text-foreground">
                      {a.scale_weight_kg != null ? `${a.scale_weight_kg} kg` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeCls}`}
                      >
                        {a.weigh_in_status || "pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredAthletes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                    No athletes in this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Scale Terminal Verification Details Card */}
        <div className="h-fit rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          {selectedAthlete ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary shrink-0" />
                  <h2 className="font-display text-xl font-bold uppercase text-foreground">
                    {selectedAthlete.name}
                  </h2>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-2.5 pt-0.5">
                  <span>{selectedAthlete.club || "Independent"}</span>
                  <span>·</span>
                  <DivisionBadge group={selectedAthlete.age_group} />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/70 border border-border/60 p-3.5 text-sm">
                <div className="space-y-0.5">
                  <dt className="text-xs text-muted-foreground">Declared</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {selectedAthlete.weight_kg != null ? `${selectedAthlete.weight_kg} kg` : "Height-based"}
                  </dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-xs text-muted-foreground">Assigned Category</dt>
                  <dd className="font-semibold text-foreground">
                    {selectedAthlete.weight_class}
                  </dd>
                </div>
              </dl>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  Official scale weight (kg)
                </label>
                <input
                  autoFocus
                  inputMode="decimal"
                  className="h-14 w-full rounded-lg border border-input bg-background text-center font-display text-3xl font-bold tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={scaleInput}
                  onChange={(e) => setScaleInput(e.target.value)}
                />
              </div>

              {weightDiff && (
                <div className="rounded-lg bg-warning/15 p-3 text-xs text-warning font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Differs from declared weight by {weightDiff} kg. Category is not changed automatically.
                  </span>
                </div>
              )}

              <input
                type="text"
                placeholder="Correction reason / note (optional)"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={weighNote}
                onChange={(e) => setWeighNote(e.target.value)}
              />

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleRecord("pass")}
                  title="Mark official scale weight as Passed and advance to next pending athlete"
                  className="h-10 rounded-lg bg-success text-primary-foreground hover:bg-success/90 font-display text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRecord("fail")}
                  title="Mark official scale weight as Failed / Overweight and advance"
                  className="h-10 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Fail</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRecord("review")}
                  title="Flag athlete for Technical Official review"
                  className="h-10 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 font-display text-sm font-bold uppercase tracking-wide transition-colors border border-border"
                >
                  Review
                </button>
              </div>

              <p className="text-xs text-muted-foreground pt-1">
                Saving a result automatically advances to the next pending athlete.
              </p>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground space-y-2.5">
              <Scale className="h-8 w-8 text-muted-foreground/60 mx-auto" />
              <p>Select an athlete to record an official measurement.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
