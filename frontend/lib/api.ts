/**
 * API Client for Taekwondo Categorizer FastAPI Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AthleteInput {
  id?: number;
  sr_no?: number;
  name: string;
  dob?: string | null;
  age_years?: number | null;
  gender: string;
  weight_kg: number;
  height_cm?: number | null;
  club?: string | null;
}

export interface CategorizedAthlete {
  id?: number;
  sr_no?: number;
  name: string;
  gender: string;
  dob?: string | null;
  calculated_age?: number | null;
  competition_age?: number | null;
  age_group: string;
  weight_kg: number;
  height_cm?: number | null;
  weight_class: string;
  height_category?: string | null;
  full_category: string;
  notes: string[];
  club?: string | null;
  // Local operational state
  weigh_in_status?: "pending" | "passed" | "failed" | "review";
  scale_weight_kg?: number | null;
  scale_height_cm?: number | null;
  weigh_in_notes?: string | null;
  weigh_in_time?: string | null;
  verification_status?: "ready" | "needs_review" | "provisional";
}

export interface RulesConfig {
  event_year: number;
  event_date: string;
  age_rules: Record<string, {
    start_year: number;
    end_year: number;
    approx_age_min: number;
    approx_age_max: number;
    description: string;
  }>;
  weight_classes: Record<string, Record<string, [number, number, string][]>>;
  height_categories: [number, number, string][];
}

export interface TournamentEvent {
  id: number;
  name: string;
  event_date: string;
  location?: string;
  athletes_count?: number;
  created_at?: string;
}

// 1. Health check
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

// 2. Fetch demo athletes (11 official reference athletes)
export async function fetchDemo(): Promise<{ total: number; athletes: CategorizedAthlete[] }> {
  const res = await fetch(`${API_BASE}/demo`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch demo data");
  return res.json();
}

// 3. Generate realistic sample athletes (100 to 2000)
export async function generateSampleAthletes(count: number = 500): Promise<{ total: number; athletes: CategorizedAthlete[] }> {
  const res = await fetch(`${API_BASE}/sample/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error("Failed to generate sample data");
  return res.json();
}

// 4. Single categorize
export async function categorizeSingle(athlete: AthleteInput): Promise<CategorizedAthlete> {
  const res = await fetch(`${API_BASE}/categorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(athlete),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Categorization failed");
  }
  return res.json();
}

// 5. Bulk categorize
export async function categorizeBulk(athletes: AthleteInput[]): Promise<CategorizedAthlete[]> {
  const res = await fetch(`${API_BASE}/categorize/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(athletes),
  });
  if (!res.ok) throw new Error("Failed to categorize bulk athletes");
  return res.json();
}

// 6. Excel/CSV upload
export async function uploadExcel(file: File): Promise<{
  filename: string;
  total_processed: number;
  errors: string[];
  athletes: CategorizedAthlete[];
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload/excel`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

// 7. Export multi-sheet Excel (.xlsx)
export async function exportExcelFile(athletes: CategorizedAthlete[], eventTitle: string = "Taekwondo Championship 2026"): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export/excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ athletes, event_title: eventTitle }),
  });
  if (!res.ok) throw new Error("Failed to export Excel file");
  return res.blob();
}

// 8. Rules API
export async function fetchRules(): Promise<RulesConfig> {
  const res = await fetch(`${API_BASE}/rules`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch rules");
  return res.json();
}

export async function saveRules(rules: RulesConfig): Promise<RulesConfig> {
  const res = await fetch(`${API_BASE}/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rules),
  });
  if (!res.ok) throw new Error("Failed to save rules");
  const data = await res.json();
  return data.rules;
}

export async function resetRules(): Promise<RulesConfig> {
  const res = await fetch(`${API_BASE}/rules/reset`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset rules");
  const data = await res.json();
  return data.rules;
}

// 9. Events API
export async function fetchEvents(): Promise<TournamentEvent[]> {
  const res = await fetch(`${API_BASE}/events`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function createTournamentEvent(name: string, event_date: string = "2026-10-24", location: string = ""): Promise<TournamentEvent> {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, event_date, location }),
  });
  if (!res.ok) throw new Error("Failed to create tournament event");
  return res.json();
}

export async function fetchEventAthletes(eventId: number): Promise<CategorizedAthlete[]> {
  const res = await fetch(`${API_BASE}/events/${eventId}/athletes`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch event athletes");
  const data = await res.json();
  return data.athletes;
}

export async function saveEventAthletes(eventId: number, athletes: CategorizedAthlete[], replace: boolean = false): Promise<number> {
  const res = await fetch(`${API_BASE}/events/${eventId}/athletes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ athletes, replace }),
  });
  if (!res.ok) throw new Error("Failed to save event athletes");
  const data = await res.json();
  return data.saved_count;
}
