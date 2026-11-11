"""
Taekwondo Categorization Rules Engine
=====================================
Accurate Age Group + Weight Class + Height Category classification.
Fully configurable rules per Age Group + Gender.
High-performance bulk processing (handles 2000+ athletes in milliseconds).
Supports Indian name formats, Hindi unicode, flexible DOB parsing.
"""

from datetime import date, datetime
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field, field_validator
from enum import Enum
import re
import copy


class Gender(str, Enum):
    MALE = "M"
    FEMALE = "F"


class AgeGroup(str, Enum):
    SUB_JR = "Sub-Jr"
    CADET = "Cadet"
    JUNIOR = "Junior"
    SENIOR = "Senior"
    UNKNOWN = "Unknown"


class AthleteInput(BaseModel):
    sr_no: Optional[int] = None
    name: str
    dob: Optional[Any] = None                 # Can be date, str ("DD/MM/YYYY" or "YYYY-MM-DD"), or None
    age_years: Optional[int] = None           # Fallback if DOB missing
    gender: Any                               # "M", "F", "Male", "Female", etc.
    weight_kg: Optional[float] = Field(None, gt=0, le=250)
    height_cm: Optional[float] = Field(None, gt=30, le=260)
    club: Optional[str] = None

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return v.strip().upper() if isinstance(v, str) else str(v)


class CategorizedAthlete(BaseModel):
    id: Optional[int] = None
    sr_no: Optional[int] = None
    name: str
    gender: str
    dob: Optional[str] = None
    calculated_age: Optional[int] = None
    age_group: str
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    weight_class: str
    height_category: Optional[str] = None
    full_category: str                        # e.g. "Sub-Jr Female 27-30kg | 127-131cm"
    notes: List[str] = []
    club: Optional[str] = None


# ============================================================
# DEFAULT 2026 EVENT RULES (Primary)
# ============================================================

DEFAULT_AGE_RULES_2026: Dict[str, Dict[str, Any]] = {
    "Sub-Jr": {
        "start_year": 2015,
        "end_year": 2019,
        "approx_age_min": 8,
        "approx_age_max": 11,
        "description": "Born 2015–2019 (approx 8–11 years)"
    },
    "Cadet": {
        "start_year": 2012,
        "end_year": 2014,
        "approx_age_min": 12,
        "approx_age_max": 14,
        "description": "Born 2012–2014 (approx 12–14 years)"
    },
    "Junior": {
        "start_year": 2009,
        "end_year": 2011,
        "approx_age_min": 15,
        "approx_age_max": 17,
        "description": "Born 2009–2011 (approx 15–17 years)"
    },
    "Senior": {
        "start_year": 1960,
        "end_year": 2008,
        "approx_age_min": 18,
        "approx_age_max": 99,
        "description": "Born 2008 or earlier (18+ years)"
    },
}

