"""
Excel & CSV Engine for Taekwondo Categorizer
============================================
1. Smart Column Detection & Normalization (handles Indian formats, Hindi unicode).
2. Professional Multi-Sheet Styled Excel Export (.xlsx) using openpyxl.
"""

import io
import re
from typing import List, Dict, Any, Tuple
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from rules_engine import AthleteInput, CategorizedAthlete, normalize_gender, parse_dob_string


COLUMN_ALIASES = {
    "name": [
        "name", "full_name", "athlete", "athlete_name", "player_name", "student_name",
        "player", "khiladi", "naam", "नाम", "खिलाड़ी का नाम", "विद्यार्थी का नाम"
    ],
    "dob": [
        "dob", "date_of_birth", "birth_date", "birthdate", "d_o_b", "date_birth",
        "जन्म_तिथि", "जन्म तारीख", "जन्म तिथि"
    ],
    "age": [
        "age", "age_years", "years", "approx_age", "उम्र", "आयु"
    ],
    "gender": [
        "gender", "sex", "m_f", "gender_m_f", "ling", "लिंग"
    ],
    "weight": [
        "weight", "weight_kg", "wt", "wt_kg", "weight(kg)", "weight_in_kg", "w_kg",
        "वजन", "भार"
    ],
    "height": [
        "height", "height_cm", "ht", "ht_cm", "height(cm)", "height_in_cm", "h_cm",
        "कद", "लंबाई"
    ],
    "club": [
        "club", "academy", "team", "school", "dojang", "district", "state", "institution",
        "संस्था", "क्लब", "एकेडमी"
    ]
}


def find_column_key(col_name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9\u0900-\u097F]", "_", col_name.strip().lower()).strip("_")
    for standard_key, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            alias_cleaned = re.sub(r"[^a-zA-Z0-9\u0900-\u097F]", "_", alias.strip().lower()).strip("_")
            if cleaned == alias_cleaned or alias_cleaned in cleaned:
                return standard_key
    return cleaned


def parse_excel_or_csv(file_bytes: bytes, filename: str) -> Tuple[List[AthleteInput], List[str]]:
    """Parse uploaded Excel or CSV into validated AthleteInput objects."""
    errors: List[str] = []
    athletes: List[AthleteInput] = []

    try:
        if filename.lower().endswith(".csv"):
            # Try utf-8 first, fallback to latin1
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin1")
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Could not read spreadsheet file: {str(e)}")

    if df.empty:
        raise ValueError("The uploaded spreadsheet is empty.")

    # Map column names
    col_mapping = {}
    for col in df.columns:
        matched_key = find_column_key(str(col))
        col_mapping[col] = matched_key

    df = df.rename(columns=col_mapping)

    # Check required columns
    cols_present = set(df.columns)
    if "name" not in cols_present:
        raise ValueError(f"Missing required 'Name' column. Found columns: {list(df.columns)}")
    if "weight" not in cols_present:
        raise ValueError(f"Missing required 'Weight' column. Found columns: {list(df.columns)}")

    for idx, row in df.iterrows():
        row_num = idx + 2  # Excel 1-indexed + header
        try:
            name_val = str(row.get("name", "")).strip()
            if not name_val or name_val.lower() == "nan":
                continue  # skip blank rows

            # Weight
            raw_w = row.get("weight")
            if pd.isna(raw_w) or str(raw_w).strip() == "":
                errors.append(f"Row {row_num} ({name_val}): Missing weight value")
                continue
            try:
                # Clean strings like "32.5 kg"
                clean_w_str = re.sub(r"[^\d.]", "", str(raw_w))
                weight_val = float(clean_w_str)
                if weight_val <= 0 or weight_val > 250:
                    errors.append(f"Row {row_num} ({name_val}): Weight {weight_val}kg is out of realistic range")
                    continue
            except ValueError:
                errors.append(f"Row {row_num} ({name_val}): Invalid weight '{raw_w}'")
                continue

            # Height (optional)
            height_val = None
            if "height" in df.columns and pd.notna(row.get("height")):
                try:
                    clean_h_str = re.sub(r"[^\d.]", "", str(row.get("height")))
                    if clean_h_str:
                        h = float(clean_h_str)
                        if 30 <= h <= 250:
                            height_val = h
                except ValueError:
                    pass

            # Gender
            raw_g = row.get("gender") if "gender" in df.columns else "M"
            gender_norm = normalize_gender(raw_g)

            # DOB & Age
            dob_val = None
            if "dob" in df.columns and pd.notna(row.get("dob")):
                dob_val = row.get("dob")

            age_years = None
            if "age" in df.columns and pd.notna(row.get("age")):
                try:
                    clean_age_str = re.sub(r"[^\d]", "", str(row.get("age")))
                    if clean_age_str:
                        age_years = int(clean_age_str)
                except ValueError:
                    pass

            # Club
            club_val = str(row.get("club")).strip() if "club" in df.columns and pd.notna(row.get("club")) else None
            if club_val and club_val.lower() in ["nan", "none"]:
                club_val = None

            athletes.append(AthleteInput(
                sr_no=len(athletes) + 1,
                name=name_val,
                dob=dob_val,
                age_years=age_years,
                gender=gender_norm,
                weight_kg=weight_val,
                height_cm=height_val,
                club=club_val
            ))

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    return athletes, errors


