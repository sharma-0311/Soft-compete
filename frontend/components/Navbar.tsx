"use client";

import React, { useState } from "react";
import {
  Users, Scale, BarChart3, Settings, Plus,
  Sun, Moon, Calendar, ChevronDown, Check, Trash2, MapPin
} from "lucide-react";
import { TournamentEvent } from "@/lib/api";

interface NavbarProps {
  currentTab: "athletes" | "weighin" | "reports";
  onSelectTab: (tab: "athletes" | "weighin" | "reports") => void;
  events: TournamentEvent[];
  currentEvent: TournamentEvent | null;
  onSelectEvent: (event: TournamentEvent) => void;
  onNewEvent: () => void;
  onDeleteEvent?: (event: TournamentEvent) => void;
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
  onDeleteEvent,
  isBackendOnline,
  onOpenRules,
  darkMode,
  onToggleTheme,
  totalAthletesCount,
  pendingWeighInCount,
}) => {
  const [showEventMenu, setShowEventMenu] = useState(false);

  return (
    <header className="relative z-40 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Logo, Title & Primary Pill Navigation Tabs */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm tracking-wide shadow-sm">
                TKD
              </div>
              <span className="hidden sm:inline font-display font-bold text-base uppercase tracking-wide text-foreground">
                Soft Compete
              </span>
            </div>

            <div className="hidden md:block h-5 w-px bg-border/80" />

            {/* Pill Navigation Tabs matching Reference UI */}
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectTab("athletes")}
                title="View, filter, edit, or delete registered athletes"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm border transition-all shadow-sm ${
                  currentTab === "athletes"
                    ? "bg-primary border-primary text-primary-foreground font-semibold"
                    : "bg-card border-border text-foreground hover:bg-muted font-medium"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Athletes ({totalAthletesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("weighin")}
                title="Record official athlete weights and verify eligibility"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm border transition-all shadow-sm ${
                  currentTab === "weighin"
                    ? "bg-primary border-primary text-primary-foreground font-semibold"
                    : "bg-card border-border text-foreground hover:bg-muted font-medium"
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Weigh-In</span>
                {pendingWeighInCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold tabular-nums ${
                      currentTab === "weighin"
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-warning/15 text-warning"
                    }`}
                  >
                    {pendingWeighInCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("reports")}
                title="Preview, export, and print categorized competition sheets"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm border transition-all shadow-sm ${
                  currentTab === "reports"
                    ? "bg-primary border-primary text-primary-foreground font-semibold"
                    : "bg-card border-border text-foreground hover:bg-muted font-medium"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </button>
            </nav>
          </div>

          {/* Right Controls: Isolated Competition Switcher, Rules, Theme (Opaque card surfaces for crisp readability over hero artwork) */}
          <div className="flex items-center gap-2">
            {/* Active Competition Switcher */}
            <div className="relative flex items-center bg-card rounded-lg border border-border shadow-sm">
              <button
                type="button"
                onClick={() => setShowEventMenu((prev) => !prev)}
                title="Switch active competition or manage separate event workspaces"
                className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 rounded-l-lg transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="max-w-[120px] sm:max-w-[185px] truncate font-semibold">
                  {currentEvent?.name || "Select Competition"}
                </span>
                <span className="hidden sm:inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                  {totalAthletesCount}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>

              <div className="h-5 w-px bg-border/80" />

              <button
                type="button"
                onClick={() => {
                  setShowEventMenu(false);
                  onNewEvent();
                }}
                title="Create New Isolated Competition / Event"
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted/60 rounded-r-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {showEventMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowEventMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-border bg-card text-foreground shadow-xl z-50 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Competitions & Events ({events.length})
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Each competition keeps its own roster, rules & weigh-in.
                        </p>
                      </div>
                      <span
                        title={isBackendOnline ? "Backend database connected" : "Offline local device mode"}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isBackendOnline
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isBackendOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {isBackendOnline ? "Synced" : "Offline"}
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                      {events.map((ev) => {
                        const isActive = currentEvent?.id === ev.id;
                        const count = isActive ? totalAthletesCount : (ev.athletes_count ?? 0);
                        return (
                          <div
                            key={ev.id}
                            className={`flex items-start justify-between gap-2 p-2.5 transition-colors ${
                              isActive ? "bg-primary/5" : "hover:bg-muted/50"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setShowEventMenu(false);
                                if (!isActive) onSelectEvent(ev);
                              }}
                              title={`Switch to ${ev.name} (${ev.event_date})`}
                              className="flex-1 min-w-0 text-left flex items-start gap-2.5"
                            >
                              <div
                                className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                                  isActive
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-border bg-background text-transparent"
                                }`}
                              >
                                <Check className="w-3 h-3" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {ev.name}
                                  </span>
                                  {isActive && (
                                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                      Active
                                    </span>
                                  )}
                                  {ev.rule_profile === "wt2026" && (
                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      WT
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                                  <span className="inline-flex items-center gap-1 tabular-nums">
                                    <Calendar className="w-3 h-3" />
                                    {ev.event_date}
                                  </span>
                                  {ev.location && (
                                    <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{ev.location}</span>
                                    </span>
                                  )}
                                  <span className="font-semibold text-foreground tabular-nums">
                                    {count} athlete{count === 1 ? "" : "s"}
                                  </span>
                                </div>
                              </div>
                            </button>

                            {onDeleteEvent && events.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowEventMenu(false);
                                  onDeleteEvent(ev);
                                }}
                                title={`Delete competition "${ev.name}"`}
                                aria-label={`Delete ${ev.name}`}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-border bg-muted/25">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEventMenu(false);
                          onNewEvent();
                        }}
                        title="Create a brand-new separated competition with its own roster and rules"
                        className="w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Competition / Event</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Rules / Settings */}
            <button
              type="button"
              onClick={onOpenRules}
              title="Tournament Rules & Brackets Configuration"
              className="h-8 px-2.5 bg-card text-foreground hover:bg-muted rounded-lg transition-colors border border-border shadow-sm flex items-center gap-1.5 text-xs font-medium"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden lg:inline">Rules</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="h-8 w-8 bg-card flex items-center justify-center text-foreground hover:bg-muted rounded-lg transition-colors border border-border shadow-sm"
            >
              {darkMode ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <nav className="flex md:hidden items-center gap-1.5 py-1.5 border-t border-border/50">
          <button
            type="button"
            onClick={() => onSelectTab("athletes")}
            title="View, filter, edit, or delete registered athletes"
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors shadow-sm ${
              currentTab === "athletes"
                ? "bg-primary border-primary text-primary-foreground font-semibold"
                : "bg-card border-border text-foreground hover:bg-muted font-medium"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Athletes ({totalAthletesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("weighin")}
            title="Record official athlete weights and verify eligibility"
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors shadow-sm ${
              currentTab === "weighin"
                ? "bg-primary border-primary text-primary-foreground font-semibold"
                : "bg-card border-border text-foreground hover:bg-muted font-medium"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Weigh-In {pendingWeighInCount > 0 ? `(${pendingWeighInCount})` : ""}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("reports")}
            title="Preview, export, and print categorized competition sheets"
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors shadow-sm ${
              currentTab === "reports"
                ? "bg-primary border-primary text-primary-foreground font-semibold"
                : "bg-card border-border text-foreground hover:bg-muted font-medium"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