# Weight classes per Age Group and Gender
DEFAULT_WEIGHT_CLASSES: Dict[str, Dict[str, List[Tuple[float, float, str]]]] = {
    "Sub-Jr": {
        "M": [
            (0.0, 18.0, "Under 18kg"),
            (18.0, 21.0, "18-21kg"),
            (21.0, 24.0, "21-24kg"),
            (24.0, 27.0, "24-27kg"),
            (27.0, 30.0, "27-30kg"),
            (30.0, 33.0, "30-33kg"),
            (33.0, 36.0, "33-36kg"),
            (36.0, 40.0, "36-40kg"),
            (40.0, 45.0, "40-45kg"),
            (45.0, 999.0, "Over 45kg"),
        ],
        "F": [
            (0.0, 16.0, "Under 16kg"),
            (16.0, 19.0, "16-19kg"),
            (19.0, 22.0, "19-22kg"),
            (22.0, 25.0, "22-25kg"),
            (25.0, 28.0, "25-28kg"),
            (28.0, 31.0, "28-31kg"),
            (31.0, 34.0, "31-34kg"),
            (34.0, 38.0, "34-38kg"),
            (38.0, 42.0, "38-42kg"),
            (42.0, 999.0, "Over 42kg"),
        ],
    },
    "Cadet": {
        "M": [
            (0.0, 33.0, "Under 33kg"),
            (33.0, 37.0, "33-37kg"),
            (37.0, 41.0, "37-41kg"),
            (41.0, 45.0, "41-45kg"),
            (45.0, 49.0, "45-49kg"),
            (49.0, 53.0, "49-53kg"),
            (53.0, 57.0, "53-57kg"),
            (57.0, 61.0, "57-61kg"),
            (61.0, 65.0, "61-65kg"),
            (65.0, 999.0, "Over 65kg"),
        ],
        "F": [
            (0.0, 29.0, "Under 29kg"),
            (29.0, 33.0, "29-33kg"),
            (33.0, 37.0, "33-37kg"),
            (37.0, 41.0, "37-41kg"),
            (41.0, 44.0, "41-44kg"),
            (44.0, 47.0, "44-47kg"),
            (47.0, 51.0, "47-51kg"),
            (51.0, 55.0, "51-55kg"),
            (55.0, 59.0, "55-59kg"),
            (59.0, 999.0, "Over 59kg"),
        ],
    },
    "Junior": {
        "M": [
            (0.0, 45.0, "Under 45kg"),
            (45.0, 48.0, "45-48kg"),
            (48.0, 51.0, "48-51kg"),
            (51.0, 55.0, "51-55kg"),
            (55.0, 59.0, "55-59kg"),
            (59.0, 63.0, "59-63kg"),
            (63.0, 68.0, "63-68kg"),
            (68.0, 73.0, "68-73kg"),
            (73.0, 78.0, "73-78kg"),
            (78.0, 999.0, "Over 78kg"),
        ],
        "F": [
            (0.0, 42.0, "Under 42kg"),
            (42.0, 44.0, "42-44kg"),
            (44.0, 46.0, "44-46kg"),
            (46.0, 49.0, "46-49kg"),
            (49.0, 52.0, "49-52kg"),
            (52.0, 55.0, "52-55kg"),
            (55.0, 59.0, "55-59kg"),
            (59.0, 63.0, "59-63kg"),
            (63.0, 68.0, "63-68kg"),
            (68.0, 999.0, "Over 68kg"),
        ],
    },
    "Senior": {
        "M": [
            (0.0, 54.0, "Under 54kg"),
            (54.0, 58.0, "54-58kg"),
            (58.0, 63.0, "58-63kg"),
            (63.0, 68.0, "63-68kg"),
            (68.0, 74.0, "68-74kg"),
            (74.0, 80.0, "74-80kg"),
            (80.0, 87.0, "80-87kg"),
            (87.0, 999.0, "Over 87kg"),
        ],
        "F": [
            (0.0, 46.0, "Under 46kg"),
            (46.0, 49.0, "46-49kg"),
            (49.0, 53.0, "49-53kg"),
            (53.0, 57.0, "53-57kg"),
            (57.0, 62.0, "57-62kg"),
            (62.0, 67.0, "62-67kg"),
            (67.0, 73.0, "67-73kg"),
            (73.0, 999.0, "Over 73kg"),
        ],
    },
}

# Height categories for Sub-Jr
DEFAULT_HEIGHT_CATEGORIES_SUB_JR: List[Tuple[float, float, str]] = [
    (0.0, 119.0, "Under 119cm"),
    (119.0, 123.0, "119-123cm"),
    (123.0, 127.0, "123-127cm"),
    (127.0, 131.0, "127-131cm"),
    (131.0, 135.0, "131-135cm"),
    (135.0, 139.0, "135-139cm"),
    (139.0, 143.0, "139-143cm"),
    (143.0, 147.0, "143-147cm"),
    (147.0, 151.0, "147-151cm"),
    (151.0, 155.0, "151-155cm"),
    (155.0, 159.0, "155-159cm"),
    (159.0, 999.0, "Over 159cm"),
]


# Active dynamic configuration instance in memory
CURRENT_CONFIG = {
    "event_year": 2026,
    "event_date": "2026-10-24",
    "age_rules": copy.deepcopy(DEFAULT_AGE_RULES_2026),
    "weight_classes": copy.deepcopy(DEFAULT_WEIGHT_CLASSES),
    "height_categories": copy.deepcopy(DEFAULT_HEIGHT_CATEGORIES_SUB_JR),
}


def get_active_rules() -> Dict[str, Any]:
    return CURRENT_CONFIG


