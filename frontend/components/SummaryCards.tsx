"use client";

import React, { useMemo } from "react";
import { Users } from "lucide-react";
import { CategorizedAthlete } from "@/lib/api";

interface SummaryCardsProps {
  athletes: CategorizedAthlete[];
  selectedAgeGroup: string;
  onSelectAgeGroup: (group: string) => void;
}

const DIVISION_COLORS: Record<string, string> = {
  "Sub-Jr": "bg-div-subjr",
  Cadet: "bg-div-cadet",
  Junior: "bg-div-junior",
  Senior: "bg-div-senior",
};

const DIVISIONS = ["Sub-Jr", "Cadet", "Junior", "Senior"];

function ProgressBar({
  label,
  n,
  total,
  cls,
}: {
  label: string;
  n: number;
  total: number;
  cls: string;
}) {
  const percent = total > 0 ? (n / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {n} · {percent.toFixed(0)}%
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${cls}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  athletes,
  selectedAgeGroup,
  onSelectAgeGroup,
}) => {
  const total = athletes.length;

  const stats = useMemo(() => {
    const byDivision: Record<string, { M: number; F: number }> = {
      "Sub-Jr": { M: 0, F: 0 },
      Cadet: { M: 0, F: 0 },
      Junior: { M: 0, F: 0 },
      Senior: { M: 0, F: 0 },
    };
    let maleCount = 0;
    let femaleCount = 0;
    let unknownCount = 0;
    let flaggedCount = 0;

    for (const a of athletes) {
      if (!byDivision[a.age_group]) {
        byDivision[a.age_group] = { M: 0, F: 0 };
      }
      if (a.gender === "M") {
        byDivision[a.age_group].M++;
        maleCount++;
      } else {
        byDivision[a.age_group].F++;
        femaleCount++;
      }

      if (a.age_group === "Unknown") unknownCount++;
      if (a.notes && a.notes.length > 0) flaggedCount++;
    }

    return {
      byDivision,
      maleCount,
      femaleCount,
      unknownCount,
      flaggedCount,
    };
  }, [athletes]);

  return (
    <div className="grid gap-3.5 md:grid-cols-[1.35fr_repeat(4,1fr)] print:hidden">
      {/* 1. Total Athletes Card */}
      <div
        onClick={() => onSelectAgeGroup("All")}
        className="rounded-xl border border-border bg-card p-5 shadow-xs hover:border-border/80 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-medium">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Total athletes</span>
          </div>
          <div className="mt-2 font-display text-[42px] font-bold leading-none tabular-nums text-foreground">
            {total.toLocaleString()}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <ProgressBar label="Male" n={stats.maleCount} total={total} cls="bg-male" />
          <ProgressBar label="Female" n={stats.femaleCount} total={total} cls="bg-female" />
        </div>
        {(stats.flaggedCount > 0 || stats.unknownCount > 0) && (
          <div className="mt-2.5 text-xs font-semibold text-warning">
            {stats.flaggedCount} flagged · {stats.unknownCount} uncategorized
          </div>
        )}
      </div>

      {/* 2. Four Division Cards */}
      {DIVISIONS.map((div) => {
        const counts = stats.byDivision[div] || { M: 0, F: 0 };
        const divTotal = counts.M + counts.F;
        const percent = total > 0 ? (divTotal / total) * 100 : 0;
        const isSelected = selectedAgeGroup === div;

        return (
          <div
            key={div}
            onClick={() => onSelectAgeGroup(isSelected ? "All" : div)}
            className={`relative overflow-hidden rounded-xl border bg-card p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? "border-primary ring-1 ring-primary/40"
                : "border-border hover:border-border/80"
            }`}
          >
            {/* Top accent bar */}
            <div className={`absolute inset-x-0 top-0 h-1 ${DIVISION_COLORS[div]}`} />

            <div>
              <div className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>{div === "Sub-Jr" ? "Sub-Junior" : div}</span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-primary uppercase">Filtered</span>
                )}
              </div>

              <div className="mt-2 font-display text-[38px] font-bold leading-none tabular-nums text-foreground">
                {divTotal}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex gap-3 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <span className="text-male text-[10px]">●</span>
                  <span>{counts.M} M</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-female text-[10px]">●</span>
                  <span>{counts.F} F</span>
                </span>
              </div>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${DIVISION_COLORS[div]}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
