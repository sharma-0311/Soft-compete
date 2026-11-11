"use client";

import React, { useState, useEffect } from "react";
import {
  Users, Scale, FileText, UserPlus, FileUp, Camera, Eraser, Download, Sparkles,
  RefreshCw, Trash2, AlertTriangle, Shield, Printer, CheckCircle2,
  Calendar, Layers, Plus, Database, ChevronDown
} from "lucide-react";

import {
  fetchDemo, generateSampleAthletes, exportExcelFile,
  checkBackendHealth, fetchEvents, saveEventAthletes,
  CategorizedAthlete, TournamentEvent, RulesConfig
} from "@/lib/api";
import { DEFAULT_RULES, categorizeAthleteClient } from "@/lib/rules";

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

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<"athletes" | "weighin" | "reports">("athletes");
  const [athletes, setAthletes] = useState<CategorizedAthlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [filterAge, setFilterAge] = useState<string>("All");

  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<TournamentEvent | null>(null);

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
  }, []);

  // Save to LocalStorage whenever athletes change
  useEffect(() => {
    if (athletes.length > 0) {
      try {
        localStorage.setItem("tkd_athletes_roster_v2", JSON.stringify(athletes));
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }
    }
  }, [athletes]);

  async function initApp() {
    setLoading(true);
    const online = await checkBackendHealth();
    setIsBackendOnline(online);

    // Try restoring from localStorage first
    try {
      const saved = localStorage.getItem("tkd_athletes_roster_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAthletes(parsed);
          setLoading(false);
          loadEvents(online);
          return;
        }
      }
    } catch {}

    // Otherwise load demo
    await handleLoadDemo(online);
    loadEvents(online);
  }

  async function loadEvents(online: boolean) {
    if (online) {
      try {
        const evList = await fetchEvents();
        setEvents(evList);
        if (evList.length > 0) setCurrentEvent(evList[0]);
      } catch {}
    } else {
      const fallbackEvent: TournamentEvent = {
        id: 1,
        name: "Local Tournament",
        event_date: "2026-12-31",
        location: "Offline"
      };
      setEvents([fallbackEvent]);
      setCurrentEvent(fallbackEvent);
    }
  }

  // Load official 11 demo athletes
  async function handleLoadDemo(online: boolean = isBackendOnline) {
    setLoading(true);
    setError(null);
    try {
      if (online) {
        const data = await fetchDemo();
        setAthletes(data.athletes);
        showToast("Loaded 11 Reference Athletes from Official Notebook");
      } else {
        // Offline demo
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
          ...categorizeAthleteClient(a, DEFAULT_RULES),
          sr_no: idx + 1
        }));
        setAthletes(categorized);
        showToast("Loaded Offline Reference Athletes");
      }
    } catch {
      setError("Could not load demo athletes. Backend might be offline.");
    } finally {
      setLoading(false);
    }
  }

  // Generate 500 athletes for stress testing & demonstration
  async function handleGenerate500() {
    setLoading(true);
    setError(null);
    try {
      const data = await generateSampleAthletes(500);
      setAthletes(data.athletes);
      showToast("Generated 500 Realistic Tournament Athletes");
    } catch {
      setError("Failed to generate 500 sample athletes. Using client fallback.");
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

  // Fallback CSV Export
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
      a.weight_kg,
      a.height_cm || "",
      `"${a.weight_class}"`,
      `"${a.height_category || ""}"`,
      `"${a.full_category}"`,
      `"${a.club || ""}"`,
      a.weigh_in_status || "pending"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tournament_Roster_${athletes.length}_Athletes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Roster CSV");
  }

  // Row operations
  function handleAddSingleAthlete(athlete: CategorizedAthlete) {
    const nextSr = athletes.length + 1;
    setAthletes([{ ...athlete, sr_no: nextSr }, ...athletes]);
    showToast(`Added ${athlete.name} to Roster`);
  }

  function handleAddBulkAthletes(newAthletes: CategorizedAthlete[]) {
    const startSr = athletes.length;
    const reindexed = newAthletes.map((a, i) => ({ ...a, sr_no: startSr + i + 1 }));
    setAthletes([...reindexed, ...athletes]);
    showToast(`Added ${newAthletes.length} Athletes to Roster`);
  }

  function handleUpdateAthlete(updated: CategorizedAthlete) {
    setAthletes(athletes.map((a) => ((a.id || a.sr_no) === (updated.id || updated.sr_no) ? updated : a)));
  }

  function handleDeleteAthlete(idOrSr: number | string) {
    setAthletes(athletes.filter((a) => (a.id || a.sr_no) !== idOrSr && a.name !== idOrSr));
  }

  function handleDeleteSelected(selectedKeys: (number | string)[]) {
    const set = new Set(selectedKeys);
    setAthletes(athletes.filter((a) => !set.has(a.id || a.sr_no || a.name)));
    showToast(`Deleted ${selectedKeys.length} Athletes`);
  }

  function handleClearRoster() {
    if (confirm("Clear all athletes in this tournament roster?")) {
      setAthletes([]);
      localStorage.removeItem("tkd_athletes_roster_v2");
      showToast("Roster Cleared");
    }
  }

  // Sync to database if event exists
  async function handleSyncToDatabase() {
    if (!currentEvent) return;
    setLoading(true);
    try {
      const count = await saveEventAthletes(currentEvent.id, athletes, true);
      showToast(`Successfully saved ${count} athletes to tournament database`);
    } catch {
      setError("Could not sync to remote database. Saved in local storage.");
    } finally {
      setLoading(false);
    }
  }

  // Pending weigh-in calculation
  const pendingWeighInCount = athletes.filter(
    (a) => !a.weigh_in_status || a.weigh_in_status === "pending"
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors selection:bg-primary selection:text-primary-foreground">
      {/* 1. Global Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        events={events}
        currentEvent={currentEvent}
        onSelectEvent={setCurrentEvent}
        onNewEvent={() => setShowTournamentModal(true)}
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
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5 print:hidden">
        {/* TAB 1: ATHLETES ROSTER WORKSPACE */}
        {currentTab === "athletes" && (
          <div className="space-y-5">
            {/* Operational Header & Action Row (Exact Screenshot Layout) */}
            <div className="space-y-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-mono font-medium flex items-center gap-1.5">
                  <span>{isBackendOnline ? "ONLINE" : "OFFLINE"}</span>
                  <span>·</span>
                  <span>{currentEvent?.event_date || "2026-12-31"}</span>
                </div>
                <h1 className="font-display text-3xl sm:text-[36px] font-bold uppercase tracking-tight leading-none text-foreground mt-1.5">
                  {currentEvent?.name || "LOCAL TOURNAMENT"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Manage registrations and verify tournament categories.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Primary Action: Add athletes */}
                <button
                  onClick={() => setShowManualModal(true)}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-xs"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add athletes</span>
                </button>

                {/* 2. Secondary Action: Import file */}
                <button
                  onClick={() => setShowExcelModal(true)}
                  className="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground flex items-center gap-2 transition-colors shadow-xs"
                >
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <span>Import file</span>
                </button>

                {/* 3. Scan form (Disabled - keeping visual slot, OCR disabled) */}
                <button
                  type="button"
                  disabled
                  title="Scan form is currently disabled"
                  className="h-9 px-3.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground/70 flex items-center gap-2 shadow-xs opacity-60 cursor-not-allowed"
                >
                  <Camera className="h-4 w-4" />
                  <span>Scan form</span>
                </button>

                {/* 4. Weigh-in sheet */}
                <button
                  onClick={() => setShowPrintModal(true)}
                  disabled={!athletes.length}
                  className="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium text-foreground flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="h-4 w-4 text-muted-foreground" />
                  <span>Weigh-in sheet</span>
                </button>

                {/* 5. Clear */}
                <button
                  onClick={handleClearRoster}
                  disabled={!athletes.length}
                  className="h-9 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-muted/60 flex items-center gap-1.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <Eraser className="h-4 w-4" />
                  <span>Clear</span>
                </button>

                {/* Subtle More Actions Dropdown */}
                <div className="relative ml-auto">
                  <button
                    onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                    className="h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Tools</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {showActionsDropdown && (
                    <div
                      onClick={() => setShowActionsDropdown(false)}
                      className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg py-1 z-30 text-xs font-medium"
                    >
                      <button
                        onClick={() => handleLoadDemo()}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-warning" />
                        <span>Load 11 Reference Athletes</span>
                      </button>
                      <button
                        onClick={handleGenerate500}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-primary" />
                        <span>Stress Test (500 Athletes)</span>
                      </button>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={handleSyncToDatabase}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-success"
                      >
                        <Database className="h-3.5 w-3.5" />
                        <span>Sync Roster to Database</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/30 text-xs font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="font-bold underline">
                  Dismiss
                </button>
              </div>
            )}

            {/* Lovable Summary Metric Cards (1.3fr : 1fr : 1fr : 1fr : 1fr) */}
            <SummaryCards
              athletes={athletes}
              selectedAgeGroup={filterAge}
              onSelectAgeGroup={setFilterAge}
            />

            {/* Lovable Interactive Athletes Table */}
            <AthletesTable
              athletes={athletes}
              filterAge={filterAge}
              setFilterAge={setFilterAge}
              onEditAthlete={(athlete) => setEditingAthlete(athlete)}
              onDeleteAthlete={handleDeleteAthlete}
              onDeleteSelected={handleDeleteSelected}
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCsv}
              onOpenAddModal={() => setShowManualModal(true)}
            />
          </div>
        )}

        {/* TAB 2: WEIGH-IN TERMINAL WORKSPACE */}
        {currentTab === "weighin" && (
          <WeighInWorkspace
            athletes={athletes}
            onUpdateAthlete={handleUpdateAthlete}
            onOpenPrint={() => setShowPrintModal(true)}
            eventTitle={currentEvent?.name || "State Taekwondo Championship 2026"}
          />
        )}

        {/* TAB 3: REPORTS & BOUT SHEETS WORKSPACE */}
        {currentTab === "reports" && (
          <ReportsWorkspace
            athletes={athletes}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onOpenPrint={() => setShowPrintModal(true)}
            eventTitle={currentEvent?.name || "State Taekwondo Championship 2026"}
          />
        )}
      </main>

      {/* 4. MODALS & DRAWERS */}

      {/* Add Athlete Modal (Single Live & Quick Grid with Block Selectors) */}
      <ManualEntryModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onAddAthlete={handleAddSingleAthlete}
        onAddBulkAthletes={handleAddBulkAthletes}
        existingClubs={Array.from(new Set(athletes.map((a) => a.club).filter(Boolean) as string[]))}
      />

      {/* Excel / CSV Drag & Drop Upload */}
      <ExcelUploadModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onAthletesImported={(newAthletes, filename) => {
          handleAddBulkAthletes(newAthletes);
          setShowExcelModal(false);
          showToast(`Imported ${newAthletes.length} athletes from ${filename}`);
        }}
      />

      {/* Tournament Setup Wizard */}
      <TournamentModal
        isOpen={showTournamentModal}
        onClose={() => setShowTournamentModal(false)}
        onCreated={(newEvent) => {
          setEvents([newEvent, ...events]);
          setCurrentEvent(newEvent);
          showToast(`Tournament "${newEvent.name}" Created`);
        }}
      />

      {/* Rules & Brackets Configuration */}
      <RulesConfigModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        onRulesUpdated={() => {
          showToast("Classification Rules Updated");
        }}
      />

      {/* Official Printable Weigh-In Sheet */}
      <PrintWeighInModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        athletes={athletes}
        eventTitle={currentEvent?.name || "State Taekwondo Championship 2026"}
      />

      {/* Edit Athlete Modal */}
      <EditAthleteModal
        isOpen={!!editingAthlete}
        onClose={() => setEditingAthlete(null)}
        athlete={editingAthlete}
        onSave={handleUpdateAthlete}
      />
    </div>
  );
}
