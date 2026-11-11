/**
 * Event-Scoped Storage & Migration Helpers for Soft Compete.
 * Ensures every competition/event keeps completely isolated rosters, weigh-in states, and rules.
 */

import { CategorizedAthlete, RulesConfig, TournamentEvent } from "./api";

const EVENTS_LIST_KEY = "soft_compete_events_v1";
const ACTIVE_EVENT_ID_KEY = "soft_compete_active_event_id_v1";
const EVENT_ATHLETES_PREFIX = "soft_compete_event_athletes_v1_";
const EVENT_RULES_PREFIX = "soft_compete_event_rules_v1_";
const MIGRATION_FLAG_KEY = "soft_compete_legacy_migrated_v1";

const LEGACY_ATHLETES_KEY = "tkd_athletes_roster_v2";
const LEGACY_RULES_KEY = "tkd_active_rules_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAthletesStorageKey(eventId: number): string {
  return `${EVENT_ATHLETES_PREFIX}${eventId}`;
}

export function getRulesStorageKey(eventId: number): string {
  return `${EVENT_RULES_PREFIX}${eventId}`;
}

export function getStoredEvents(): TournamentEvent[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(EVENTS_LIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredEvents(events: TournamentEvent[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(EVENTS_LIST_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn("Could not save competition list:", e);
  }
}

export function getStoredActiveEventId(): number | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(ACTIVE_EVENT_ID_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) && num !== 0 ? num : null;
  } catch {
    return null;
  }
}

export function saveStoredActiveEventId(eventId: number | null): void {
  if (!isBrowser()) return;
  try {
    if (eventId === null) {
      localStorage.removeItem(ACTIVE_EVENT_ID_KEY);
    } else {
      localStorage.setItem(ACTIVE_EVENT_ID_KEY, String(eventId));
    }
  } catch {}
}

export function hasStoredEventAthletes(eventId: number): boolean {
  if (!isBrowser()) return false;
  try {
    return localStorage.getItem(getAthletesStorageKey(eventId)) !== null;
  } catch {
    return false;
  }
}

export function getStoredEventAthletes(eventId: number): CategorizedAthlete[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(getAthletesStorageKey(eventId));
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredEventAthletes(eventId: number, athletes: CategorizedAthlete[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(getAthletesStorageKey(eventId), JSON.stringify(athletes));
  } catch (e) {
    console.warn(`Could not save roster for event ${eventId}:`, e);
  }
}

export function getStoredEventRules(eventId: number): RulesConfig | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(getRulesStorageKey(eventId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as RulesConfig) : null;
  } catch {
    return null;
  }
}

export function saveStoredEventRules(eventId: number, rules: RulesConfig): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(getRulesStorageKey(eventId), JSON.stringify(rules));
  } catch (e) {
    console.warn(`Could not save rules for event ${eventId}:`, e);
  }
}

export function removeStoredEventData(eventId: number): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(getAthletesStorageKey(eventId));
    localStorage.removeItem(getRulesStorageKey(eventId));
  } catch {}
}

export function migrateEventStorageId(oldId: number, newId: number): void {
  if (!isBrowser() || oldId === newId) return;
  try {
    const oldAthletes = getStoredEventAthletes(oldId);
    if (oldAthletes !== null) {
      saveStoredEventAthletes(newId, oldAthletes);
    }
    const oldRules = getStoredEventRules(oldId);
    if (oldRules !== null) {
      saveStoredEventRules(newId, oldRules);
    }
    removeStoredEventData(oldId);
    if (getStoredActiveEventId() === oldId) {
      saveStoredActiveEventId(newId);
    }
  } catch {}
}

/**
 * Migrate legacy unscoped localStorage data exactly once into the initial competition
 * so prior data stays intact without leaking into other competitions.
 */
export function migrateLegacyStorageOnce(targetEventId: number): void {
  if (!isBrowser()) return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === "1") return;

    const legacyAthletesRaw = localStorage.getItem(LEGACY_ATHLETES_KEY);
    if (legacyAthletesRaw && !hasStoredEventAthletes(targetEventId)) {
      const parsed = JSON.parse(legacyAthletesRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        saveStoredEventAthletes(targetEventId, parsed);
      }
    }

    const legacyRulesRaw = localStorage.getItem(LEGACY_RULES_KEY);
    if (legacyRulesRaw && !getStoredEventRules(targetEventId)) {
      const parsedRules = JSON.parse(legacyRulesRaw);
      if (parsedRules && typeof parsedRules === "object") {
        saveStoredEventRules(targetEventId, parsedRules);
      }
    }

    localStorage.setItem(MIGRATION_FLAG_KEY, "1");
    localStorage.removeItem(LEGACY_ATHLETES_KEY);
    localStorage.removeItem(LEGACY_RULES_KEY);
  } catch {}
}

/** Generate a negative local event ID so offline competitions never collide with DB auto-increment IDs. */
export function generateLocalEventId(existing: TournamentEvent[]): number {
  let candidate = -Math.floor(Date.now() % 1_000_000_000) - 1;
  const taken = new Set(existing.map((e) => e.id));
  while (taken.has(candidate) || candidate === 0) {
    candidate -= 1;
  }
  return candidate;
}

/** Merge backend DB events with any local-only (negative ID) events, preserving accurate counts. */
export function mergeEventsSafe(
  remoteEvents: TournamentEvent[],
  localEvents: TournamentEvent[] | null
): TournamentEvent[] {
  const byId = new Map<number, TournamentEvent>();

  for (const ev of remoteEvents) {
    const cachedAthletes = getStoredEventAthletes(ev.id);
    byId.set(ev.id, {
      ...ev,
      athletes_count: cachedAthletes !== null ? cachedAthletes.length : (ev.athletes_count ?? 0),
    });
  }

  if (localEvents) {
    for (const lev of localEvents) {
      if (lev.id < 0 && !byId.has(lev.id)) {
        const cachedAthletes = getStoredEventAthletes(lev.id);
        byId.set(lev.id, {
          ...lev,
          athletes_count: cachedAthletes !== null ? cachedAthletes.length : (lev.athletes_count ?? 0),
        });
      }
    }
  }

  return Array.from(byId.values());
}

