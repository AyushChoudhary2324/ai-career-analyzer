import re
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from pydantic import BaseModel,EmailStr 
import json
import shutil
import os
from resume_parser import extract_text_from_pdf
from analyzer import analyze_resume, calculate_readiness_score
from database import get_role_skills
from models import User, Analysis, create_tables, get_db
from datetime import datetime
from scraper import run_scraper, process_role
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

app = FastAPI()

create_tables()

# Schedule scraper to run every week
scheduler = BackgroundScheduler()
scheduler.add_job(run_scraper, 'interval', weeks=1)
scheduler.start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str 

class LoginRequest(BaseModel):
    email: str
    password: str

def is_resume(text):
    resume_keywords = [
        "experience", "education", "skills",
        "work", "project", "certification",
        "university", "college", "internship",
        "resume", "curriculum vitae", "cv",
        "bachelor", "master", "degree",
        "company", "organization", "institute",
        "phone", "email", "address", "linkedin",
        "achievement", "responsibility", "objective"
    ]
    text_lower = text.lower()
    matches = sum(1 for k in resume_keywords if k in text_lower)
    return matches >= 2

def normalize_role(role: str) -> str:
    role = role.replace("-", " ").replace("_", " ")
    role = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', role)
    role = re.sub(r'\s+', ' ', role)
    return role.strip().title()

@app.get("/")
def home():
    return {"message": "AI Career Analyzer is running!"}

@app.get("/roles")
def get_roles():
    with open("roles.json", "r") as f:
        roles = json.load(f)
    return {"roles": list(roles.keys())}

@app.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered!"
        )
    hashed = hash_password(request.password)
    user = User(email=request.email, password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"REGISTER: {user.email} at {datetime.utcnow()}")
    return {"message": " :) Registration successful!"}

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail=":( Invalid email or password!"
        )
    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password!"
        )
    token = create_access_token({"user_id": user.id})
    print(f"LOGIN: {user.email} at {datetime.utcnow()}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email
    }

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    role: str = "Data Analyst",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    print(f"ANALYZE: {current_user.email} | Role: {role}")
    role = normalize_role(role)
    # Step 1 - save uploaded file temporarily
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Step 2 - extract text from PDF
    resume_text = extract_text_from_pdf(temp_path)

    # Step 3 - check if uploaded file is actually a resume
    if not is_resume(resume_text):
        os.remove(temp_path)
        raise HTTPException(
            status_code=400,
            detail="Uploaded file doesn't appear to be a resume. Please upload a valid resume PDF!"
        )

    # Step 4 - get skills for selected role
    role_skills = get_role_skills(role)

    # Step 5 - if role not found run full pipeline dynamically
    if not role_skills:
        print(f"Role '{role}' not in database — running full pipeline!")
        
        # run complete process:
        # fetch JDs → update ChromaDB → get base skills
        # extract from JDs → merge → preprocess → save to roles.json
        process_role(role)
        
        # fetch skills again after processing
        role_skills = get_role_skills(role)
        print(f"Fetched {len(role_skills)} skills after dynamic processing")
    else:
        print(f"Using RAG pipeline for {role}")

    # Step 6 - calculate score mathematically
    score_data = calculate_readiness_score(resume_text, role_skills)

    # Step 7 - analyze with Groq
    result = analyze_resume(resume_text, role, role_skills)

    # Step 8 - save to database with user_id
    analysis = Analysis(
        user_id=current_user.id,
        role=role,
        resume_text=resume_text,
        analysis_result=result,
        readiness_score=score_data["score"]
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    print(
    f"ANALYSIS COMPLETE: {current_user.email} | "
    f"Role: {role} | "
    f"Score: {score_data['score']}"
    )


    # Step 9 - delete temp file
    os.remove(temp_path)

    return {
        "id": analysis.id,
        "role": role,
        "used_rag": bool(role_skills),
        "score": score_data["score"],
        "matched_skills": score_data["matched_skills"],
        "missing_skills": score_data["missing_skills"],
        "analysis": result,
        "resume_text": resume_text
    }

@app.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(
    Analysis.created_at.desc()
    ).all()
    return {"history": [
        {
            "id": a.id,
            "role": a.role,
            "readiness_score": a.readiness_score,
            "created_at": a.created_at
        } for a in analyses
    ]}

@app.get("/history/{id}")
def get_analysis_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis = db.query(Analysis).filter(
        Analysis.id == id,
        Analysis.user_id == current_user.id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis with id {id} not found"
        )

    return {
        "id": analysis.id,
        "role": analysis.role,
        "resume_text": analysis.resume_text,
        "analysis_result": analysis.analysis_result,
        "readiness_score": analysis.readiness_score,
        "created_at": analysis.created_at
    }