"use client";

import React from "react";
import {
  Shield, Users, Scale, FileText, Settings, Plus,
  Sun, Moon, Calendar
} from "lucide-react";
import { TournamentEvent } from "@/lib/api";

interface NavbarProps {
  currentTab: "athletes" | "weighin" | "reports";
  onSelectTab: (tab: "athletes" | "weighin" | "reports") => void;
  events: TournamentEvent[];
  currentEvent: TournamentEvent | null;
  onSelectEvent: (event: TournamentEvent) => void;
  onNewEvent: () => void;
  isBackendOnline: boolean;
  onOpenRules: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  totalAthletesCount: number;
  pendingWeighInCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  events,
  currentEvent,
  onSelectEvent,
  onNewEvent,
  isBackendOnline,
  onOpenRules,
  darkMode,
  onToggleTheme,
  totalAthletesCount,
  pendingWeighInCount,
}) => {
  return (
    <header className="bg-card/95 backdrop-blur border-b border-border sticky top-0 z-40 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Logo, Title & Inline Navigation Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm tracking-wide shadow-xs">
                TKD
              </div>
              <span className="font-display font-bold text-lg uppercase tracking-wide text-foreground">
                Bracket HQ
              </span>
            </div>

            <div className="hidden md:block h-5 w-px bg-border" />

            {/* Clean Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onSelectTab("athletes")}
                title="View, filter, edit, or delete registered athletes"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === "athletes"
                    ? "bg-muted text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Athletes</span>
                <span className="ml-0.5 text-xs tabular-nums text-muted-foreground">
                  {totalAthletesCount}
                </span>
              </button>

              <button
                onClick={() => onSelectTab("weighin")}
                title="Record official athlete weights and verify eligibility"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === "weighin"
                    ? "bg-muted text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Weigh-In</span>
                {pendingWeighInCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-warning/15 text-warning tabular-nums">
                    {pendingWeighInCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab("reports")}
                title="Preview, export, and print categorized competition sheets"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === "reports"
                    ? "bg-muted text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Reports</span>
              </button>
            </nav>
          </div>

          {/* Right Controls: Event Selector, Status, Rules, Theme */}
          <div className="flex items-center gap-2">
            {/* Active Tournament Selector */}
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-border">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <select
                aria-label="Select Active Tournament Event"
                value={currentEvent?.id || ""}
                onChange={(e) => {
                  const ev = events.find((item) => item.id === Number(e.target.value));
                  if (ev) onSelectEvent(ev);
                }}
                className="bg-transparent text-foreground text-xs font-medium focus:outline-none max-w-[130px] sm:max-w-[200px] truncate cursor-pointer"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id} className="bg-card text-foreground">
                    {ev.name} ({ev.event_date})
                  </option>
                ))}
              </select>
              <button
                onClick={onNewEvent}
                title="Create New Tournament Event"
                className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rules / Settings */}
            <button
              onClick={onOpenRules}
              title="Tournament Rules & Brackets Configuration"
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors border border-border flex items-center gap-1.5 text-xs font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Rules</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors border border-border"
            >
              {darkMode ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <nav className="flex md:hidden items-center gap-1 py-1.5 border-t border-border/60">
          <button
            onClick={() => onSelectTab("athletes")}
            title="View, filter, edit, or delete registered athletes"
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === "athletes"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Athletes ({totalAthletesCount})</span>
          </button>

          <button
            onClick={() => onSelectTab("weighin")}
            title="Record official athlete weights and verify eligibility"
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === "weighin"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Weigh-In {pendingWeighInCount > 0 ? `(${pendingWeighInCount})` : ""}</span>
          </button>

          <button
            onClick={() => onSelectTab("reports")}
            title="Preview, export, and print categorized competition sheets"
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentTab === "reports"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