def update_active_rules(new_config: Dict[str, Any]) -> Dict[str, Any]:
    global CURRENT_CONFIG
    if "event_year" in new_config:
        CURRENT_CONFIG["event_year"] = int(new_config["event_year"])
    if "event_date" in new_config:
        CURRENT_CONFIG["event_date"] = str(new_config["event_date"])
    if "age_rules" in new_config:
        CURRENT_CONFIG["age_rules"] = new_config["age_rules"]
    if "weight_classes" in new_config:
        CURRENT_CONFIG["weight_classes"] = new_config["weight_classes"]
    if "height_categories" in new_config:
        CURRENT_CONFIG["height_categories"] = [
            (float(c[0]), float(c[1]), str(c[2])) for c in new_config["height_categories"]
        ]
    return CURRENT_CONFIG


def reset_rules_to_default() -> Dict[str, Any]:
    global CURRENT_CONFIG
    CURRENT_CONFIG = {
        "event_year": 2026,
        "event_date": "2026-10-24",
        "age_rules": copy.deepcopy(DEFAULT_AGE_RULES_2026),
        "weight_classes": copy.deepcopy(DEFAULT_WEIGHT_CLASSES),
        "height_categories": copy.deepcopy(DEFAULT_HEIGHT_CATEGORIES_SUB_JR),
    }
    return CURRENT_CONFIG


# ============================================================
# PARSING & NORMALIZATION UTILITIES
# ============================================================

def normalize_gender(val: Any) -> str:
    """Normalize various representations of gender."""
    if not val:
        return "M"
    s = str(val).strip().upper()
    if s in ["M", "MALE", "BOY", "B", "M.", "1", "PURUSH", "MALE / BOY", "पु"]:
        return "M"
    if s in ["F", "FEMALE", "GIRL", "G", "F.", "0", "MAHILA", "FEMALE / GIRL", "म"]:
        return "F"
    if "M" in s and "F" not in s:
        return "M"
    if "F" in s:
        return "F"
    return "M"


MONTHS_MAP = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6,
    "jul": 7, "july": 7, "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
}


def parse_dob_string(dob_raw: Any) -> Optional[date]:
    """Parse DOB from date/datetime object or flexible string formats."""
    if dob_raw is None or (isinstance(dob_raw, float) and str(dob_raw) == "nan"):
        return None
    if isinstance(dob_raw, datetime):
        return dob_raw.date()
    if isinstance(dob_raw, date):
        return dob_raw

    s = str(dob_raw).strip()
    if not s or s.lower() in ["none", "nan", "null", "–", "-"]:
        return None

    # Handle standard ISO format YYYY-MM-DD (including timestamps)
    iso_match = re.match(r"^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$", s)
    if iso_match:
        try:
            y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
            return date(y, m, d)
        except ValueError:
            pass

    # Handle Indian / European format DD/MM/YYYY, DD-MM-YYYY, or DD MM YYYY
    dmy_match = re.match(r"^(\d{1,2})[-/.\s]+(\d{1,2})[-/.\s]+(\d{4})$", s)
    if dmy_match:
        try:
            d, m, y = int(dmy_match.group(1)), int(dmy_match.group(2)), int(dmy_match.group(3))
            return date(y, m, d)
        except ValueError:
            pass

    # Handle text month format DD Mon YYYY (e.g. "05 Feb 2013")
    text_match = re.match(r"^(\d{1,2})[-/.\s]+([A-Za-z]+)[-/.\s]+(\d{4})$", s)
    if text_match:
        m = MONTHS_MAP.get(text_match.group(2).lower())
        if m:
            try:
                d, y = int(text_match.group(1)), int(text_match.group(3))
                return date(y, m, d)
            except ValueError:
                pass

    # Handle compact 8-digit DDMMYYYY (e.g. "13112004")
    compact_match = re.match(r"^(\d{2})(\d{2})(\d{4})$", s)
    if compact_match:
        try:
            d, m, y = int(compact_match.group(1)), int(compact_match.group(2)), int(compact_match.group(3))
            if 1920 <= y <= 2100:
                return date(y, m, d)
        except ValueError:
            pass

    # Try 2-digit year DD/MM/YY or DD MM YY
    dmy2_match = re.match(r"^(\d{1,2})[-/.\s]+(\d{1,2})[-/.\s]+(\d{2})$", s)
    if dmy2_match:
        try:
            d, m, yy = int(dmy2_match.group(1)), int(dmy2_match.group(2)), int(dmy2_match.group(3))
            y = 2000 + yy if yy < 50 else 1900 + yy
            return date(y, m, d)
        except ValueError:
            pass

    return None


