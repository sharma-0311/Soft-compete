import React from "react";

const DIVISION_STYLES: Record<string, string> = {
  "Sub-Jr": "bg-div-subjr/15 text-div-subjr border-div-subjr/35",
  Cadet: "bg-div-cadet/15 text-div-cadet border-div-cadet/35",
  Junior: "bg-div-junior/15 text-div-junior border-div-junior/35",
  Senior: "bg-div-senior/15 text-div-senior border-div-senior/35",
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

