"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy, CheckCircle2, ArrowRight, X, AlertTriangle
} from "lucide-react";
import { createTournamentEvent, TournamentEvent, RulesConfig } from "@/lib/api";
import { buildRulesForProfile } from "@/lib/rules";
import { generateLocalEventId } from "@/lib/eventStorage";

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEvents?: TournamentEvent[];
  onCreated: (event: TournamentEvent, rules: RulesConfig) => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  existingEvents = [],
  onCreated
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("2026-10-24");
  const [location, setLocation] = useState("State Sports Complex Indoor Stadium");
  const [discipline] = useState("Kyorugi (Sparring)");
  const [ruleProfile, setRuleProfile] = useState<"wt2026" | "tourn2026">("tourn2026");

  // Reset wizard cleanly every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLoading(false);
      const nextNum = existingEvents.length + 1;
      setName(nextNum > 1 ? `Taekwondo Championship #${nextNum}` : "State Taekwondo Championship 2026");
      setEventDate("2026-10-24");
      setLocation("State Sports Complex Indoor Stadium");
      setRuleProfile("tourn2026");
    }
  }, [isOpen, existingEvents.length]);

  const duplicateConflict = useMemo(() => {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) return null;
    return (
      existingEvents.find(
        (ev) =>
          ev.name.trim().toLowerCase() === cleanName &&
          (ev.event_date || "") === (eventDate || "")
      ) || null
    );
  }, [name, eventDate, existingEvents]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim() || duplicateConflict) return;
    setLoading(true);
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    const eventRules = buildRulesForProfile(ruleProfile, eventDate);

    try {
      const created = await createTournamentEvent(
        trimmedName,
        eventDate,
        trimmedLocation,
        ruleProfile,
        eventRules
      );
      const newEvent: TournamentEvent = {
        ...created,
        rule_profile: created.rule_profile || ruleProfile,
        rules: created.rules || eventRules,
        athletes_count: 0,
      };
      onCreated(newEvent, eventRules);
      onClose();
    } catch {
      // Isolated offline event with guaranteed unique negative ID so it never collides with DB IDs
      const fallbackEvent: TournamentEvent = {
        id: generateLocalEventId(existingEvents),
        name: trimmedName,
        event_date: eventDate,
        location: trimmedLocation,
        rule_profile: ruleProfile,
        rules: eventRules,
        athletes_count: 0,
      };
      onCreated(fallbackEvent, eventRules);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = Boolean(name.trim()) && !duplicateConflict;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-[1px] animate-in fade-in duration-150"
    >
      {/* Right Slide-Over Drawer matching Add athlete drawer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card text-card-foreground h-full w-full max-w-[490px] shadow-2xl border-l border-border flex flex-col transition-all duration-200"
      >
        {/* 1. Drawer Header & Step Tabs */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3.5 sm:pb-4 border-b border-border/70 shrink-0">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  New competition
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Isolated event workspace · Step {step} of 3
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close New competition drawer"
              aria-label="Close drawer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors shrink-0"
            >
              <span>Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step Switcher Tabs matching One athlete / Quick Grid tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3.5 overflow-x-auto thin-scrollbar">
            <button
              type="button"
              onClick={() => setStep(1)}
              title="Step 1: Competition name, date, and venue"
              className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                step === 1
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              1. Details
            </button>
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => canAdvance && setStep(2)}
              title="Step 2: Choose competition classification rule profile"
              className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                step === 2
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              2. Rules
            </button>
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => canAdvance && setStep(3)}
              title="Step 3: Review and launch isolated competition workspace"
              className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                step === 3
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              3. Review
            </button>
          </div>
        </div>

        {/* 2. Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar px-4 sm:px-6 py-4 sm:py-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Competition / Event name *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 24th District Taekwondo Championship"
                  title="Enter unique competition or event name"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Event date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    title="Select competition date for age calculation"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Discipline
                  </label>
                  <input
                    type="text"
                    disabled
                    value={discipline}
                    title="Competition discipline"
                    className="h-10 w-full rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Venue & location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. State Sports Complex, Hall B"
                  title="Enter competition venue or stadium"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>

              {duplicateConflict && (
                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    A competition named <b>&ldquo;{duplicateConflict.name}&rdquo;</b> on{" "}
                    <b>{duplicateConflict.event_date}</b> already exists. Use a distinct name or date so events stay separate with zero conflict.
                  </span>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="space-y-3.5">
              <p className="text-sm font-medium text-foreground">
                Select competition rule profile
              </p>

              {/* Profile A: 2026 Tournament Specific */}
              <div
                onClick={() => setRuleProfile("tourn2026")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  ruleProfile === "tourn2026"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    2026 Championship Specification (Recommended)
                  </span>
                  {ruleProfile === "tourn2026" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Sub-Jr (10 weight + 12 height brackets), Cadet, Junior, Senior — anchored cleanly to {eventDate}.
                </p>
              </div>

              {/* Profile B: World Taekwondo 2026 Reference */}
              <div
                onClick={() => setRuleProfile("wt2026")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  ruleProfile === "wt2026"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    World Taekwondo (WT) Standard Reference
                  </span>
                  {ruleProfile === "wt2026" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Competition-year age divisions (Sub-Jr 8-11, Cadet 12-14, Junior 15-17, Senior 18+) for {eventDate}.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Highlighted Isolated Workspace Summary Card matching ManualEntryModal preview */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Isolated Competition Workspace Preview
                </div>
                <div className="text-lg font-bold text-foreground">
                  {name.trim() || "Untitled Competition"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {eventDate} · {location.trim() || "Venue not specified"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/35 border border-border space-y-2.5 text-xs">
                <div className="flex justify-between gap-3 py-1 border-b border-border/70">
                  <span className="text-muted-foreground shrink-0">Rule profile:</span>
                  <span className="font-semibold text-primary text-right">
                    {ruleProfile === "tourn2026" ? "2026 Championship Spec" : "World Taekwondo Spec"}
                  </span>
                </div>
                <div className="flex justify-between gap-3 py-1 border-b border-border/70">
                  <span className="text-muted-foreground shrink-0">Discipline:</span>
                  <span className="font-semibold text-foreground text-right">{discipline}</span>
                </div>
                <div className="flex justify-between gap-3 py-1">
                  <span className="text-muted-foreground shrink-0">Initial roster:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                    Clean Empty Roster (Isolated)
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Athletes, rules edits, weigh-in records, and reports in this competition will stay strictly separated from your other events.
              </p>
            </div>
          )}
        </div>

        {/* 3. Pinned Drawer Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-border bg-card flex items-center justify-between gap-2.5 shrink-0">
          {step === 1 ? (
            <button
              type="button"
              onClick={onClose}
              title="Cancel without creating a competition"
              className="h-9 px-4 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step === 3 ? 2 : 1)}
              title={`Return to Step ${step - 1}`}
              className="h-9 px-4 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Back
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep(2)}
              title={
                duplicateConflict
                  ? "Use a unique competition name or date first"
                  : "Proceed to Step 2: Select competition rules profile"
              }
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Next: Rules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep(3)}
              title="Proceed to Step 3: Review and launch competition"
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Next: Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              disabled={loading || !canAdvance}
              onClick={handleCreate}
              title="Create isolated competition workspace with a clean empty roster"
              className="h-9 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              {loading ? "Creating..." : "Launch competition"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

