"""
SQLite Database Layer for Taekwondo Athlete Categorizer
Supports multi-event persistence for district/state tournaments.
"""

import json
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Date, DateTime, ForeignKey, text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
import os

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("VERCEL"):
        DATABASE_URL = "sqlite:////tmp/taekwondo.db"
    else:
        DATABASE_URL = "sqlite:///./taekwondo.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class EventModel(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    event_date = Column(String(50), default="2026-10-24")
    location = Column(String(200), default="District Sports Complex")
    rule_profile = Column(String(50), default="tourn2026")
    rules_json = Column(Text, nullable=True)  # per-event custom rules snapshot
    created_at = Column(DateTime, default=datetime.utcnow)

    athletes = relationship("AthleteModel", back_populates="event", cascade="all, delete-orphan")


class AthleteModel(Base):
    __tablename__ = "athletes"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    sr_no = Column(Integer, nullable=True)
    name = Column(String(200), nullable=False)
    gender = Column(String(10), nullable=False)
    dob = Column(String(50), nullable=True)
    calculated_age = Column(Integer, nullable=True)
    age_group = Column(String(50), nullable=False)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_class = Column(String(100), nullable=False)
    height_category = Column(String(100), nullable=True)
    full_category = Column(String(250), nullable=False)
    club = Column(String(200), nullable=True)
    notes = Column(Text, default="[]")  # JSON string array
    weigh_in_status = Column(String(30), nullable=True)
    scale_weight_kg = Column(Float, nullable=True)
    scale_height_cm = Column(Float, nullable=True)
    weigh_in_notes = Column(Text, nullable=True)
    weigh_in_time = Column(String(40), nullable=True)
    verification_status = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("EventModel", back_populates="athletes")


def _ensure_schema_columns():
    """Safely add newer columns when upgrading an existing SQLite database."""
    if not str(engine.url).startswith("sqlite"):
        return
    migrations = {
        "events": [
            ("rule_profile", "VARCHAR(50) DEFAULT 'tourn2026'"),
        ],
        "athletes": [
            ("weigh_in_status", "VARCHAR(30)"),
            ("scale_weight_kg", "FLOAT"),
            ("scale_height_cm", "FLOAT"),
            ("weigh_in_notes", "TEXT"),
            ("weigh_in_time", "VARCHAR(40)"),
            ("verification_status", "VARCHAR(30)"),
        ],
    }
    with engine.begin() as conn:
        for table_name, cols in migrations.items():
            existing = {
                row[1]
                for row in conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
            }
            for col_name, col_def in cols:
                if col_name not in existing:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def}"))


def init_db():
    Base.metadata.create_all(bind=engine)
    _ensure_schema_columns()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _parse_rules_json(rules_json: Optional[str]) -> Optional[Dict[str, Any]]:
    if not rules_json:
        return None
    try:
        parsed = json.loads(rules_json)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


def _serialize_event(ev: EventModel) -> Dict[str, Any]:
    return {
        "id": ev.id,
        "name": ev.name,
        "event_date": ev.event_date,
        "location": ev.location,
        "rule_profile": ev.rule_profile or "tourn2026",
        "rules": _parse_rules_json(ev.rules_json),
        "athletes_count": len(ev.athletes),
        "created_at": ev.created_at.isoformat() if ev.created_at else None,
    }


def get_or_create_default_event(db: Session) -> EventModel:
    event = db.query(EventModel).first()
    if not event:
        event = EventModel(
            name="2026 District Taekwondo Championship",
            event_date="2026-10-24",
            location="State Sports Complex",
            rule_profile="tourn2026",
        )
        db.add(event)
        db.commit()
        db.refresh(event)
    return event


def get_event_by_id(db: Session, event_id: int) -> Optional[EventModel]:
    return db.query(EventModel).filter(EventModel.id == event_id).first()


def get_all_events(db: Session) -> List[Dict[str, Any]]:
    events = db.query(EventModel).order_by(EventModel.id.desc()).all()
    return [_serialize_event(ev) for ev in events]


