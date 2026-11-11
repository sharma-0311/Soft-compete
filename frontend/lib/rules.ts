/**
 * Client-Side Offline Categorization Engine & Default Rules
 * Mirrors backend rules_engine.py for offline zero-latency categorization.
 */

import { AthleteInput, CategorizedAthlete, RulesConfig } from "./api";

export const DEFAULT_RULES: RulesConfig = {
  event_year: 2026,
  event_date: "2026-10-24",
  age_rules: {
    "Sub-Jr": {
      start_year: 2015,
      end_year: 2019,
      approx_age_min: 8,
      approx_age_max: 11,
      description: "Born 2015–2019 (approx 8–11 years)"
    },
    "Cadet": {
      start_year: 2012,
      end_year: 2014,
      approx_age_min: 12,
      approx_age_max: 14,
      description: "Born 2012–2014 (approx 12–14 years)"
    },
    "Junior": {
      start_year: 2009,
      end_year: 2011,
      approx_age_min: 15,
      approx_age_max: 17,
      description: "Born 2009–2011 (approx 15–17 years)"
    },
    "Senior": {
      start_year: 1960,
      end_year: 2008,
      approx_age_min: 18,
      approx_age_max: 99,
      description: "Born 2008 or earlier (18+ years)"
    }
  },
  weight_classes: {
    "Sub-Jr": {
      "M": [
        [0, 18, "Under 18kg"],
        [18, 21, "18-21kg"],
        [21, 24, "21-24kg"],
        [24, 27, "24-27kg"],
        [27, 30, "27-30kg"],
        [30, 33, "30-33kg"],
        [33, 36, "33-36kg"],
        [36, 40, "36-40kg"],
        [40, 45, "40-45kg"],
        [45, 999, "Over 45kg"]
      ],
      "F": [
        [0, 16, "Under 16kg"],
        [16, 19, "16-19kg"],
        [19, 22, "19-22kg"],
        [22, 25, "22-25kg"],
        [25, 28, "25-28kg"],
        [28, 31, "28-31kg"],
        [31, 34, "31-34kg"],
        [34, 38, "34-38kg"],
        [38, 42, "38-42kg"],
        [42, 999, "Over 42kg"]
      ]
    },
    "Cadet": {
      "M": [
        [0, 33, "Under 33kg"],
        [33, 37, "33-37kg"],
        [37, 41, "37-41kg"],
        [41, 45, "41-45kg"],
        [45, 49, "45-49kg"],
        [49, 53, "49-53kg"],
        [53, 57, "53-57kg"],
        [57, 61, "57-61kg"],
        [61, 65, "61-65kg"],
        [65, 999, "Over 65kg"]
      ],
      "F": [
        [0, 29, "Under 29kg"],
        [29, 33, "29-33kg"],
        [33, 37, "33-37kg"],
        [37, 41, "37-41kg"],
        [41, 44, "41-44kg"],
        [44, 47, "44-47kg"],
        [47, 51, "47-51kg"],
        [51, 55, "51-55kg"],
        [55, 59, "55-59kg"],
        [59, 999, "Over 59kg"]
      ]
    },
    "Junior": {
      "M": [
        [0, 45, "Under 45kg"],
        [45, 48, "45-48kg"],
        [48, 51, "48-51kg"],
        [51, 55, "51-55kg"],
        [55, 59, "55-59kg"],
        [59, 63, "59-63kg"],
        [63, 68, "63-68kg"],
        [68, 73, "68-73kg"],
        [73, 78, "73-78kg"],
        [78, 999, "Over 78kg"]
      ],
      "F": [
        [0, 42, "Under 42kg"],
        [42, 44, "42-44kg"],
        [44, 46, "44-46kg"],
        [46, 49, "46-49kg"],
        [49, 52, "49-52kg"],
        [52, 55, "52-55kg"],
        [55, 59, "55-59kg"],
        [59, 63, "59-63kg"],
        [63, 68, "63-68kg"],
        [68, 999, "Over 68kg"]
      ]
    },
    "Senior": {
      "M": [
        [0, 54, "Under 54kg"],
        [54, 58, "54-58kg"],
        [58, 63, "58-63kg"],
        [63, 68, "63-68kg"],
        [68, 74, "68-74kg"],
        [74, 80, "74-80kg"],
        [80, 87, "80-87kg"],
        [87, 999, "Over 87kg"]
      ],
      "F": [
        [0, 46, "Under 46kg"],
        [46, 49, "46-49kg"],
        [49, 53, "49-53kg"],
        [53, 57, "53-57kg"],
        [57, 62, "57-62kg"],
        [62, 67, "62-67kg"],
        [67, 73, "67-73kg"],
        [73, 999, "Over 73kg"]
      ]
    }
  },
  height_categories: [
    [0, 119, "Under 119cm"],
    [119, 123, "119-123cm"],
    [123, 127, "123-127cm"],
    [127, 131, "127-131cm"],
    [131, 135, "131-135cm"],
    [135, 139, "135-139cm"],
    [139, 143, "139-143cm"],
    [143, 147, "143-147cm"],
    [147, 151, "147-151cm"],
    [151, 155, "151-155cm"],
    [155, 159, "155-159cm"],
    [159, 999, "Over 159cm"]
  ]
};

