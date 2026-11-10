"""
Realistic Sample Data Generator for Taekwondo Tournaments
Generates 500 to 2000 realistic athletes for district/state level events.
Realistic Indian names, age distributions, clubs, weights, and heights.
"""

import random
from datetime import date, timedelta
from typing import List
from rules_engine import AthleteInput, Gender

INDIAN_BOY_NAMES = [
    "AARAV", "VIVAAN", "ADITYA", "VIHAAN", "ARJUN", "REYNAH", "MOHAMMED", "SAI", "ARNAV", "AYAN",
    "KRISHNA", "ISHAN", "SHOURYA", "ATHARVA", "ANSH", "PARTH", "SIDDHARTH", "KAVYAN", "RUDRA",
    "DHRUV", "SAMAR", "KABIR", "DEV", "DAKSH", "MANAN", "HARSH", "TEJAS", "LAKSHYA", "YUG",
    "CHETAN", "VEDANT", "PRANAV", "AYUSH", "RITIK", "MOKSHIK", "VIBHOR", "PRATHAM", "ISHANT",
    "RAHUL", "AMIT", "ROHIT", "KUNAL", "HARSHIT", "VARUN", "SAMEER", "YASH", "DEEPAK", "NIKHIL"
]

INDIAN_GIRL_NAMES = [
    "AADHHYA", "ANANYA", "PARI", "ANVI", "AARADHYA", "DIYA", "MYSHA", "PRISHA", "RIYA", "ANUSHKA",
    "NAVYA", "AVANI", "IRA", "KAVYA", "SAANVI", "AISHWARYA", "TANVI", "ASHMITA", "GAURI", "AYUSHI",
    "DITYA", "SIYA", "TANYA", "SNEHA", "POOJA", "PRIYA", "SHREYA", "KHUSHI", "DRISHTI", "VIDHI",
    "RHEA", "SIMRAN", "MEHAK", "ISHITA", "DIVYA", "MANNAT", "PAYAL", "NEHA", "BHOOMI", "TAMANNA"
]

INDIAN_SURNAMES = [
    "SHARMA", "VERMA", "GUPTA", "SINGH", "KUMAR", "PATEL", "YADAV", "MEHTA", "CHAUHAN", "JOSHI",
    "PANDEY", "TIWARI", "MISHRA", "BHARDWAJ", "REDDY", "NAIR", "DESHMUKH", "RATHORE", "MALHOTRA",
    "SAXENA", "KAPOOR", "AGRAWAL", "CHOUDHARY", "RAWAT", "NEGI", "BISHT", "GILL", "SANDHU"
]

CLUBS = [
    "GHSS Sports Wing",
    "Delhi Taekwondo Academy",
    "Haryana Warriors Club",
    "Punjab Martial Arts Centre",
    "Tiger Strikers Academy",
    "National Youth Sports Club",
    "Black Belt Arena",
    "Shivaji Martial Arts Club",
    "Apex Taekwondo Institute",
    "Combat Sports Academy",
    "Kendriya Vidyalaya Sports",
    "Army Public School TKD",
    "St. Xavier Sports Club",
    "Eagle Taekwondo Dojang"
]


def random_date(start_year: int, end_year: int) -> date:
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    delta_days = (end - start).days
    random_days = random.randint(0, delta_days)
    return start + timedelta(days=random_days)


def generate_synthetic_athletes(count: int = 500, event_year: int = 2026) -> List[AthleteInput]:
    """
    Generate realistic athlete dataset for district / state tournament.
    Distribution:
    - Sub-Jr: ~40% (born 2015-2019)
    - Cadet:  ~30% (born 2012-2014)
    - Junior: ~20% (born 2009-2011)
    - Senior: ~10% (born 1990-2008)
    """
    athletes = []
    male_count = int(count * 0.55)  # 55% boys, 45% girls typically in tournament

    genders = [Gender.MALE] * male_count + [Gender.FEMALE] * (count - male_count)
    random.shuffle(genders)

    for i in range(1, count + 1):
        g = genders[i - 1]
        is_male = (g == Gender.MALE)

        first_name = random.choice(INDIAN_BOY_NAMES if is_male else INDIAN_GIRL_NAMES)
        last_name = random.choice(INDIAN_SURNAMES)
        full_name = f"{first_name} {last_name}"

        # Category roll
        r = random.random()
        if r < 0.40:
            # Sub-Jr: 2015-2019
            dob = random_date(2015, 2019)
            base_w = random.uniform(16.5, 44.0) if is_male else random.uniform(15.0, 41.5)
            # Add height for sub-jr
            height = round(random.uniform(115.0, 158.0), 1)
        elif r < 0.70:
            # Cadet: 2012-2014
            dob = random_date(2012, 2014)
            base_w = random.uniform(31.0, 64.0) if is_male else random.uniform(28.0, 58.0)
            height = round(random.uniform(140.0, 175.0), 1) if random.random() > 0.3 else None
        elif r < 0.90:
            # Junior: 2009-2011
            dob = random_date(2009, 2011)
            base_w = random.uniform(43.0, 77.0) if is_male else random.uniform(40.0, 67.0)
            height = round(random.uniform(155.0, 185.0), 1) if random.random() > 0.4 else None
        else:
            # Senior: 1995-2008
            dob = random_date(1996, 2008)
            base_w = random.uniform(52.0, 89.0) if is_male else random.uniform(45.0, 75.0)
            height = round(random.uniform(160.0, 190.0), 1) if random.random() > 0.5 else None

        club = random.choice(CLUBS)

        # Occasional missing DOB but provided age (realistic scenario)
        age_years = None
        dob_val = dob
        if random.random() < 0.08:
            age_years = event_year - dob.year
            dob_val = None

        athletes.append(AthleteInput(
            sr_no=i,
            name=full_name,
            dob=dob_val.isoformat() if dob_val else None,
            age_years=age_years,
            gender=g,
            weight_kg=round(base_w, 1),
            height_cm=height,
            club=club
        ))

    return athletes