def create_event(
    db: Session,
    name: str,
    event_date: str = "2026-10-24",
    location: str = "",
    rule_profile: str = "tourn2026",
    rules: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    ev = EventModel(
        name=name.strip() or "Untitled Competition",
        event_date=event_date or "2026-10-24",
        location=location or "",
        rule_profile=rule_profile or "tourn2026",
        rules_json=json.dumps(rules) if isinstance(rules, dict) else None,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return _serialize_event(ev)


def get_event_rules(db: Session, event_id: int) -> Optional[Dict[str, Any]]:
    ev = get_event_by_id(db, event_id)
    if not ev:
        return None
    return _parse_rules_json(ev.rules_json)


def save_event_rules(
    db: Session,
    event_id: int,
    rules: Dict[str, Any],
    rule_profile: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    ev = get_event_by_id(db, event_id)
    if not ev:
        return None
    ev.rules_json = json.dumps(rules)
    if rule_profile:
        ev.rule_profile = rule_profile
    db.commit()
    db.refresh(ev)
    return _parse_rules_json(ev.rules_json)


def delete_event(db: Session, event_id: int) -> bool:
    ev = get_event_by_id(db, event_id)
    if not ev:
        return False
    db.delete(ev)
    db.commit()
    return True


def save_athletes_to_event(db: Session, event_id: int, athletes_data: List[Dict[str, Any]], replace: bool = False):
    ev = get_event_by_id(db, event_id)
    if not ev:
        raise ValueError(f"Event {event_id} not found")

    if replace:
        db.query(AthleteModel).filter(AthleteModel.event_id == event_id).delete()

    existing_count = db.query(AthleteModel).filter(AthleteModel.event_id == event_id).count() if not replace else 0

    new_models = []
    for idx, a in enumerate(athletes_data):
        notes_str = json.dumps(a.get("notes", [])) if isinstance(a.get("notes"), list) else "[]"
        new_models.append(AthleteModel(
            event_id=event_id,
            sr_no=a.get("sr_no") or (existing_count + idx + 1),
            name=a.get("name", "UNKNOWN"),
            gender=a.get("gender", "M"),
            dob=str(a.get("dob")) if a.get("dob") else None,
            calculated_age=a.get("calculated_age"),
            age_group=a.get("age_group", "Unknown"),
            weight_kg=float(a["weight_kg"]) if a.get("weight_kg") is not None else None,
            height_cm=float(a.get("height_cm")) if a.get("height_cm") is not None else None,
            weight_class=a.get("weight_class", ""),
            height_category=a.get("height_category"),
            full_category=a.get("full_category", ""),
            club=a.get("club"),
            notes=notes_str,
            weigh_in_status=a.get("weigh_in_status"),
            scale_weight_kg=float(a["scale_weight_kg"]) if a.get("scale_weight_kg") is not None else None,
            scale_height_cm=float(a["scale_height_cm"]) if a.get("scale_height_cm") is not None else None,
            weigh_in_notes=a.get("weigh_in_notes"),
            weigh_in_time=a.get("weigh_in_time"),
            verification_status=a.get("verification_status"),
        ))
    db.bulk_save_objects(new_models)
    db.commit()
    return len(new_models)


def get_athletes_from_event(db: Session, event_id: int) -> List[Dict[str, Any]]:
    records = db.query(AthleteModel).filter(AthleteModel.event_id == event_id).order_by(AthleteModel.sr_no.asc(), AthleteModel.id.asc()).all()
    results = []
    for r in records:
        notes_list = []
        try:
            if r.notes:
                notes_list = json.loads(r.notes)
        except Exception:
            notes_list = [r.notes] if r.notes else []

        results.append({
            "id": r.id,
            "sr_no": r.sr_no,
            "name": r.name,
            "gender": r.gender,
            "dob": r.dob,
            "calculated_age": r.calculated_age,
            "competition_age": r.calculated_age,
            "age_group": r.age_group,
            "weight_kg": r.weight_kg,
            "height_cm": r.height_cm,
            "weight_class": r.weight_class,
            "height_category": r.height_category,
            "full_category": r.full_category,
            "club": r.club,
            "notes": notes_list,
            "weigh_in_status": r.weigh_in_status,
            "scale_weight_kg": r.scale_weight_kg,
            "scale_height_cm": r.scale_height_cm,
            "weigh_in_notes": r.weigh_in_notes,
            "weigh_in_time": r.weigh_in_time,
            "verification_status": r.verification_status,
        })
    return results


def delete_athlete(db: Session, athlete_id: int) -> bool:
    count = db.query(AthleteModel).filter(AthleteModel.id == athlete_id).delete()
    db.commit()
    return count > 0


def clear_event_athletes(db: Session, event_id: int) -> int:
    count = db.query(AthleteModel).filter(AthleteModel.event_id == event_id).delete()
    db.commit()
    return count
