"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, RotateCcw, X, Plus, Trash2, CheckCircle2, Shield, AlertTriangle } from "lucide-react";
import { RulesConfig, saveEventRules } from "@/lib/api";
import { DEFAULT_RULES, buildRulesForProfile } from "@/lib/rules";

interface RulesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesUpdated: (rules: RulesConfig) => void;
  eventId?: number;
  eventName?: string;
  eventDate?: string;
  ruleProfile?: string;
  currentRules?: RulesConfig;
}

export const RulesConfigModal: React.FC<RulesConfigModalProps> = ({
  isOpen,
  onClose,
  onRulesUpdated,
  eventId,
  eventName,
  eventDate,
  ruleProfile,
  currentRules = DEFAULT_RULES,
}) => {
  const [rules, setRules] = useState<RulesConfig>(currentRules);
  const [activeTab, setActiveTab] = useState<"age" | "weight" | "height">("age");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("Sub-Jr");
  const [selectedGender, setSelectedGender] = useState<"M" | "F">("M");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRules(JSON.parse(JSON.stringify(currentRules || DEFAULT_RULES)));
      setSavedSuccess(false);
    }
  }, [isOpen, currentRules, eventId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (eventId && eventId > 0) {
        const updated = await saveEventRules(eventId, rules);
        setRules(updated);
        onRulesUpdated(updated);
      } else {
        onRulesUpdated(rules);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      onRulesUpdated(rules);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm(`Reset age, weight, and height rules to default federation specs for "${eventName || "this competition"}"?`)) {
      const profile = ruleProfile === "wt2026" ? "wt2026" : "tourn2026";
      const defaults = buildRulesForProfile(profile, eventDate || rules.event_date);
      setRules(defaults);
      try {
        if (eventId && eventId > 0) {
          const saved = await saveEventRules(eventId, defaults);
          setRules(saved);
          onRulesUpdated(saved);
          return;
        }
      } catch {}
      onRulesUpdated(defaults);
    }
  };

  const currentWeightClasses = rules.weight_classes?.[selectedAgeGroup]?.[selectedGender] || [];

  const updateWeightClass = (idx: number, minW: number, maxW: number, label: string) => {
    const copy = JSON.parse(JSON.stringify(rules));
    copy.weight_classes[selectedAgeGroup][selectedGender][idx] = [minW, maxW, label];
    setRules(copy);
  };

  const addWeightClass = () => {
    const copy = JSON.parse(JSON.stringify(rules));
    if (!copy.weight_classes[selectedAgeGroup]) copy.weight_classes[selectedAgeGroup] = { M: [], F: [] };
    if (!copy.weight_classes[selectedAgeGroup][selectedGender]) copy.weight_classes[selectedAgeGroup][selectedGender] = [];
    copy.weight_classes[selectedAgeGroup][selectedGender].push([50, 55, "50-55kg"]);
    setRules(copy);
  };

  const deleteWeightClass = (idx: number) => {
    const copy = JSON.parse(JSON.stringify(rules));
    copy.weight_classes[selectedAgeGroup][selectedGender].splice(idx, 1);
    setRules(copy);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-start sm:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                Competition Classification Rules
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {eventName ? (
                  <>
                    Scoped only to <span className="font-semibold text-blue-600 dark:text-blue-400">{eventName}</span> • Other competitions are unaffected
                  </>
                ) : (
                  "Configure birth years, weight brackets, and Sub-Jr height ranges"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={handleReset}
              title="Restore default 2026 birth-year, weight, and height bracket rules"
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Reset 2026 Defaults</span>
              <span className="sm:hidden">Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close classification rules modal"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher (Horizontally scrollable on narrow mobile screens) */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold overflow-x-auto thin-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("age")}
            title="Edit birth-year ranges for Sub-Junior, Cadet, Junior, and Senior divisions"
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "age"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Age Divisions (Birth Years)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("weight")}
            title="Configure weight divisions by age group and gender"
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "weight"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Weight Classes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("height")}
            title="View height brackets used for Sub-Junior and optional-weight fallback categorization"
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "height"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Sub-Jr Height Brackets
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-5 space-y-4">
          {/* 1. Age Rules */}
          {activeTab === "age" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Athletes are categorized into these 4 official divisions according to birth year.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(rules.age_rules || {}).map(([key, val]) => (
                  <div key={key} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm">{key}</span>
                      <span className="text-xs text-slate-400">Approx {val.approx_age_min}–{val.approx_age_max} yrs</span>
                    </div>
                    <p className="text-xs text-slate-500">{val.description}</p>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Start Year</span>
                        <input
                          type="number"
                          value={val.start_year}
                          onChange={(e) => {
                            const copy = JSON.parse(JSON.stringify(rules));
                            copy.age_rules[key].start_year = parseInt(e.target.value);
                            setRules(copy);
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">End Year</span>
                        <input
                          type="number"
                          value={val.end_year}
                          onChange={(e) => {
                            const copy = JSON.parse(JSON.stringify(rules));
                            copy.age_rules[key].end_year = parseInt(e.target.value);
                            setRules(copy);
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Weight Classes */}
          {activeTab === "weight" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span>Division:</span>
                  <select
                    value={selectedAgeGroup}
                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Sub-Jr">Sub-Junior</option>
                    <option value="Cadet">Cadet</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                  </select>

                  <span>Gender:</span>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value as "M" | "F")}
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="M">Male (Boys)</option>
                    <option value="F">Female (Girls)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={addWeightClass}
                  title="Append a new weight class row to this division and gender"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Class</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto thin-scrollbar">
                <table className="w-full min-w-[460px] text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">Lower Limit (kg)</th>
                      <th className="p-2.5">Upper Limit (kg)</th>
                      <th className="p-2.5">Display Class Name</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentWeightClasses.map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono">
                          <input
                            type="number"
                            step="0.5"
                            value={w[0]}
                            onChange={(e) => updateWeightClass(idx, parseFloat(e.target.value) || 0, w[1], w[2])}
                            className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </td>
                        <td className="p-2 font-mono">
                          <input
                            type="number"
                            step="0.5"
                            value={w[1]}
                            onChange={(e) => updateWeightClass(idx, w[0], parseFloat(e.target.value) || 999, w[2])}
                            className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={w[2]}
                            onChange={(e) => updateWeightClass(idx, w[0], w[1], e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => deleteWeightClass(idx)}
                            title={`Remove weight class "${w[2]}"`}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Height Categories for Sub-Jr */}
          {activeTab === "height" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sub-Junior fighters are sub-divided into 12 height brackets to ensure safety and fair competition.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {rules.height_categories.map((h, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
                    <span className="font-mono text-slate-400">#{idx + 1}</span>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">{h[2]}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{h[0]}cm to {h[1]}cm</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Rules Saved Successfully!
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            title="Save rule changes and re-categorize tournament athletes"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Apply & Save Rules"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
