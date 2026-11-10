"""
FastAPI Backend – Taekwondo Athlete Categorizer
================================================
Production-ready API for District/State level events.
Features:
- Fast Categorization Engine (<0.1s for 2000+ athletes)
- Configurable Rules Engine (Age Groups, Weight Classes, Height Categories)
- Excel & CSV Upload with Smart Column Normalization
- Image Upload with Offline Deep Learning OCR (RapidOCR)
- Multi-Tab Styled Excel Export (.xlsx)
- Multi-Event SQLite Persistence
- Synthetic Realistic Sample Generator (100 to 2000 athletes)
"""

import io
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from rules_engine import (
    AthleteInput, CategorizedAthlete,
    categorize_athlete, categorize_bulk,
    get_active_rules, update_active_rules, reset_rules_to_default,
    SAMPLE_ATHLETES
)
from ocr_engine import run_ocr_pipeline
from excel_engine import parse_excel_or_csv, generate_styled_excel_workbook
from sample_generator import generate_synthetic_athletes
from database import (
    init_db, get_db, get_or_create_default_event,
    get_all_events, create_event,
    save_athletes_to_event, get_athletes_from_event,
    delete_athlete, clear_event_athletes
)

# Initialize database tables on startup
init_db()

app = FastAPI(
    title="Taekwondo Athlete Categorizer API",
    description="Scalable tournament classification system for district/state level championships",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTH & INFO
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Taekwondo Categorizer Engine",
        "version": "2.0.0",
        "features": [
            "Age Group Classification (Sub-Jr / Cadet / Junior / Senior)",
            "Configurable Weight Classes per Age Group + Gender",
            "Height Category Classification for Sub-Jr",
            "Excel & CSV Upload with Smart Header Detection",
            "Entry Form Photo OCR Extraction",
            "Professional Multi-Sheet Excel Export",
            "SQLite Event Persistence",
            "Synthetic Tournament Load Generator (up to 2000 athletes)"
        ]
    }


@app.get("/health")
def health():
    return root()



# ============================================================
# DEMO & SAMPLE GENERATOR
# ============================================================

@app.get("/demo")
def run_demo():
    """Returns the 11 athletes from user's entry form notebook, fully categorized."""
    results = categorize_bulk(SAMPLE_ATHLETES)
    return {
        "event_date": "2026-10-24",
        "total": len(results),
        "athletes": [r.model_dump() for r in results]
    }


class GenerateSampleRequest(BaseModel):
    count: int = 500
    event_year: int = 2026


@app.post("/sample/generate")
def generate_sample(req: GenerateSampleRequest):
    """Generate up to 2000 realistic synthetic athletes for testing scale and throughput."""
    count = max(10, min(req.count, 2000))
    raw_athletes = generate_synthetic_athletes(count=count, event_year=req.event_year)
    results = categorize_bulk(raw_athletes)
    return {
        "total": len(results),
        "event_year": req.event_year,
        "athletes": [r.model_dump() for r in results]
    }


# ============================================================
# CATEGORIZATION ENDPOINTS
# ============================================================

@app.post("/categorize", response_model=CategorizedAthlete)
def categorize_one(athlete: AthleteInput):
    """Categorize a single athlete with real-time feedback."""
    return categorize_athlete(athlete)


@app.post("/categorize/bulk", response_model=List[CategorizedAthlete])
def categorize_many(athletes: List[AthleteInput]):
    """Categorize an array of athletes (tested up to 2000+)."""
    if len(athletes) > 5000:
        raise HTTPException(400, "Maximum 5000 athletes per request")
    return categorize_bulk(athletes)


# ============================================================
# FILE UPLOAD (EXCEL & CSV)
# ============================================================