def generate_styled_excel_workbook(athletes: List[CategorizedAthlete], event_title: str = "Taekwondo Championship 2026") -> io.BytesIO:
    """Generate professional, multi-tab tournament workbook."""
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styles
    navy_header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    gold_header_fill = PatternFill(start_color="D97706", end_color="D97706", fill_type="solid")
    zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

    font_title = Font(name="Calibri", size=15, bold=True, color="1E3A8A")
    font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=10, bold=True)
    font_regular = Font(name="Calibri", size=10)

    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    headers = [
        "Sr No", "Athlete Name", "Gender", "DOB", "Age", "Age Group",
        "Weight (kg)", "Weight Class", "Height (cm)", "Height Category",
        "Full Category", "Club / Academy", "Notes"
    ]

    def create_sheet(sheet_title: str, athlete_list: List[CategorizedAthlete]):
        ws = wb.create_sheet(title=sheet_title)
        ws.views.sheetView[0].showGridLines = True

        # Event Banner
        ws.merge_cells("A1:M1")
        cell_a1 = ws["A1"]
        cell_a1.value = f"{event_title} — {sheet_title.upper()}"
        cell_a1.font = font_title
        cell_a1.alignment = Alignment(vertical="center")
        ws.row_dimensions[1].height = 28

        # Header Row
        ws.row_dimensions[3].height = 24
        for col_idx, header in enumerate(headers, 1):
            cell = ws.cell(row=3, column=col_idx, value=header)
            cell.font = font_header
            cell.fill = navy_header_fill if sheet_title == "Master Roster" else gold_header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

        # Data Rows
        current_row = 4
        for idx, a in enumerate(athlete_list, 1):
            ws.row_dimensions[current_row].height = 20
            row_data = [
                idx,
                a.name,
                "Male" if a.gender == "M" else "Female",
                a.dob or "–",
                a.calculated_age if a.calculated_age is not None else "–",
                a.age_group,
                f"{a.weight_kg:.1f}",
                a.weight_class,
                f"{a.height_cm:.1f}" if a.height_cm else "–",
                a.height_category or "–",
                a.full_category,
                a.club or "–",
                ", ".join(a.notes) if a.notes else ""
            ]

            is_zebra = (idx % 2 == 0)
            for col_idx, val in enumerate(row_data, 1):
                cell = ws.cell(row=current_row, column=col_idx, value=val)
                cell.font = font_regular
                cell.border = thin_border
                if is_zebra:
                    cell.fill = zebra_fill

                # Alignments
                if col_idx in [1, 3, 4, 5, 6, 7, 9]:
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                else:
                    cell.alignment = Alignment(horizontal="left", vertical="center")

            current_row += 1

        # Adjust column widths
        for col in ws.columns:
            col_letter = get_column_letter(col[0].column)
            max_len = 0
            for cell in col:
                if cell.row > 2 and cell.value:
                    max_len = max(max_len, len(str(cell.value)))
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # 1. Master List
    create_sheet("Master Roster", athletes)

    # 2. Sub-Junior
    sub_jr_athletes = [a for a in athletes if a.age_group == "Sub-Jr"]
    create_sheet("Sub-Junior", sub_jr_athletes)

    # 3. Cadet
    cadet_athletes = [a for a in athletes if a.age_group == "Cadet"]
    create_sheet("Cadet", cadet_athletes)

    # 4. Junior
    jr_athletes = [a for a in athletes if a.age_group == "Junior"]
    create_sheet("Junior", jr_athletes)

    # 5. Senior
    sr_athletes = [a for a in athletes if a.age_group == "Senior"]
    create_sheet("Senior", sr_athletes)

    # 6. Summary Sheet
    ws_summary = wb.create_sheet(title="Category Counts")
    ws_summary.views.sheetView[0].showGridLines = True
    ws_summary["A1"] = f"{event_title} — Category Breakdown"
    ws_summary["A1"].font = font_title
    ws_summary.row_dimensions[1].height = 28

    sum_headers = ["Age Group", "Gender", "Weight Class", "Athlete Count"]
    for c_idx, h in enumerate(sum_headers, 1):
        c = ws_summary.cell(row=3, column=c_idx, value=h)
        c.font = font_header
        c.fill = navy_header_fill
        c.alignment = Alignment(horizontal="center", vertical="center")

    cat_counts: Dict[Tuple[str, str, str], int] = {}
    for a in athletes:
        key = (a.age_group, "Male" if a.gender == "M" else "Female", a.weight_class)
        cat_counts[key] = cat_counts.get(key, 0) + 1

    r_idx = 4
    for (ag, gen, wc), cnt in sorted(cat_counts.items()):
        ws_summary.cell(row=r_idx, column=1, value=ag).border = thin_border
        ws_summary.cell(row=r_idx, column=2, value=gen).border = thin_border
        ws_summary.cell(row=r_idx, column=3, value=wc).border = thin_border
        cnt_cell = ws_summary.cell(row=r_idx, column=4, value=cnt)
        cnt_cell.border = thin_border
        cnt_cell.alignment = Alignment(horizontal="center")
        cnt_cell.font = font_bold
        r_idx += 1

    for col in ws_summary.columns:
        col_letter = get_column_letter(col[0].column)
        ws_summary.column_dimensions[col_letter].width = 20

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output
