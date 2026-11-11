"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UserPlus, FileUp, Download, Sparkles,
  RefreshCw, Trash2, AlertTriangle, Printer, CheckCircle2,
  Calendar, Database, ChevronDown, MapPin, FileSpreadsheet, ShieldCheck
} from "lucide-react";

import {
  fetchDemo, generateSampleAthletes, exportExcelFile,
  checkBackendHealth, fetchEvents, fetchEventAthletes, fetchEventRules,
  createTournamentEvent, deleteTournamentEvent, saveEventAthletes, saveEventRules,
  CategorizedAthlete, TournamentEvent, RulesConfig
} from "@/lib/api";
import { DEFAULT_RULES, buildRulesForProfile, categorizeAthleteClient } from "@/lib/rules";
import {
  getStoredEvents,
  saveStoredEvents,
  getStoredActiveEventId,
  saveStoredActiveEventId,
  hasStoredEventAthletes,
  getStoredEventAthletes,
  saveStoredEventAthletes,
  getStoredEventRules,
  saveStoredEventRules,
  removeStoredEventData,
  migrateEventStorageId,
  migrateLegacyStorageOnce,
  mergeEventsSafe,
} from "@/lib/eventStorage";

import { Navbar } from "@/components/Navbar";
import { SummaryCards } from "@/components/SummaryCards";
import { AthletesTable } from "@/components/AthletesTable";
import { ExcelUploadModal } from "@/components/ExcelUploadModal";
import { ManualEntryModal } from "@/components/ManualEntryModal";
import { RulesConfigModal } from "@/components/RulesConfigModal";
import { PrintWeighInModal } from "@/components/PrintWeighInModal";
import { EditAthleteModal } from "@/components/EditAthleteModal";
import { TournamentModal } from "@/components/TournamentModal";
import { WeighInWorkspace } from "@/components/WeighInWorkspace";
import { ReportsWorkspace } from "@/components/ReportsWorkspace";

