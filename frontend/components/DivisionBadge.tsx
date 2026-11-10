import React from "react";

const DIVISION_STYLES: Record<string, string> = {
  "Sub-Jr": "bg-div-subjr/15 text-div-subjr border-div-subjr/40",
  Cadet: "bg-div-cadet/15 text-div-cadet border-div-cadet/40",
  Junior: "bg-div-junior/15 text-div-junior border-div-junior/40",
  Senior: "bg-div-senior/15 text-div-senior border-div-senior/40",
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
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-wide ${style} ${className}`}
    >
      {group}
    </span>
  );
}

