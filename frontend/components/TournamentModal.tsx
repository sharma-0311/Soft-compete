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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">New Isolated Competition</h3>
              <p className="text-xs text-slate-500">Step {step} of 3 • Separate roster, rules & weigh-in</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close new tournament wizard"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Event Details */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Competition / Event Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 24th District Taekwondo Championship"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Discipline
                </label>
                <input
                  type="text"
                  disabled
                  value={discipline}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                Venue & Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. State Sports Complex, Hall B"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {duplicateConflict && (
              <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  A competition named <b>&ldquo;{duplicateConflict.name}&rdquo;</b> on{" "}
                  <b>{duplicateConflict.event_date}</b> already exists. Use a distinct name or date so events stay separate with zero conflict.
                </span>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                disabled={!name.trim() || Boolean(duplicateConflict)}
                onClick={() => setStep(2)}
                title={
                  duplicateConflict
                    ? "Use a unique competition name or date first"
                    : "Proceed to Step 2: Select competition rules profile"
                }
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span>Next: Choose Rules</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Competition Rules Profile */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Select Competition Rule Profile
            </label>

            <div className="space-y-3">
              {/* Profile A: 2026 Tournament Specific */}
              <div
                onClick={() => setRuleProfile("tourn2026")}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  ruleProfile === "tourn2026"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    2026 Championship Specification (Recommended)
                  </span>
                  {ruleProfile === "tourn2026" && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sub-Jr (2015-2019, 10 wt + 12 ht brackets), Cadet (2012-2014), Junior (2009-2011), Senior (2008 & earlier).
                </p>
              </div>

              {/* Profile B: World Taekwondo 2026 Reference */}
              <div
                onClick={() => setRuleProfile("wt2026")}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  ruleProfile === "wt2026"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    World Taekwondo (WT) Standard Reference
                  </span>
                  {ruleProfile === "wt2026" && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Competition year age calculation: Cadet 12-14, Junior 15-17, Senior 17+ with official WT 8-category weight divisions.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                title="Return to Step 1: Event details"
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                title="Proceed to Step 3: Review and create tournament"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span>Next: Review & Finish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Tournament Title:</span>
                <span className="font-bold text-slate-900 dark:text-white">{name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Event Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">{eventDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Venue:</span>
                <span className="font-bold text-slate-900 dark:text-white">{location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Rule Profile:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {ruleProfile === "tourn2026" ? "2026 Championship Spec" : "World Taekwondo Spec"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Initial Workspace:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Clean Empty Roster (Isolated)
                </span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                title="Return to Step 2: Competition rules"
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading || !name.trim() || Boolean(duplicateConflict)}
                onClick={handleCreate}
                title="Create isolated competition workspace with a clean empty roster"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
              >
                {loading ? "Creating..." : "Launch Competition Workspace"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