def calculate_age_from_dob(dob: date, event_date_str: str = "2026-10-24") -> int:
    try:
        parts = [int(p) for p in event_date_str.split("-")]
        event_date = date(parts[0], parts[1], parts[2])
    except Exception:
        event_date = date(2026, 10, 24)

    age = event_date.year - dob.year
    if (event_date.month, event_date.day) < (dob.month, dob.day):
        age -= 1
    return max(0, age)


# ============================================================
# CATEGORIZATION ENGINE
# ============================================================

def get_age_group(dob: Optional[date] = None, age_years: Optional[int] = None, config: Optional[Dict[str, Any]] = None) -> AgeGroup:
    cfg = config or CURRENT_CONFIG
    age_rules = cfg.get("age_rules", DEFAULT_AGE_RULES_2026)

    if dob:
        birth_year = dob.year
        for group, rule in age_rules.items():
            start_y = rule.get("start_year")
            end_y = rule.get("end_year")
            if start_y is not None and end_y is not None:
                if start_y <= birth_year <= end_y:
                    return AgeGroup(group)
    elif age_years is not None:
        for group, rule in age_rules.items():
            min_a = rule.get("approx_age_min", 0)
            max_a = rule.get("approx_age_max", 99)
            if min_a <= age_years <= max_a:
                return AgeGroup(group)

    return AgeGroup.UNKNOWN


def _match_bracket(val: float, brackets: List[Tuple[float, float, str]], unit: str) -> Optional[str]:
    """Match a measurement against configured (min, max, label) brackets consistently."""
    if not brackets:
        return None
    ordered = sorted(brackets, key=lambda b: (float(b[0]), float(b[1])))
    for min_v, max_v, label in ordered:
        min_f, max_f = float(min_v), float(max_v)
        if (min_f < val <= max_f) or (min_f == 0 and val <= max_f):
            return label

    first_min, first_max, first_label = float(ordered[0][0]), float(ordered[0][1]), ordered[0][2]
    last_min, last_max, last_label = float(ordered[-1][0]), float(ordered[-1][1]), ordered[-1][2]
    if val <= first_min:
        return first_label if first_min == 0 else f"Under {first_min:g}{unit}"
    if val > last_max:
        return last_label if last_max >= 900 else f"Over {last_max:g}{unit}"
    if val < first_max:
        return first_label
    return last_label


def get_weight_class(age_group: str, gender: str, weight: float, config: Optional[Dict[str, Any]] = None) -> str:
    cfg = config or CURRENT_CONFIG
    w_classes = cfg.get("weight_classes", DEFAULT_WEIGHT_CLASSES).get(age_group, {}).get(gender, [])
    return _match_bracket(weight, w_classes, "kg") or "Open Weight"


def get_height_category(
    height_cm: Optional[float],
    age_group: str,
    config: Optional[Dict[str, Any]] = None,
    force_fallback: bool = False
) -> Optional[str]:
    if height_cm is None or (age_group != "Sub-Jr" and not force_fallback):
        return None

    cfg = config or CURRENT_CONFIG
    height_cats = cfg.get("height_categories", DEFAULT_HEIGHT_CATEGORIES_SUB_JR)
    return _match_bracket(height_cm, height_cats, "cm")


