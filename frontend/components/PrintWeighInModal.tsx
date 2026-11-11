"use client";

import React, { useState, useRef, useMemo } from "react";
import { Printer, X, Download, Shield, Filter } from "lucide-react";
import { CategorizedAthlete } from "@/lib/api";

interface PrintWeighInModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: CategorizedAthlete[];
  eventTitle: string;
}

export const PrintWeighInModal: React.FC<PrintWeighInModalProps> = ({
  isOpen,
  onClose,
  athletes,
  eventTitle
}) => {
  const [filterDivision, setFilterDivision] = useState<string>("All");
  const printRef = useRef<HTMLDivElement>(null);

  const filteredAthletes = useMemo(() => {
    if (filterDivision === "All") return athletes;
    return athletes.filter((a) => a.age_group === filterDivision);
  }, [athletes, filterDivision]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden relative text-slate-900 dark:text-slate-100"
      >
        {/* Header toolbar (Hidden during print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 no-print">
          <div>
            <h3 className="text-lg font-bold">
              Official Weigh-In & Verification Roster
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Championship weigh-in sheets with physical scale checks and referee sign-offs
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Division Filter */}
            <select
              aria-label="Filter Print Sheet by Division"
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            >
              <option value="All">All Divisions ({athletes.length})</option>
              <option value="Sub-Jr">Sub-Junior</option>
              <option value="Cadet">Cadet</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
            </select>

            <button
              onClick={handlePrint}
              title="Open system print dialog or save weigh-in sheet as PDF"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              title="Close print preview modal"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/60">
          <div
            ref={printRef}
            className="bg-white max-w-4xl mx-auto p-6 sm:p-8 rounded-xl shadow border border-slate-200 text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 space-y-6"
          >
            {/* Header / Federation Banner */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
                {eventTitle || "STATE TAEKWONDO CHAMPIONSHIP 2026"}
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-700">
                Official Athlete Weigh-In & Category Verification Roster
              </p>
              <div className="text-[11px] text-slate-600 pt-1 flex items-center justify-center gap-6">
                <span>Division: <b>{filterDivision === "All" ? "All Competition Categories" : filterDivision}</b></span>
                <span>Total Athletes: <b>{filteredAthletes.length}</b></span>
                <span>Date: October 2026</span>
              </div>
            </div>

            {/* Verification Table */}
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-400 text-[11px]">
                  <th className="p-2 border-r border-slate-400 w-8 text-center">#</th>
                  <th className="p-2 border-r border-slate-400">Athlete Name</th>
                  <th className="p-2 border-r border-slate-400">Club / Academy</th>
                  <th className="p-2 border-r border-slate-400 w-16 text-center">Gender</th>
                  <th className="p-2 border-r border-slate-400 w-16 text-center">Division</th>
                  <th className="p-2 border-r border-slate-400 w-28">Weight Class</th>
                  <th className="p-2 border-r border-slate-400 w-20 text-center">Declared Wt</th>
                  <th className="p-2 border-r border-slate-400 w-24 text-center">Scale Wt</th>
                  <th className="p-2 border-r border-slate-400 w-16 text-center">Pass / Fail</th>
                  <th className="p-2 text-center w-28">Referee Sig.</th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.map((a, idx) => (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-300 font-bold uppercase">{a.name}</td>
                    <td className="p-2 border-r border-slate-300 text-slate-700">{a.club || "–"}</td>
                    <td className="p-2 border-r border-slate-300 text-center">{a.gender === "M" ? "Boy" : "Girl"}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-semibold">{a.age_group}</td>
                    <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{a.weight_class}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-mono">
                      {a.weight_kg != null ? `${a.weight_kg} kg` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-mono">
                      {a.scale_weight_kg ? `${a.scale_weight_kg} kg` : ""}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center">
                      <div className="w-4 h-4 border border-slate-500 rounded-sm mx-auto flex items-center justify-center font-bold text-[10px]">
                        {a.weigh_in_status === "passed" ? "✓" : a.weigh_in_status === "failed" ? "✗" : ""}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="w-20 border-b border-slate-300 h-4 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
              <div>
                <div className="border-b border-slate-500 w-36 mx-auto mb-1" />
                <span className="font-bold">Tournament Director</span>
              </div>
              <div>
                <div className="border-b border-slate-500 w-36 mx-auto mb-1" />
                <span className="font-bold">Chief Referee</span>
              </div>
              <div>
                <div className="border-b border-slate-500 w-36 mx-auto mb-1" />
                <span className="font-bold">Weigh-In Incharge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
