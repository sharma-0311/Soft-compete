"use client";

import React, { useMemo } from "react";
import { Users, Zap, Medal, Award, Trophy, AlertTriangle } from "lucide-react";
import { CategorizedAthlete } from "@/lib/api";

interface SummaryCardsProps {
  athletes: CategorizedAthlete[];
  selectedAgeGroup: string;
  onSelectAgeGroup: (group: string) => void;
}

interface DivisionVisual {
  label: string;
  barClass: string;
  tintClass: string;
  textClass: string;
  silhouetteClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const DIVISION_META: Record<string, DivisionVisual> = {
  "Sub-Jr": {
    label: "Sub-Junior",
    barClass: "bg-div-subjr",
    tintClass: "bg-gradient-to-br from-card via-card to-div-subjr/[0.11] dark:to-div-subjr/15",
    textClass: "text-div-subjr",
    silhouetteClass: "text-div-subjr/25 dark:text-div-subjr/20",
    Icon: Zap,
  },
  Cadet: {
    label: "Cadet",
    barClass: "bg-div-cadet",
    tintClass: "bg-gradient-to-br from-card via-card to-div-cadet/[0.11] dark:to-div-cadet/15",
    textClass: "text-div-cadet",
    silhouetteClass: "text-div-cadet/25 dark:text-div-cadet/20",
    Icon: Medal,
  },
  Junior: {
    label: "Junior",
    barClass: "bg-div-junior",
    tintClass: "bg-gradient-to-br from-card via-card to-div-junior/[0.11] dark:to-div-junior/15",
    textClass: "text-div-junior",
    silhouetteClass: "text-div-junior/25 dark:text-div-junior/20",
    Icon: Award,
  },
  Senior: {
    label: "Senior",
    barClass: "bg-div-senior",
    tintClass: "bg-gradient-to-br from-card via-card to-div-senior/[0.11] dark:to-div-senior/15",
    textClass: "text-div-senior",
    silhouetteClass: "text-div-senior/25 dark:text-div-senior/20",
    Icon: Trophy,
  },
};

const DIVISIONS = ["Sub-Jr", "Cadet", "Junior", "Senior"];

/** Minimal vector silhouette of a Taekwondo athlete throwing a high side kick. */
function TkdKickSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {/* Head */}
      <circle cx="71" cy="24" r="9.5" />
      {/* Upper torso leaning back for high kick */}
      <path d="M58 34c7-2 15 1 17 8l4 20c1 6-3 12-9 13l-9 1c-5 0-9-4-10-9l-3-19c-1-6 4-12 10-14z" />
      {/* Raised guard arms */}
      <path d="M71 38l16 7c3 1 5 5 3 8s-6 4-9 2l-13-7z" />
      <path d="M56 42l-13 9c-3 2-6 1-8-2s-1-6 2-8l15-9z" />
      {/* Extended high kicking leg (upper left) */}
      <path d="M53 60L21 28c-3-3-3-7 0-9 3-2 7-1 10 2l29 29c4 4 3 10-2 12-2 1-4 0-5-2z" />
      {/* Planted standing leg */}
      <path d="M62 72l4 37c0 3-3 6-6 6s-6-3-6-6l-2-35z" />
      {/* Flowing black belt tails */}
      <path d="M68 64l18 11c2 1 3 4 1 6-1 2-4 2-6 1L64 71z" />
      <path d="M63 66l9 18c1 2 0 5-2 6s-5 0-6-2l-7-17z" />
    </svg>
  );
}

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
        <span className="tabular-nums text-foreground font-medium">
          {n} <span className="text-muted-foreground">· {percent.toFixed(0)}%</span>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted/90">
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
      if ((a.notes && a.notes.length > 0) || a.age_group === "Unknown" || a.weight_class === "Unassigned") {
        flaggedCount++;
      }
    }

    const categorizedRate =
      athletes.length > 0
        ? Math.round(((athletes.length - unknownCount) / athletes.length) * 100)
        : 0;

    return {
      byDivision,
      maleCount,
      femaleCount,
      unknownCount,
      flaggedCount,
      categorizedRate,
    };
  }, [athletes]);

  return (
    <div className="grid gap-3.5 md:grid-cols-[1.35fr_repeat(4,1fr)] print:hidden">
      {/* 1. Total Athletes Card */}
      <div
        onClick={() => onSelectAgeGroup("All")}
        title="Click to show all athletes across every age division"
        className={`rounded-xl border p-4 sm:p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between bg-gradient-to-br from-primary/[0.05] via-card to-card dark:from-primary/15 dark:via-card dark:to-card ${
          selectedAgeGroup === "All"
            ? "border-primary/50 ring-1 ring-primary/25"
            : "border-primary/30 hover:border-primary/50"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/85 tracking-wide">
              <Users className="h-4 w-4 text-primary" />
              <span>Total Athletes</span>
            </div>
            <span
              title={`${stats.categorizedRate}% of athletes matched to an age division`}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 tabular-nums"
            >
              <span>▲</span>
              <span>{stats.categorizedRate}%</span>
            </span>
          </div>

          <div className="mt-1.5 font-display text-[38px] font-bold leading-none tabular-nums text-foreground">
            {total.toLocaleString()}
          </div>
        </div>

        <div className="mt-3.5 space-y-2">
          <ProgressBar label="Male" n={stats.maleCount} total={total} cls="bg-male" />
          <ProgressBar label="Female" n={stats.femaleCount} total={total} cls="bg-female" />
        </div>

        {(stats.flaggedCount > 0 || stats.unknownCount > 0) && (
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center gap-1.5 text-xs font-semibold text-warning">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              {stats.flaggedCount} flagged · {stats.unknownCount} uncategorized
            </span>
          </div>
        )}
      </div>

      {/* 2. Four Division Cards with Subtle Silhouettes */}
      {DIVISIONS.map((div) => {
        const meta = DIVISION_META[div];
        const Icon = meta.Icon;
        const counts = stats.byDivision[div] || { M: 0, F: 0 };
        const divTotal = counts.M + counts.F;
        const percent = total > 0 ? (divTotal / total) * 100 : 0;
        const isSelected = selectedAgeGroup === div;

        return (
          <div
            key={div}
            onClick={() => onSelectAgeGroup(isSelected ? "All" : div)}
            title={
              isSelected
                ? `Clear ${meta.label} filter and show all athletes`
                : `Filter athletes table to ${meta.label} division (${divTotal})`
            }
            className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
              meta.tintClass
            } ${
              isSelected
                ? "border-primary ring-2 ring-primary/35"
                : "border-border hover:border-border/90"
            }`}
          >
            {/* Top accent bar */}
            <div className={`absolute inset-x-0 top-0 h-1 ${meta.barClass}`} />

            {/* Taekwondo kicking silhouette watermark on right */}
            <TkdKickSilhouette
              className={`pointer-events-none select-none absolute right-2 bottom-5 h-24 w-24 opacity-85 ${meta.silhouetteClass}`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide text-foreground/90">
                  <Icon className={`h-4 w-4 ${meta.textClass}`} />
                  <span>{meta.label}</span>
                </div>
                {isSelected && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                    Filtered
                  </span>
                )}
              </div>

              <div className="mt-2 font-display text-[36px] font-bold leading-none tabular-nums text-foreground">
                {divTotal}
              </div>
            </div>

            <div className="relative z-10 mt-3.5">
              <div className="flex gap-3 text-xs text-muted-foreground font-semibold">
                <span className="flex items-center gap-1">
                  <span className="text-male text-[10px]">●</span>
                  <span>{counts.M} M</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-female text-[10px]">●</span>
                  <span>{counts.F} F</span>
                </span>
              </div>

              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted/90">
                <div
                  className={`h-full rounded-full transition-all ${meta.barClass}`}
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