export function normalizeGender(val: any): string {
  if (!val) return "M";
  const s = String(val).trim().toUpperCase();
  if (["M", "MALE", "BOY", "B", "M.", "1", "PURUSH", "पु"].includes(s)) return "M";
  if (["F", "FEMALE", "GIRL", "G", "F.", "0", "MAHILA", "म"].includes(s)) return "F";
  return s.includes("F") ? "F" : "M";
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5,
  jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

export function parseDateString(str: any): Date | null {
  if (!str) return null;
  if (str instanceof Date) return isNaN(str.getTime()) ? null : str;

  const s = String(str).trim();
  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[-/.\s](\d{1,2})[-/.\s](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(y, m, day);
    if (!isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m && d.getDate() === day) {
      return d;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD MM YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/.\s](\d{1,2})[-/.\s](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    const y = parseInt(dmyMatch[3], 10);
    const d = new Date(y, m, day);
    if (!isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m && d.getDate() === day) {
      return d;
    }
  }

  // DD Mon YYYY (e.g. "05 Feb 2013")
  const textMatch = s.match(/^(\d{1,2})[\s-]+([a-zA-Z]+)[\s-]+(\d{4})$/);
  if (textMatch) {
    const m = MONTHS[textMatch[2].toLowerCase()];
    if (m !== undefined) {
      const day = parseInt(textMatch[1], 10);
      const y = parseInt(textMatch[3], 10);
      const d = new Date(y, m, day);
      if (!isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m && d.getDate() === day) {
        return d;
      }
    }
  }

  return null;
}

export function formatIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(str: any): string {
  const d = parseDateString(str);
  if (!d) return str ? String(str) : "";
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${m}/${d.getFullYear()}`;
}

export function calculateAge(dob: Date, eventDate: Date = new Date(2026, 9, 24)): number {
  let age = eventDate.getFullYear() - dob.getFullYear();
  const m = eventDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && eventDate.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

function matchHeightBracket(height: number, rules: RulesConfig): string {
  for (const [minH, maxH, label] of rules.height_categories) {
    if ((minH < height && height <= maxH) || (minH === 0 && height <= maxH)) {
      return label;
    }
  }
  if (rules.height_categories.length > 0) {
    const last = rules.height_categories[rules.height_categories.length - 1];
    const first = rules.height_categories[0];
    if (height > last[0]) return `Over ${last[0]}cm`;
    if (height < first[1]) return `Under ${first[1]}cm`;
  }
  return "Open Height";
}

export function categorizeAthleteClient(athlete: AthleteInput, rules: RulesConfig = DEFAULT_RULES): CategorizedAthlete {
  const notes: string[] = [];
  const genderNorm = normalizeGender(athlete.gender);
  const dobObj = parseDateString(athlete.dob);

  let calculatedAge: number | null = null;
  let ageGroup = "Unknown";

  const eventParts = rules.event_date.split("-");
  const eventDate = new Date(parseInt(eventParts[0]), parseInt(eventParts[1]) - 1, parseInt(eventParts[2]));

  if (dobObj) {
    calculatedAge = calculateAge(dobObj, eventDate);
    const birthYear = dobObj.getFullYear();
    for (const [group, rule] of Object.entries(rules.age_rules)) {
      if (birthYear >= rule.start_year && birthYear <= rule.end_year) {
        ageGroup = group;
        break;
      }
    }
  } else if (athlete.age_years !== undefined && athlete.age_years !== null) {
    calculatedAge = Number(athlete.age_years);
    for (const [group, rule] of Object.entries(rules.age_rules)) {
      if (calculatedAge >= rule.approx_age_min && calculatedAge <= rule.approx_age_max) {
        ageGroup = group;
        break;
      }
    }
    notes.push("Age used instead of DOB");
  } else {
    notes.push("Missing DOB and Age");
  }

  const rawWeight = athlete.weight_kg !== undefined && athlete.weight_kg !== null ? Number(athlete.weight_kg) : NaN;
  const hasWeight = !isNaN(rawWeight) && rawWeight > 0;
  const rawHeight = athlete.height_cm !== undefined && athlete.height_cm !== null ? Number(athlete.height_cm) : NaN;
  const hasHeight = !isNaN(rawHeight) && rawHeight > 0;

  let weightClass = "Unassigned";
  let heightCat: string | null = null;
  const genderLabel = genderNorm === "M" ? "Male" : "Female";
  const parts: string[] = [ageGroup, genderLabel];

  if (hasWeight) {
    weightClass = "Open Weight";
    const wClasses = rules.weight_classes[ageGroup]?.[genderNorm] || [];
    for (const [minW, maxW, label] of wClasses) {
      if ((minW < rawWeight && rawWeight <= maxW) || (minW === 0 && rawWeight <= maxW)) {
        weightClass = label;
        break;
      }
    }
    if (hasHeight && ageGroup === "Sub-Jr") {
      heightCat = matchHeightBracket(rawHeight, rules);
    }
    parts.push(weightClass);
    if (heightCat) parts.push(heightCat);
  } else if (hasHeight) {
    // Weight not provided: assign category based on height
    heightCat = matchHeightBracket(rawHeight, rules);
    weightClass = heightCat;
    notes.push("Categorized by height (weight not provided)");
    parts.push(heightCat);
  } else {
    weightClass = "Unassigned";
    notes.push("Missing both weight and height");
    parts.push(weightClass);
  }

  return {
    id: athlete.id,
    sr_no: athlete.sr_no,
    name: (athlete.name || "").trim().toUpperCase(),
    gender: genderNorm,
    dob: dobObj ? formatIsoDateLocal(dobObj) : (athlete.dob ? String(athlete.dob) : null),
    calculated_age: calculatedAge,
    age_group: ageGroup,
    weight_kg: hasWeight ? Math.round(rawWeight * 10) / 10 : null,
    height_cm: hasHeight ? Math.round(rawHeight * 10) / 10 : null,
    weight_class: weightClass,
    height_category: heightCat,
    full_category: parts.join(" | "),
    notes,
    club: athlete.club ? athlete.club.trim() : null,
  };
}
