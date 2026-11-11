import React from "react";

const DIVISION_STYLES: Record<string, string> = {
  "Sub-Jr":
    "bg-amber-100/90 text-amber-800 border-amber-300/70 dark:bg-div-subjr/15 dark:text-div-subjr dark:border-div-subjr/35",
  Cadet:
    "bg-emerald-100/90 text-emerald-800 border-emerald-300/70 dark:bg-div-cadet/15 dark:text-div-cadet dark:border-div-cadet/35",
  Junior:
    "bg-blue-100/90 text-blue-800 border-blue-300/70 dark:bg-div-junior/15 dark:text-div-junior dark:border-div-junior/35",
  Senior:
    "bg-rose-100/90 text-rose-800 border-rose-300/70 dark:bg-div-senior/15 dark:text-div-senior dark:border-div-senior/35",
  Unknown: "bg-muted text-muted-foreground border-border",
};

export function DivisionBadge({
  group,
  className = "",
}: {
  group: string;
  className?: string;
}) {
  const style = DIVISION_STYLES[group] || DIVISION_STYLES.Unknown;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider leading-none ${style} ${className}`}
    >
      {group}
    </span>
  );
}

