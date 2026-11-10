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

export function parseDateString(str: any): Date | null {
  if (!str) return null;
  if (str instanceof Date) return isNaN(str.getTime()) ? null : str;

  const s = String(str).trim();
  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export function calculateAge(dob: Date, eventDate: Date = new Date(2026, 9, 24)): number {
  let age = eventDate.getFullYear() - dob.getFullYear();
  const m = eventDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && eventDate.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
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

  // Weight class
  const weight = Number(athlete.weight_kg) || 0;
  let weightClass = "Open Weight";
  const wClasses = rules.weight_classes[ageGroup]?.[genderNorm] || [];
  for (const [minW, maxW, label] of wClasses) {
    if ((minW < weight && weight <= maxW) || (minW === 0 && weight <= maxW)) {
      weightClass = label;
      break;
    }
  }

  // Height category (Sub-Jr only)
  let heightCat: string | null = null;
  const height = athlete.height_cm ? Number(athlete.height_cm) : null;
  if (height && ageGroup === "Sub-Jr") {
    for (const [minH, maxH, label] of rules.height_categories) {
      if ((minH < height && height <= maxH) || (minH === 0 && height <= maxH)) {
        heightCat = label;
        break;
      }
    }
  }

  const genderLabel = genderNorm === "M" ? "Male" : "Female";
  const parts = [ageGroup, genderLabel, weightClass];
  if (heightCat) parts.push(heightCat);

  return {
    sr_no: athlete.sr_no,
    name: (athlete.name || "").trim().toUpperCase(),
    gender: genderNorm,
    dob: dobObj ? dobObj.toISOString().split("T")[0] : (athlete.dob ? String(athlete.dob) : null),
    calculated_age: calculatedAge,
    age_group: ageGroup,
    weight_kg: Math.round(weight * 10) / 10,
    height_cm: height ? Math.round(height * 10) / 10 : null,
    weight_class: weightClass,
    height_category: heightCat,
    full_category: parts.join(" | "),
    notes,
    club: athlete.club ? athlete.club.trim() : null,
  };
}