interface ScopedRosterState {
  eventId: number | null;
  athletes: CategorizedAthlete[];
}

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<"athletes" | "weighin" | "reports">("athletes");
  const [rosterState, setRosterState] = useState<ScopedRosterState>({
    eventId: null,
    athletes: [],
  });
  const athletes = rosterState.athletes;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [filterAge, setFilterAge] = useState<string>("All");

  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<TournamentEvent | null>(null);
  const [activeRules, setActiveRules] = useState<RulesConfig>(DEFAULT_RULES);
  const activeEventIdRef = useRef<number | null>(null);

  // Appearance Theme
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<CategorizedAthlete | null>(null);

  // Actions dropdown
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("tkd_theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleToggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("tkd_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("tkd_theme", "light");
      }
      return next;
    });
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Initialize App on Mount
  useEffect(() => {
    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atomically persist athletes strictly under their owning eventId (zero cross-event leak)
  useEffect(() => {
    const ownerId = rosterState.eventId;
    if (ownerId !== null && currentEvent && ownerId === currentEvent.id) {
      saveStoredEventAthletes(ownerId, rosterState.athletes);
      setEvents((prev) => {
        let changed = false;
        const next = prev.map((ev) => {
          if (ev.id !== ownerId || ev.athletes_count === rosterState.athletes.length) {
            return ev;
          }
          changed = true;
          return { ...ev, athletes_count: rosterState.athletes.length };
        });
        if (changed) saveStoredEvents(next);
        return changed ? next : prev;
      });
    }
  }, [rosterState, currentEvent?.id]);

  // Helper that updates athletes only when owner matches expected active competition
  function updateActiveAthletes(
    updater: (prev: CategorizedAthlete[]) => CategorizedAthlete[],
    expectedEventId: number | null = activeEventIdRef.current
  ) {
    if (expectedEventId === null) return;
    setRosterState((prev) => {
      if (activeEventIdRef.current !== expectedEventId) return prev;
      const base = prev.eventId === expectedEventId ? prev.athletes : [];
      return {
        eventId: expectedEventId,
        athletes: updater(base),
      };
    });
  }

  function recategorizeAthleteRecord(
    a: CategorizedAthlete,
    rules: RulesConfig
  ): CategorizedAthlete {
    const recat = categorizeAthleteClient(
      {
        id: a.id,
        sr_no: a.sr_no,
        name: a.name,
        dob: a.dob || null,
        age_years: !a.dob && a.calculated_age != null ? a.calculated_age : undefined,
        gender: a.gender,
        weight_kg: a.weight_kg ?? null,
        height_cm: a.height_cm ?? null,
        club: a.club || null,
      },
      rules
    );
    return {
      ...a,
      ...recat,
      id: a.id,
      sr_no: a.sr_no,
      weigh_in_status: a.weigh_in_status,
      scale_weight_kg: a.scale_weight_kg,
      scale_height_cm: a.scale_height_cm,
      weigh_in_notes: a.weigh_in_notes,
      weigh_in_time: a.weigh_in_time,
      verification_status: a.verification_status,
    };
  }

  async function resolveRulesForEvent(ev: TournamentEvent, online: boolean): Promise<RulesConfig> {
    const cached = getStoredEventRules(ev.id);
    if (cached) {
      if (activeEventIdRef.current === ev.id) setActiveRules(cached);
      return cached;
    }

    if (ev.rules) {
      saveStoredEventRules(ev.id, ev.rules);
      if (activeEventIdRef.current === ev.id) setActiveRules(ev.rules);
      return ev.rules;
    }

    if (online && ev.id > 0) {
      try {
        const remote = await fetchEventRules(ev.id);
        saveStoredEventRules(ev.id, remote);
        if (activeEventIdRef.current === ev.id) setActiveRules(remote);
        return remote;
      } catch {}
    }

    const profile = ev.rule_profile === "wt2026" ? "wt2026" : "tourn2026";
    const built = buildRulesForProfile(profile, ev.event_date);
    saveStoredEventRules(ev.id, built);
    if (activeEventIdRef.current === ev.id) setActiveRules(built);
    return built;
  }

  async function loadRosterForEvent(
    ev: TournamentEvent,
    online: boolean,
    eventRules: RulesConfig,
    allowInitialDemo: boolean
  ) {
    if (hasStoredEventAthletes(ev.id)) {
      const localList = getStoredEventAthletes(ev.id) || [];
      if (activeEventIdRef.current === ev.id) {
        setRosterState({ eventId: ev.id, athletes: localList });
      }
      return;
    }

    if (online && ev.id > 0) {
      try {
        const remoteList = await fetchEventAthletes(ev.id);
        if (activeEventIdRef.current !== ev.id) return;
        if (remoteList.length > 0) {
          saveStoredEventAthletes(ev.id, remoteList);
          setRosterState({ eventId: ev.id, athletes: remoteList });
          return;
        }
      } catch {}
    }

    if (allowInitialDemo) {
      await handleLoadDemo(online, eventRules, ev.id);
      return;
    }

    saveStoredEventAthletes(ev.id, []);
    if (activeEventIdRef.current === ev.id) {
      setRosterState({ eventId: ev.id, athletes: [] });
    }
  }

  async function initApp() {
    setLoading(true);
    const online = await checkBackendHealth();
    setIsBackendOnline(online);

    const localSavedEvents = getStoredEvents();
    let eventsList: TournamentEvent[] = [];

    if (online) {
      try {
        const remoteEvents = await fetchEvents();
        eventsList = mergeEventsSafe(remoteEvents, localSavedEvents);
      } catch {}
    }

    if (eventsList.length === 0) {
      eventsList =
        localSavedEvents && localSavedEvents.length > 0
          ? localSavedEvents
          : [
              {
                id: 1,
                name: "2026 District Taekwondo Championship",
                event_date: "2026-10-24",
                location: "State Sports Complex",
                rule_profile: "tourn2026",
                athletes_count: 0,
              },
            ];
    }

    saveStoredEvents(eventsList);
    setEvents(eventsList);

    const storedActiveId = getStoredActiveEventId();
    const initialEvent =
      eventsList.find((e) => e.id === storedActiveId) || eventsList[0];

    migrateLegacyStorageOnce(initialEvent.id);

    activeEventIdRef.current = initialEvent.id;
    saveStoredActiveEventId(initialEvent.id);
    setCurrentEvent(initialEvent);

    const rulesForEvent = await resolveRulesForEvent(initialEvent, online);
    const isFreshFirstLaunch = eventsList.length === 1 && !hasStoredEventAthletes(initialEvent.id);
    await loadRosterForEvent(initialEvent, online, rulesForEvent, isFreshFirstLaunch);

    setLoading(false);
  }

  async function handleSelectEvent(ev: TournamentEvent) {
    if (currentEvent?.id === ev.id) return;

    setError(null);
    setFilterAge("All");
    setEditingAthlete(null);
    setShowActionsDropdown(false);
    setLoading(true);

    activeEventIdRef.current = ev.id;
    saveStoredActiveEventId(ev.id);
    setCurrentEvent(ev);

    // Clear active roster immediately if target is not cached so previous event rows never appear
    if (hasStoredEventAthletes(ev.id)) {
      const cached = getStoredEventAthletes(ev.id) || [];
      setRosterState({ eventId: ev.id, athletes: cached });
    } else {
      setRosterState({ eventId: null, athletes: [] });
    }

    const rulesForEvent = await resolveRulesForEvent(ev, isBackendOnline);
    await loadRosterForEvent(ev, isBackendOnline, rulesForEvent, false);
    setLoading(false);
    showToast(`Switched to "${ev.name}"`);
  }

  function handleCreateEvent(newEvent: TournamentEvent, eventRules: RulesConfig) {
    setError(null);
    setFilterAge("All");
    setEditingAthlete(null);
    setShowActionsDropdown(false);

    const isolatedEvent: TournamentEvent = {
      ...newEvent,
      athletes_count: 0,
      rules: eventRules,
    };

    saveStoredEventRules(isolatedEvent.id, eventRules);
    saveStoredEventAthletes(isolatedEvent.id, []);

    setEvents((prev) => {
      const next = [isolatedEvent, ...prev.filter((e) => e.id !== isolatedEvent.id)];
      saveStoredEvents(next);
      return next;
    });

    activeEventIdRef.current = isolatedEvent.id;
    saveStoredActiveEventId(isolatedEvent.id);
    setCurrentEvent(isolatedEvent);
    setActiveRules(eventRules);
    setRosterState({ eventId: isolatedEvent.id, athletes: [] });

    showToast(`Created isolated competition "${isolatedEvent.name}"`);
  }

  async function handleDeleteEvent(targetEvent: TournamentEvent) {
    if (events.length <= 1) {
      setError("Keep at least one competition workspace.");
      return;
    }
    const confirmed = confirm(
      `Delete competition "${targetEvent.name}" (${targetEvent.event_date}) and all of its athlete & weigh-in records?\n\nOther competitions will remain untouched.`
    );
    if (!confirmed) return;

    if (isBackendOnline && targetEvent.id > 0) {
      try {
        await deleteTournamentEvent(targetEvent.id);
      } catch {}
    }

    removeStoredEventData(targetEvent.id);

    const remaining = events.filter((e) => e.id !== targetEvent.id);
    saveStoredEvents(remaining);
    setEvents(remaining);

    if (currentEvent?.id === targetEvent.id && remaining.length > 0) {
      await handleSelectEvent(remaining[0]);
    }
    showToast(`Deleted "${targetEvent.name}"`);
  }

  // Load official 11 demo athletes strictly into the target competition
  async function handleLoadDemo(
    online: boolean = isBackendOnline,
    rulesOverride: RulesConfig = activeRules,
    targetEventId: number | null = activeEventIdRef.current
  ) {
    if (targetEventId === null) return;
    setLoading(true);
    setError(null);
    try {
      if (online) {
        const data = await fetchDemo();
        const recategorized = data.athletes.map((a, idx) =>
          recategorizeAthleteRecord({ ...a, sr_no: a.sr_no || idx + 1 }, rulesOverride)
        );
        if (activeEventIdRef.current === targetEventId) {
          saveStoredEventAthletes(targetEventId, recategorized);
          setRosterState({ eventId: targetEventId, athletes: recategorized });
          showToast("Loaded 11 Reference Athletes into this competition");
        }
      } else {
        // Offline demo categorized strictly against target competition rules
        const offlineSample = [
          { name: "ASHMITA", dob: "2017-11-26", gender: "F", weight_kg: 27.1, height_cm: 129.0, club: "GHSS" },
          { name: "VIBHOR", dob: "2019-10-11", gender: "M", weight_kg: 23.7, height_cm: 131.5, club: "GHSS" },
          { name: "MYSHA", dob: "2016-09-01", gender: "F", weight_kg: 31.2, height_cm: 139.5, club: "GHSS" },
          { name: "AYUSHI", dob: "2016-02-14", gender: "F", weight_kg: 30.2, height_cm: 142.5, club: "GHSS" },
          { name: "MOKSHIK", dob: "2014-01-19", gender: "M", weight_kg: 60.3, height_cm: 174.5, club: "GHSS" },
          { name: "GAURI", dob: "2017-04-04", gender: "F", weight_kg: 22.8, height_cm: 124.0, club: "GHSS" },
          { name: "ISHANT", age_years: 9, gender: "M", weight_kg: 31.9, height_cm: 134.0, club: "GHSS" },
          { name: "DITYA", dob: "2017-09-26", gender: "F", weight_kg: 34.3, height_cm: 133.0, club: "GHSS" },
          { name: "PRATHAM", dob: "2014-09-13", gender: "M", weight_kg: 46.5, height_cm: 145.0, club: "GHSS" },
          { name: "SIYA", age_years: 10, gender: "F", weight_kg: 24.4, height_cm: 148.0, club: "GHSS" },
          { name: "KAVYA", age_years: 11, gender: "F", weight_kg: 37.0, height_cm: 147.0, club: "GHSS" },
        ];
        const categorized = offlineSample.map((a, idx) => ({
          ...categorizeAthleteClient(a, rulesOverride),
          sr_no: idx + 1
        }));
        if (activeEventIdRef.current === targetEventId) {
          saveStoredEventAthletes(targetEventId, categorized);
          setRosterState({ eventId: targetEventId, athletes: categorized });
          showToast("Loaded Offline Reference Athletes into this competition");
        }
      }
    } catch {
      setError("Could not load demo athletes. Backend might be offline.");
    } finally {
      setLoading(false);
    }
  }

  // Generate 500 athletes for stress testing strictly within active competition
  async function handleGenerate500() {
    const targetEventId = activeEventIdRef.current;
    if (targetEventId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateSampleAthletes(500, targetEventId);
      if (activeEventIdRef.current === targetEventId) {
        const recategorized = data.athletes.map((a, idx) =>
          recategorizeAthleteRecord({ ...a, sr_no: a.sr_no || idx + 1 }, activeRules)
        );
        saveStoredEventAthletes(targetEventId, recategorized);
        setRosterState({ eventId: targetEventId, athletes: recategorized });
        showToast("Generated 500 Athletes for this competition");
      }
    } catch {
      setError("Failed to generate 500 sample athletes. Backend might be offline.");
    } finally {
      setLoading(false);
    }
  }

  // Export multi-sheet Excel (.xlsx)
  async function handleExportExcel() {
    if (athletes.length === 0) {
      alert("No athletes to export.");
      return;
    }
    try {
      const blob = await exportExcelFile(athletes, currentEvent?.name || "Taekwondo Championship 2026");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(currentEvent?.name || "Taekwondo_Tournament").replace(/[^a-zA-Z0-9_-]/g, "_")}_${athletes.length}_Athletes.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Official Multi-Tab Excel Workbook Downloaded!");
    } catch {
      handleExportCsv();
    }
  }

  // Fallback CSV Export (scoped filename per competition)
  function handleExportCsv() {
    if (athletes.length === 0) return;
    const headers = ["Sr.No", "Name", "Gender", "DOB", "Age", "Division", "Weight(kg)", "Height(cm)", "Weight Class", "Height Bracket", "Category", "Club", "WeighIn Status"];
    const rows = athletes.map((a, idx) => [
      a.sr_no || idx + 1,
      `"${a.name}"`,
      a.gender === "M" ? "Male" : "Female",
      a.dob || "",
      a.calculated_age || "",
      a.age_group,
      a.weight_kg ?? "",
      a.height_cm ?? "",
      `"${a.weight_class}"`,
      `"${a.height_category || ""}"`,
      `"${a.full_category}"`,
      `"${a.club || ""}"`,
      a.weigh_in_status || "pending"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const safeEventSlug = (currentEvent?.name || "Taekwondo_Tournament").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${safeEventSlug}_${athletes.length}_Athletes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Competition Roster CSV");
  }

  // Row operations strictly scoped to active competition
  function handleAddSingleAthlete(athlete: CategorizedAthlete) {
    updateActiveAthletes((prev) => {
      const maxSr = prev.reduce((max, a) => Math.max(max, a.sr_no ?? 0), 0);
      const categorized = recategorizeAthleteRecord({ ...athlete, sr_no: maxSr + 1 }, activeRules);
      return [categorized, ...prev];
    });
    showToast(`Added ${athlete.name} to ${currentEvent?.name || "Roster"}`);
  }

  function handleAddBulkAthletes(newAthletes: CategorizedAthlete[]) {
    updateActiveAthletes((prev) => {
      const maxSr = prev.reduce((max, a) => Math.max(max, a.sr_no ?? 0), 0);
      const reindexed = newAthletes.map((a, i) =>
        recategorizeAthleteRecord({ ...a, sr_no: maxSr + i + 1 }, activeRules)
      );
      return [...reindexed, ...prev];
    });
    showToast(`Added ${newAthletes.length} Athletes to ${currentEvent?.name || "Roster"}`);
  }

  function handleUpdateAthlete(updated: CategorizedAthlete) {
    const targetKey = updated.id ?? updated.sr_no ?? updated.name;
    updateActiveAthletes((prev) =>
      prev.map((a) => {
        if ((a.id ?? a.sr_no ?? a.name) !== targetKey) return a;
        const fieldsChanged =
          a.name !== updated.name ||
          a.dob !== updated.dob ||
          a.gender !== updated.gender ||
          a.weight_kg !== updated.weight_kg ||
          a.height_cm !== updated.height_cm;
        return fieldsChanged ? recategorizeAthleteRecord(updated, activeRules) : updated;
      })
    );
    showToast(`Updated ${updated.name}`);
  }

  function handleDeleteAthlete(idOrSr: number | string) {
    updateActiveAthletes((prev) =>
      prev.filter((a) => (a.id ?? a.sr_no ?? a.name) !== idOrSr && a.name !== idOrSr)
    );
    showToast("Removed athlete from competition roster");
  }

  function handleDeleteSelected(selectedKeys: (number | string)[]) {
    const set = new Set(selectedKeys);
    updateActiveAthletes((prev) => prev.filter((a) => !set.has(a.id ?? a.sr_no ?? a.name)));
    showToast(`Deleted ${selectedKeys.length} athlete${selectedKeys.length === 1 ? "" : "s"}`);
  }

  function handleClearRoster() {
    if (!currentEvent) return;
    if (confirm(`Clear all athletes in "${currentEvent.name}"?\n\nOther competitions will remain untouched.`)) {
      updateActiveAthletes(() => [], currentEvent.id);
      saveStoredEventAthletes(currentEvent.id, []);
      showToast(`Cleared roster for "${currentEvent.name}"`);
    }
  }

  // Sync active competition (metadata, rules, and athletes) strictly under its own ID
  async function handleSyncToDatabase() {
    if (!currentEvent) return;
    const startingEvent = currentEvent;
    setLoading(true);
    try {
      let targetEvent = startingEvent;
      if (startingEvent.id < 0) {
        const promoted = await createTournamentEvent(
          startingEvent.name,
          startingEvent.event_date,
          startingEvent.location || "",
          startingEvent.rule_profile || "tourn2026",
          activeRules
        );
        migrateEventStorageId(startingEvent.id, promoted.id);
        targetEvent = {
          ...promoted,
          athletes_count: athletes.length,
          rules: activeRules,
        };
        if (activeEventIdRef.current === startingEvent.id) {
          activeEventIdRef.current = targetEvent.id;
          saveStoredActiveEventId(targetEvent.id);
          setCurrentEvent(targetEvent);
          setRosterState((prev) => ({ eventId: targetEvent.id, athletes: prev.athletes }));
        }
        setEvents((prev) => {
          const next = prev.map((e) => (e.id === startingEvent.id ? targetEvent : e));
          saveStoredEvents(next);
          return next;
        });
      } else {
        await saveEventRules(targetEvent.id, activeRules).catch(() => {});
      }

      const count = await saveEventAthletes(targetEvent.id, athletes, true);
      showToast(`Saved ${count} athletes to "${targetEvent.name}" database`);
    } catch {
      setError("Could not sync to remote database. Changes remain saved locally for this competition.");
    } finally {
      setLoading(false);
    }
  }

  // Pending weigh-in calculation
  const pendingWeighInCount = athletes.filter(
    (a) => !a.weigh_in_status || a.weigh_in_status === "pending"
  ).length;

  const eventScopeKey = currentEvent?.id ?? "none";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors selection:bg-primary selection:text-primary-foreground relative overflow-x-clip">
      {/* Unified Taekwondo Top Hero Artwork Backdrop shown cleanly across all workspace tabs */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[210px] sm:h-[200px] overflow-hidden">
        <div className="max-w-[1400px] mx-auto relative h-full">
          <img
            src="/tkd-hero-banner.jpg"
            alt=""
            aria-hidden="true"
            className="ml-auto h-full w-full md:w-[70%] lg:w-[58%] object-cover object-[88%_18%] opacity-60 dark:opacity-25"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 via-[48%] to-background/20 dark:from-background dark:via-background/95 dark:via-[50%] dark:to-background/50" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/75 to-transparent" />
      </div>

      {/* 1. Global Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        events={events}
        currentEvent={currentEvent}
        onSelectEvent={handleSelectEvent}
        onNewEvent={() => setShowTournamentModal(true)}
        onDeleteEvent={handleDeleteEvent}
        isBackendOnline={isBackendOnline}
        onOpenRules={() => setShowRulesModal(true)}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        totalAthletesCount={athletes.length}
        pendingWeighInCount={pendingWeighInCount}
      />

      {/* 2. Success Toast Banner */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-foreground text-background px-4 py-2.5 rounded-md shadow-2xl font-display text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 3. Main Workspace Container */}
      <main className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 pt-3 pb-6 space-y-4 print:hidden">
        {/* TAB 1: ATHLETES ROSTER WORKSPACE */}
        {currentTab === "athletes" && (
          <div className="space-y-4">
            {/* Operational Hero Header matching Reference Layout */}
            <section className="relative z-30 py-2">
              <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                {/* Left: Event Venue, Date, Isolation Badge & Tournament Title */}
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {currentEvent?.location || "Venue not specified"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{currentEvent?.event_date || activeRules.event_date || "2026-10-24"}</span>
                    </span>
                    {currentEvent && (
                      <span
                        title="Athletes, rules, and weigh-in records are strictly isolated per competition"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm"
                      >
                        <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {currentEvent.rule_profile === "wt2026" ? "WT Rules" : "2026 Spec"} · Isolated
                        </span>
                      </span>
                    )}
                    {loading && (
                      <span className="text-[11px] font-semibold text-primary">
                        Updating...
                      </span>
                    )}
                  </div>

                  <h1 className="font-display text-3xl sm:text-[36px] font-bold uppercase tracking-tight leading-none text-foreground pt-1">
                    {currentEvent?.name || "2026 DISTRICT TAEKWONDO CHAMPIONSHIP"}
                  </h1>
                  <p className="text-sm text-muted-foreground pt-0.5">
                    Manage registrations and verify tournament categories.
                  </p>
                </div>

                {/* Right: Operational Action Strip (Solid card buttons so labels read sharply over artwork) */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. Primary Action: Add Athletes */}
                  <button
                    type="button"
                    onClick={() => setShowManualModal(true)}
                    title="Open Add athlete drawer (Single or Quick Grid bulk entry)"
                    className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Athletes</span>
                  </button>

                  {/* 2. Import file */}
                  <button
                    type="button"
                    onClick={() => setShowExcelModal(true)}
                    title="Import athletes from Excel (.xlsx) or CSV spreadsheet"
                    className="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <FileUp className="h-4 w-4 text-muted-foreground" />
                    <span>Import file</span>
                  </button>

                  {/* 3. Weigh-in sheet */}
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    disabled={!athletes.length}
                    title={athletes.length ? "Open printable official weigh-in sheet" : "Add athletes first to print weigh-in sheet"}
                    className="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground flex items-center gap-2 transition-colors shadow-sm disabled:opacity-65 disabled:cursor-not-allowed"
                  >
                    <Printer className="h-4 w-4 text-muted-foreground" />
                    <span>Weigh-in sheet</span>
                  </button>

                  {/* 4. Clear */}
                  <button
                    type="button"
                    onClick={handleClearRoster}
                    disabled={!athletes.length}
                    title={athletes.length ? "Clear all athletes from current roster" : "Roster is already empty"}
                    className="h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:text-destructive hover:bg-muted flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-65 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                    <span>Clear</span>
                  </button>

                  {/* 5. More Tools Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                      title="Load demo athletes, 500-athlete stress test, exports, and database sync"
                      className="h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>More</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>

                    {showActionsDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowActionsDropdown(false)}
                        />
                        <div
                          onClick={() => setShowActionsDropdown(false)}
                          className="absolute right-0 mt-1.5 w-60 rounded-xl border border-border bg-card text-foreground shadow-xl py-1.5 z-50 text-xs font-medium"
                        >
                          <button
                            type="button"
                            onClick={() => handleLoadDemo()}
                            title="Load 11 reference sample athletes"
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-warning" />
                            <span>Load 11 Reference Athletes</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerate500}
                            title="Generate 500 synthetic athletes to test scale and exports"
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-primary" />
                            <span>Stress Test (500 Athletes)</span>
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button
                            type="button"
                            onClick={handleExportExcel}
                            disabled={!athletes.length}
                            title="Download categorized Excel workbook (.xlsx)"
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Export Excel (.xlsx)</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={!athletes.length}
                            title="Download roster as CSV file"
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
                          >
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Export CSV</span>
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button
                            type="button"
                            onClick={handleSyncToDatabase}
                            title="Save current roster to backend database"
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
                          >
                            <Database className="h-3.5 w-3.5" />
                            <span>Sync Roster to Database</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/30 text-xs font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} title="Dismiss notification" className="font-bold underline">
                  Dismiss
                </button>
              </div>
            )}

            {/* Summary Metric Cards scoped strictly to active competition */}
            <SummaryCards
              key={`summary-${eventScopeKey}`}
              athletes={athletes}
              selectedAgeGroup={filterAge}
              onSelectAgeGroup={setFilterAge}
            />

            {/* Interactive Athletes Table (keyed by event to reset selection/inline edits cleanly on switch) */}
            <AthletesTable
              key={`table-${eventScopeKey}`}
              athletes={athletes}
              filterAge={filterAge}
              setFilterAge={setFilterAge}
              onEditAthlete={(athlete) => setEditingAthlete(athlete)}
              onUpdateAthlete={handleUpdateAthlete}
              onDeleteAthlete={handleDeleteAthlete}
              onDeleteSelected={handleDeleteSelected}
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCsv}
              onOpenAddModal={() => setShowManualModal(true)}
              rules={activeRules}
            />
          </div>
        )}

        {/* TAB 2: WEIGH-IN TERMINAL WORKSPACE */}
        {currentTab === "weighin" && (
          <WeighInWorkspace
            key={`weighin-${eventScopeKey}`}
            athletes={athletes}
            onUpdateAthlete={handleUpdateAthlete}
            onOpenPrint={() => setShowPrintModal(true)}
            eventTitle={currentEvent?.name || "2026 District Taekwondo Championship"}
            eventDate={currentEvent?.event_date}
            eventLocation={currentEvent?.location}
          />
        )}

        {/* TAB 3: REPORTS & BOUT SHEETS WORKSPACE */}
        {currentTab === "reports" && (
          <ReportsWorkspace
            key={`reports-${eventScopeKey}`}
            athletes={athletes}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onOpenPrint={() => setShowPrintModal(true)}
            eventTitle={currentEvent?.name || "2026 District Taekwondo Championship"}
            eventDate={currentEvent?.event_date}
            eventLocation={currentEvent?.location}
          />
        )}
      </main>

      {/* 4. MODALS & DRAWERS (keyed per event for strict competition separation) */}

      {/* Add Athlete Modal (Single Live & Quick Grid with Block Selectors) */}
      <ManualEntryModal
        key={`manual-${eventScopeKey}`}
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onAddAthlete={handleAddSingleAthlete}
        onAddBulkAthletes={handleAddBulkAthletes}
        existingClubs={Array.from(new Set(athletes.map((a) => a.club).filter(Boolean) as string[]))}
        existingAthletes={athletes}
        rules={activeRules}
        eventName={currentEvent?.name}
      />

      {/* Excel / CSV Drag & Drop Upload */}
      <ExcelUploadModal
        key={`excel-${eventScopeKey}`}
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        eventId={currentEvent?.id}
        eventName={currentEvent?.name}
        onAthletesImported={(newAthletes, filename) => {
          handleAddBulkAthletes(newAthletes);
          setShowExcelModal(false);
          showToast(`Imported ${newAthletes.length} athletes from ${filename} into ${currentEvent?.name || "competition"}`);
        }}
      />

      {/* Tournament Setup Wizard */}
      <TournamentModal
        isOpen={showTournamentModal}
        onClose={() => setShowTournamentModal(false)}
        existingEvents={events}
        onCreated={handleCreateEvent}
      />

      {/* Rules & Brackets Configuration (Scoped strictly to active competition) */}
      <RulesConfigModal
        key={`rules-${eventScopeKey}`}
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        eventId={currentEvent?.id}
        eventName={currentEvent?.name}
        eventDate={currentEvent?.event_date}
        ruleProfile={currentEvent?.rule_profile}
        currentRules={activeRules}
        onRulesUpdated={(updatedRules) => {
          const targetId = currentEvent?.id ?? activeEventIdRef.current;
          setActiveRules(updatedRules);
          if (targetId !== null) {
            saveStoredEventRules(targetId, updatedRules);
            updateActiveAthletes(
              (prev) => prev.map((a) => recategorizeAthleteRecord(a, updatedRules)),
              targetId
            );
            setEvents((prev) => {
              const next = prev.map((ev) =>
                ev.id === targetId ? { ...ev, rules: updatedRules } : ev
              );
              saveStoredEvents(next);
              return next;
            });
          }
          showToast(`Updated rules & recategorized "${currentEvent?.name || "competition"}"`);
        }}
      />

      {/* Official Printable Weigh-In Sheet */}
      <PrintWeighInModal
        key={`print-${eventScopeKey}`}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        athletes={athletes}
        eventTitle={currentEvent?.name || "2026 District Taekwondo Championship"}
        eventDate={currentEvent?.event_date}
        eventLocation={currentEvent?.location}
      />

      {/* Edit Athlete Modal */}
      <EditAthleteModal
        key={`edit-${eventScopeKey}-${editingAthlete?.id ?? editingAthlete?.sr_no ?? "none"}`}
        isOpen={!!editingAthlete}
        onClose={() => setEditingAthlete(null)}
        athlete={editingAthlete}
        onSave={handleUpdateAthlete}
        rules={activeRules}
      />
    </div>
  );
}