def categorize_athlete(
    athlete: AthleteInput,
    config: Optional[Dict[str, Any]] = None
) -> CategorizedAthlete:
    cfg = config or CURRENT_CONFIG
    event_date_str = cfg.get("event_date", "2026-10-24")

    notes = []
    gender_norm = normalize_gender(athlete.gender)
    raw_dob_str = str(athlete.dob).strip() if athlete.dob is not None else ""
    dob_obj = parse_dob_string(athlete.dob) if raw_dob_str else None

    calculated_age = None
    if dob_obj:
        calculated_age = calculate_age_from_dob(dob_obj, event_date_str)
        age_group = get_age_group(dob=dob_obj, config=cfg)
    elif athlete.age_years is not None:
        calculated_age = int(athlete.age_years)
        age_group = get_age_group(age_years=athlete.age_years, config=cfg)
        notes.append("Age used instead of DOB")
    elif raw_dob_str and raw_dob_str.lower() not in ["none", "nan", "null", "–", "-"]:
        age_group = AgeGroup.UNKNOWN
        notes.append("Invalid DOB format")
    else:
        age_group = AgeGroup.UNKNOWN
        notes.append("Missing DOB and Age")

    has_weight = athlete.weight_kg is not None and athlete.weight_kg > 0
    has_height = athlete.height_cm is not None and athlete.height_cm > 0
    weight_rounded = round(float(athlete.weight_kg), 1) if has_weight else None
    height_rounded = round(float(athlete.height_cm), 1) if has_height else None
    gender_label = "Male" if gender_norm == "M" else "Female"

    if has_weight and weight_rounded is not None:
        weight_class = get_weight_class(age_group.value, gender_norm, weight_rounded, config=cfg)
        height_cat = get_height_category(height_rounded, age_group.value, config=cfg)
        full_cat_parts = [age_group.value, gender_label, weight_class]
        if height_cat:
            full_cat_parts.append(height_cat)
    elif has_height and height_rounded is not None:
        height_cat = get_height_category(height_rounded, age_group.value, config=cfg, force_fallback=True)
        weight_class = height_cat or "By Height"
        notes.append("Categorized by height (weight not provided)")
        full_cat_parts = [age_group.value, gender_label, weight_class]
    else:
        height_cat = None
        weight_class = "Unassigned"
        notes.append("Missing both weight and height")
        full_cat_parts = [age_group.value, gender_label, weight_class]

    return CategorizedAthlete(
        sr_no=athlete.sr_no,
        name=athlete.name,
        gender=gender_norm,
        dob=dob_obj.isoformat() if dob_obj else (raw_dob_str if raw_dob_str else None),
        calculated_age=calculated_age,
        age_group=age_group.value,
        weight_kg=weight_rounded,
        height_cm=height_rounded,
        weight_class=weight_class,
        height_category=height_cat,
        full_category=" | ".join(full_cat_parts),
        notes=notes,
        club=athlete.club.strip() if athlete.club else None,
    )


def categorize_bulk(
    athletes: List[AthleteInput],
    config: Optional[Dict[str, Any]] = None
) -> List[CategorizedAthlete]:
    """Process up to 2000+ athletes with high throughput (< 0.1s)."""
    cfg = config or CURRENT_CONFIG
    return [categorize_athlete(a, cfg) for a in athletes]


# ============================================================
# SAMPLE ATHLETES (11 Athletes from user's entry form notebook)
# ============================================================

SAMPLE_ATHLETES = [
    AthleteInput(sr_no=1, name="ASHMITA", dob="26/11/2017", gender="F", weight_kg=27.1, height_cm=129.0, club="GHSS"),
    AthleteInput(sr_no=2, name="VIBHOR", dob="11/10/2019", gender="M", weight_kg=23.7, height_cm=131.5, club="GHSS"),
    AthleteInput(sr_no=3, name="MYSHA", dob="01/09/2016", gender="F", weight_kg=31.2, height_cm=139.5, club="GHSS"),
    AthleteInput(sr_no=4, name="AYUSHI", dob="14/02/2016", gender="F", weight_kg=30.2, height_cm=142.5, club="GHSS"),
    AthleteInput(sr_no=5, name="MOKSHIK", dob="19/01/2014", gender="M", weight_kg=60.3, height_cm=174.5, club="GHSS"),
    AthleteInput(sr_no=6, name="GAURI", dob="04/04/2017", gender="F", weight_kg=22.8, height_cm=124.0, club="GHSS"),
    AthleteInput(sr_no=7, name="ISHANT", age_years=9, gender="M", weight_kg=31.9, height_cm=134.0, club="GHSS"),
    AthleteInput(sr_no=8, name="DITYA", dob="26/09/2017", gender="F", weight_kg=34.3, height_cm=133.0, club="GHSS"),
    AthleteInput(sr_no=9, name="PRATHAM", dob="13/09/2014", gender="M", weight_kg=46.5, height_cm=145.0, club="GHSS"),
    AthleteInput(sr_no=10, name="SIYA", age_years=10, gender="F", weight_kg=24.4, height_cm=148.0, club="GHSS"),
    AthleteInput(sr_no=11, name="KAVYA", age_years=11, gender="F", weight_kg=37.0, height_cm=147.0, club="GHSS"),
]