@app.post("/upload/excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload Excel (.xlsx, .xls) or CSV file with smart column auto-detection."""
    filename = file.filename or "upload.xlsx"
    if not filename.lower().endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(400, "Only Excel (.xlsx, .xls) or CSV (.csv) files are supported")

    content = await file.read()
    try:
        athletes_input, errors = parse_excel_or_csv(content, filename)
    except ValueError as ve:
        raise HTTPException(400, str(ve))
    except Exception as e:
        raise HTTPException(400, f"Error processing file: {str(e)}")

    categorized = categorize_bulk(athletes_input)

    return {
        "filename": filename,
        "total_processed": len(categorized),
        "errors": errors,
        "athletes": [c.model_dump() for c in categorized]
    }


# ============================================================
# IMAGE OCR UPLOAD (ENTRY FORM PHOTO)
# ============================================================

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload entry form image (JPG, PNG, WebP).
    Runs offline RapidOCR deep-learning pipeline to extract athlete records.
    Returns parsed records + confidence scores for review before categorization.
    """
    content_type = file.content_type or ""
    filename = file.filename or "image.png"

    if not any(filename.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"]):
        raise HTTPException(400, "Supported image formats: JPG, JPEG, PNG, WEBP, BMP")

    content = await file.read()
    ocr_result = run_ocr_pipeline(content)

    if not ocr_result.get("success"):
        raise HTTPException(500, ocr_result.get("error", "OCR failed"))

    # Also automatically categorize candidates to provide instant preview
    candidates = ocr_result.get("athletes", [])
    athletes_with_cat = []

    for c in candidates:
        try:
            athlete_obj = AthleteInput(
                sr_no=c.get("sr_no"),
                name=c.get("name", "ATHLETE"),
                dob=c.get("dob"),
                gender=c.get("gender", "M"),
                weight_kg=float(c.get("weight_kg", 30)),
                height_cm=float(c.get("height_cm")) if c.get("height_cm") else None,
                club=c.get("club")
            )
            cat = categorize_athlete(athlete_obj)
            merged = {**c, **cat.model_dump()}
            athletes_with_cat.append(merged)
        except Exception:
            athletes_with_cat.append(c)

    return {
        "filename": filename,
        "total_detected": len(athletes_with_cat),
        "athletes": athletes_with_cat,
        "raw_text": ocr_result.get("raw_text", ""),
        "processing_time_sec": ocr_result.get("processing_time_sec", 0.5)
    }


# ============================================================
# EXPORT EXCEL
# ============================================================

class ExportExcelRequest(BaseModel):
    event_title: Optional[str] = "Taekwondo Championship 2026"
    athletes: List[CategorizedAthlete]


@app.post("/export/excel")
def export_excel(req: ExportExcelRequest):
    """Generate professional, multi-tab styled tournament workbook (.xlsx)."""
    if not req.athletes:
        raise HTTPException(400, "No athletes provided to export")

    workbook_stream = generate_styled_excel_workbook(req.athletes, req.event_title or "Taekwondo Championship 2026")

    headers = {
        "Content-Disposition": f"attachment; filename=Taekwondo_Categorized_{len(req.athletes)}_Athletes.xlsx"
    }
    return StreamingResponse(
        workbook_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )


# ============================================================
# RULES CONFIGURATION
# ============================================================

@app.get("/rules")
def get_rules():
    """Retrieve active age brackets, weight classes, and height categories."""
    return get_active_rules()


@app.post("/rules")
@app.put("/rules")
def set_rules(new_rules: Dict[str, Any]):
    """Update active tournament categorization rules."""
    updated = update_active_rules(new_rules)
    return {"message": "Rules updated successfully", "rules": updated}


@app.post("/rules/reset")
def reset_rules():
    """Reset rules to default 2026 federation specifications."""
    default_rules = reset_rules_to_default()
    return {"message": "Rules reset to default", "rules": default_rules}


# ============================================================
# DATABASE & MULTI-EVENT PERSISTENCE
# ============================================================

@app.get("/events")
def list_events(db: Session = Depends(get_db)):
    """List all saved tournament events."""
    events = get_all_events(db)
    if not events:
        default_ev = get_or_create_default_event(db)
        events = get_all_events(db)
    return events


class CreateEventRequest(BaseModel):
    name: str
    event_date: str = "2026-10-24"
    location: Optional[str] = "State Sports Complex"


@app.post("/events")
def add_event(req: CreateEventRequest, db: Session = Depends(get_db)):
    """Create a new tournament event."""
    return create_event(db, name=req.name, event_date=req.event_date, location=req.location or "")


@app.get("/events/{event_id}/athletes")
def get_event_athletes(event_id: int, db: Session = Depends(get_db)):
    """Retrieve all saved athletes for an event."""
    athletes = get_athletes_from_event(db, event_id)
    return {
        "event_id": event_id,
        "total": len(athletes),
        "athletes": athletes
    }


class SaveAthletesRequest(BaseModel):
    athletes: List[Dict[str, Any]]
    replace: bool = False


@app.post("/events/{event_id}/athletes")
def save_event_athletes(event_id: int, req: SaveAthletesRequest, db: Session = Depends(get_db)):
    """Persist categorized athletes into SQLite database for an event."""
    saved_count = save_athletes_to_event(db, event_id, req.athletes, replace=req.replace)
    return {
        "message": f"Successfully saved {saved_count} athletes",
        "saved_count": saved_count
    }


@app.delete("/events/{event_id}/athletes")
def clear_athletes(event_id: int, db: Session = Depends(get_db)):
    """Clear all athletes in a specific event."""
    deleted_count = clear_event_athletes(db, event_id)
    return {"message": f"Deleted {deleted_count} athletes"}


@app.delete("/athletes/{athlete_id}")
def remove_athlete(athlete_id: int, db: Session = Depends(get_db)):
    """Delete a single athlete by ID."""
    success = delete_athlete(db, athlete_id)
    if not success:
        raise HTTPException(404, "Athlete not found")
    return {"message": "Athlete deleted successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
