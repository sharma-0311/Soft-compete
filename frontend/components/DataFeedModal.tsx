"use client";

import React, { useState } from "react";
import { Code, Send, CheckCircle2, AlertCircle, Copy, Check, X, Sparkles } from "lucide-react";
import { categorizeBulk, CategorizedAthlete } from "@/lib/api";

interface DataFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAthletes: (athletes: CategorizedAthlete[]) => void;
}

const TEMPLATES = {
  single: JSON.stringify(
    {
      name: "AARAV SHARMA",
      dob: "2016-02-14",
      gender: "M",
      weight_kg: 32.5,
      height_cm: 138.0,
      club: "Delhi Taekwondo Academy"
    },
    null,
    2
  ),
  multiple: JSON.stringify(
    [
      {
        name: "ASHMITA VERMA",
        dob: "2017-11-26",
        gender: "F",
        weight_kg: 27.1,
        height_cm: 129.0,
        club: "GHSS Sports Wing"
      },
      {
        name: "VIBHOR GUPTA",
        dob: "2019-10-11",
        gender: "M",
        weight_kg: 23.7,
        height_cm: 131.5,
        club: "GHSS Sports Wing"
      },
      {
        name: "MOKSHIK SINGH",
        dob: "2014-01-19",
        gender: "M",
        weight_kg: 60.3,
        height_cm: 174.5,
        club: "Warriors Club"
      },
      {
        name: "ANANYA PATEL",
        dob: "2010-08-05",
        gender: "F",
        weight_kg: 52.0,
        height_cm: 162.0,
        club: "Strikers Academy"
      }
    ],
    null,
    2
  ),
  webhook: JSON.stringify(
    {
      event_id: "DELHI-TKD-2026",
      source: "online_registration_form",
      athletes: [
        {
          name: "ROHAN YADAV",
          dob: "2014-09-13",
          gender: "M",
          weight_kg: 46.5,
          height_cm: 145.0,
          club: "Tigers Dojang"
        },
        {
          name: "MYSHA CHAUHAN",
          dob: "2016-09-01",
          gender: "F",
          weight_kg: 31.2,
          height_cm: 139.5,
          club: "Apex Club"
        }
      ]
    },
    null,
    2
  )
};

export const DataFeedModal: React.FC<DataFeedModalProps> = ({
  isOpen,
  onClose,
  onImportAthletes
}) => {
  const [jsonInput, setJsonInput] = useState<string>(TEMPLATES.multiple);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseOutput, setResponseOutput] = useState<CategorizedAthlete[] | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectTemplate = (type: "single" | "multiple" | "webhook") => {
    setJsonInput(TEMPLATES[type]);
    setError(null);
    setResponseOutput(null);
  };

  const handleSendFeed = async () => {
    setError(null);
    setResponseOutput(null);
    setLoading(true);

    try {
      const parsed = JSON.parse(jsonInput);
      let payloadList: any[] = [];

      if (Array.isArray(parsed)) {
        payloadList = parsed;
      } else if (parsed.athletes && Array.isArray(parsed.athletes)) {
        payloadList = parsed.athletes;
      } else if (parsed.name && (parsed.weight_kg != null || parsed.height_cm != null)) {
        payloadList = [parsed];
      } else {
        throw new Error("Payload must be an athlete object, array of athletes, or have an 'athletes' array.");
      }

      const results = await categorizeBulk(payloadList);
      setResponseOutput(results);
    } catch (err: any) {
      setError(err.message || "Failed to process data feed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (responseOutput) {
      navigator.clipboard.writeText(JSON.stringify(responseOutput, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImportToTournament = () => {
    if (responseOutput && responseOutput.length > 0) {
      onImportAthletes(responseOutput);
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Structured Form / JSON Data Feed
              </h3>
              <p className="text-xs text-slate-500">
                Test API ingestion from online registration forms, webhooks, or club software
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close JSON data feed modal"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 sm:p-6 space-y-4">
          {/* Template Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700">Pre-filled Payloads:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSelectTemplate("single")}
                title="Load single athlete JSON payload template"
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Single Athlete
              </button>
              <button
                onClick={() => handleSelectTemplate("multiple")}
                title="Load multi-athlete array JSON payload template"
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Club Roster (4 Athletes)
              </button>
              <button
                onClick={() => handleSelectTemplate("webhook")}
                title="Load registration webhook envelope JSON template"
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Webhook Envelope
              </button>
            </div>
          </div>

          {/* Editors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input JSON */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Request Payload (JSON)
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={14}
                className="w-full p-3 font-mono text-xs bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Response Output */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Categorized Response ({responseOutput ? responseOutput.length : 0} Athletes)
                </label>
                {responseOutput && (
                  <button
                    onClick={handleCopy}
                    title="Copy categorized JSON response to clipboard"
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy JSON"}
                  </button>
                )}
              </div>

              <div className="flex-1 min-h-[280px] p-3 font-mono text-xs bg-slate-950 text-emerald-300 rounded-2xl border border-slate-800 overflow-auto">
                {responseOutput ? (
                  <pre>{JSON.stringify(responseOutput, null, 2)}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Click &quot;Send & Categorize Live&quot; to test response
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Endpoint: <code className="bg-white px-2 py-0.5 rounded border">POST /categorize/bulk</code>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleSendFeed}
              disabled={loading}
              title="Send JSON payload to /categorize/bulk endpoint for live categorization"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? "Processing..." : "Send & Categorize Live"}
            </button>

            {responseOutput && responseOutput.length > 0 && (
              <button
                onClick={handleImportToTournament}
                title={`Import ${responseOutput.length} categorized athlete(s) into active tournament roster`}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Import to Active Tournament
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
