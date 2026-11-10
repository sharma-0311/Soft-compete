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
    <header className="bg-card border-b border-border sticky top-0 z-40 transition-colors shadow-xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-14 border-b border-border/60 gap-3">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm tracking-wide shadow-xs">
              TKD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg uppercase tracking-wide text-foreground">
                  Bracket HQ
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  — Athlete Categorization
                </span>
              </div>
            </div>
          </div>

          {/* Event Selector & Actions */}
          <div className="flex items-center gap-2">
            {/* Active Tournament Selector */}
            <div className="flex items-center gap-1.5 bg-muted rounded-md px-2.5 py-1 text-xs font-medium border border-input">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                aria-label="Select Active Tournament Event"
                value={currentEvent?.id || ""}
                onChange={(e) => {
                  const ev = events.find((item) => item.id === Number(e.target.value));
                  if (ev) onSelectEvent(ev);
                }}
                className="bg-transparent text-foreground text-xs font-semibold focus:outline-none max-w-[140px] sm:max-w-[220px] truncate cursor-pointer"
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

            {/* Connection Indicator */}
            <div
              title={isBackendOnline ? "Connected to FastAPI Backend" : "Operating in Offline Client Mode"}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                isBackendOnline
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-warning/10 text-warning border-warning/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBackendOnline ? "bg-success animate-pulse" : "bg-warning"
                }`}
              />
              <span className="hidden md:inline font-semibold">
                {isBackendOnline ? "Online" : "Offline"}
              </span>
            </div>

            {/* Rules / Settings */}
            <button
              onClick={onOpenRules}
              title="Tournament Rules & Brackets Configuration"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors border border-input"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors border border-input"
            >
              {darkMode ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>
          </div>
        </div>

        {/* Operational Navigation Tabs */}
        <nav className="flex items-center space-x-1 py-1.5">
          {/* Tab 1: Athletes */}
          <button
            onClick={() => onSelectTab("athletes")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
              currentTab === "athletes"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Athletes</span>
            <span
              className={`ml-1 text-xs tabular-nums opacity-80 ${
                currentTab === "athletes" ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              ({totalAthletesCount})
            </span>
          </button>

          {/* Tab 2: Weigh-In */}
          <button
            onClick={() => onSelectTab("weighin")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
              currentTab === "weighin"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Weigh-In</span>
            {pendingWeighInCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  currentTab === "weighin"
                    ? "bg-primary-foreground text-primary"
                    : "bg-warning/20 text-warning"
                }`}
              >
                {pendingWeighInCount}
              </span>
            )}
          </button>

          {/* Tab 3: Reports */}
          <button
            onClick={() => onSelectTab("reports")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
              currentTab === "reports"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Reports</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
