"use client";

import React, { useState, useRef } from "react";
import { Upload, FileUp, Loader2, CheckCircle2, AlertTriangle, X, Download } from "lucide-react";
import { uploadExcel, CategorizedAthlete } from "@/lib/api";

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAthletesImported: (athletes: CategorizedAthlete[], filename: string) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onAthletesImported,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    file: string;
    athletes: CategorizedAthlete[];
    warnings: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setParsedData(null);

    try {
      const data = await uploadExcel(file);
      setParsedData({
        file: file.name,
        athletes: data.athletes,
        warnings: data.errors || [],
      });
    } catch (err: any) {
      setError(
        err.message ||
          "Spreadsheet upload failed. Please ensure required columns (Name, Weight) are present."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "Name,DOB,Gender,Weight,Height,Club\n" +
      "ADITYA VERMA,12/04/2016,M,26.4,128,Tiger TKD Academy\n" +
      "RIYA SHARMA,03/11/2013,F,38.0,,Tiger TKD Academy\n" +
      "ISHAN KAPOOR,20/07/2010,M,57.5,,Tiger TKD Academy\n" +
      "TARA NAIR,19/02/2017,F,23.5,125,Tiger TKD Academy\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "athletes_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card text-card-foreground rounded-lg border border-border shadow-2xl max-w-xl w-full p-6 space-y-4 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
            Import Excel / CSV
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-detects columns: Name, DOB, Gender, Weight, Height, Club
          </p>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`grid cursor-pointer place-items-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/60 bg-muted/20"
          }`}
        >
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <FileUp className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="mt-2 text-sm font-medium text-foreground">
            {loading ? "Processing roster rows..." : "Drop a roster file or click to browse"}
          </div>
          <div className="text-xs text-muted-foreground">.xlsx, .xls, .csv</div>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Download sample CSV template link */}
        <button
          type="button"
          onClick={downloadSampleTemplate}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <Download className="h-3.5 w-3.5 text-primary" />
          <span>Download sample CSV template</span>
        </button>

        {/* Error message */}
        {error && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Parsed summary results */}
        {parsedData && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border border-border p-3 bg-muted/30">
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span>Parsed rows</span>
                </div>
                <div className="font-display text-3xl font-bold tabular-nums text-foreground mt-1">
                  {parsedData.athletes.length}
                </div>
              </div>

              <div className="rounded border border-border p-3 bg-muted/30">
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  <span>Warnings</span>
                </div>
                <div className="font-display text-3xl font-bold tabular-nums text-foreground mt-1">
                  {parsedData.warnings.length}
                </div>
              </div>
            </div>

            {parsedData.warnings.length > 0 && (
              <ul className="max-h-32 overflow-auto rounded bg-muted p-2 text-xs text-warning space-y-0.5">
                {parsedData.warnings.map((w, idx) => (
                  <li key={idx}>• {w}</li>
                ))}
              </ul>
            )}

            <button
              type="button"
              disabled={!parsedData.athletes.length}
              onClick={() => {
                onAthletesImported(parsedData.athletes, parsedData.file);
                onClose();
              }}
              className="h-10 w-full rounded-md bg-primary text-primary-foreground font-display text-sm font-bold uppercase tracking-wide hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              Add {parsedData.athletes.length} athletes to roster
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
