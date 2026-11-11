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
    barClass: "bg-amber-600 dark:bg-div-subjr",
    tintClass: "bg-amber-50/75 dark:bg-gradient-to-br dark:from-card dark:via-card dark:to-div-subjr/15",
    textClass: "text-amber-600 dark:text-div-subjr",
    silhouetteClass: "text-amber-500/25 dark:text-div-subjr/20",
    Icon: Zap,
  },
  Cadet: {
    label: "Cadet",
    barClass: "bg-emerald-600 dark:bg-div-cadet",
    tintClass: "bg-emerald-50/70 dark:bg-gradient-to-br dark:from-card dark:via-card dark:to-div-cadet/15",
    textClass: "text-emerald-600 dark:text-div-cadet",
    silhouetteClass: "text-emerald-500/25 dark:text-div-cadet/20",
    Icon: Medal,
  },
  Junior: {
    label: "Junior",
    barClass: "bg-blue-600 dark:bg-div-junior",
    tintClass: "bg-blue-50/75 dark:bg-gradient-to-br dark:from-card dark:via-card dark:to-div-junior/15",
    textClass: "text-blue-600 dark:text-div-junior",
    silhouetteClass: "text-blue-500/25 dark:text-div-junior/20",
    Icon: Award,
  },
  Senior: {
    label: "Senior",
    barClass: "bg-rose-600 dark:bg-div-senior",
    tintClass: "bg-rose-50/75 dark:bg-gradient-to-br dark:from-card dark:via-card dark:to-div-senior/15",
    textClass: "text-rose-600 dark:text-div-senior",
    silhouetteClass: "text-rose-500/25 dark:text-div-senior/20",
    Icon: Trophy,
  },
};

const DIVISIONS = ["Sub-Jr", "Cadet", "Junior", "Senior"];

/** Sharp vector silhouette of a Taekwondo athlete executing a high side kick (left-facing). */
function TkdKickSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {/* Headgear profile facing left */}
      <circle cx="72" cy="21" r="8.5" />
      <path d="M63 18c-3 2-3 7 0 9l5-1v-7z" />
      {/* Leaning torso in dobok */}
      <path d="M62 31c6-2 13 1 15 7l4 21c1 5-2 10-8 12l-9 1c-5 0-9-3-10-8l-3-20c-1-6 4-11 11-13z" />
      {/* Guard arms */}
      <path d="M72 36l13 10c2 2 2 5 0 7-2 2-5 2-7 0l-12-9z" />
      <path d="M59 38l-15 8c-3 1-6 0-7-2s0-6 3-7l14-8z" />
      {/* High extended side-kick leg + foot */}
      <path d="M55 55L21 20c-2-2-3-5-1-7 2-3 5-3 8-1l33 34c4 4 3 10-1 12-2 1-4 0-5-3z" />
      <path d="M18 16l6-5c2-1 4 0 5 2l-6 7c-2 2-4 1-5-1z" />
      {/* Planted standing leg */}
      <path d="M66 69l3 38c0 3-3 5-6 5s-6-2-6-5l-2-36z" />
      <path d="M57 108h14c2 0 3 2 3 4H57z" />
      {/* Flying belt ends */}
      <path d="M72 62l15 11c2 1 2 4 0 5-1 2-4 2-5 0L68 68z" />
      <path d="M68 64l7 16c1 2 0 4-2 5s-4 0-5-2l-6-15z" />
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
      <div className="flex justify-between text-[11px]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground font-medium">
          {n} <span className="text-muted-foreground">· {percent.toFixed(0)}%</span>
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
      categorizedRate,
    };
  }, [athletes]);

  return (
    <div className="grid gap-2.5 md:grid-cols-[1.35fr_repeat(4,1fr)] print:hidden">
      {/* 1. Total Athletes Card (Compact) */}
      <div
        onClick={() => onSelectAgeGroup("All")}
        title="Click to show all athletes across every age division"
        className={`rounded-xl border p-3 sm:p-3.5 shadow-sm transition-all cursor-pointer flex flex-col justify-between bg-card ${
          selectedAgeGroup === "All"
            ? "border-blue-500/60 dark:border-primary/60 ring-1 ring-blue-500/20"
            : "border-blue-500/35 dark:border-primary/40 hover:border-blue-500/60"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/85 tracking-wide">
              <Users className="h-3.5 w-3.5 text-blue-600 dark:text-primary" />
              <span>Total Athletes</span>
            </div>
            <span
              title={`${stats.categorizedRate}% of athletes matched to an age division`}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 tabular-nums leading-none"
            >
              <span>▲</span>
              <span>{stats.categorizedRate}%</span>
            </span>
          </div>

          <div className="mt-1 font-display text-[28px] font-bold leading-none tabular-nums text-foreground">
            {total.toLocaleString()}
          </div>
        </div>

        <div className="mt-2 space-y-1.5">
          <ProgressBar label="Male" n={stats.maleCount} total={total} cls="bg-blue-600 dark:bg-male" />
          <ProgressBar label="Female" n={stats.femaleCount} total={total} cls="bg-pink-600 dark:bg-female" />
        </div>

        {total > 0 && (
          <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center justify-between gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span>{total - stats.unknownCount} assigned categories</span>
            {stats.unknownCount > 0 && (
              <span className="inline-flex items-center gap-1 text-warning font-semibold">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{stats.unknownCount} unassigned</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Four Compact Division Cards with Subtle Silhouettes */}
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
            className={`relative overflow-hidden rounded-xl border p-3 sm:p-3.5 shadow-sm transition-all cursor-pointer flex flex-col justify-between ${
              meta.tintClass
            } ${
              isSelected
                ? "border-primary ring-2 ring-primary/35"
                : "border-border hover:border-border/90"
            }`}
          >
            {/* Top accent bar */}
            <div className={`absolute inset-x-0 top-0 h-1 ${meta.barClass}`} />

            {/* Compact Taekwondo kicking silhouette watermark on right */}
            <TkdKickSilhouette
              className={`pointer-events-none select-none absolute right-2 bottom-2.5 h-16 w-16 opacity-85 ${meta.silhouetteClass}`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-foreground/90">
                  <Icon className={`h-3.5 w-3.5 ${meta.textClass}`} />
                  <span>{meta.label}</span>
                </div>
                {isSelected && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase leading-none">
                    Filtered
                  </span>
                )}
              </div>

              <div className="mt-1 font-display text-[28px] font-bold leading-none tabular-nums text-foreground">
                {divTotal}
              </div>
            </div>

            <div className="relative z-10 mt-2.5">
              <div className="flex gap-3 text-[11px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1">
                  <span className="text-male text-[9px]">●</span>
                  <span>{counts.M} M</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-female text-[9px]">●</span>
                  <span>{counts.F} F</span>
                </span>
              </div>

              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
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
