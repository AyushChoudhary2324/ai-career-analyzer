import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_resume(resume_text, role_name, role_skills):
    prompt = f"""
    You are a career advisor AI.
    
    The candidate's resume text:
    {resume_text}
    
    Target job role: {role_name}
    Required skills for this role: {', '.join(role_skills)}
    
    Please analyze and provide:
    1. Skills the candidate already has
    2. Skills the candidate is missing
    3. Readiness score out of 100
    4. A 4 week learning roadmap for missing skills
    
    Be specific and practical.
    """
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content

if __name__ == "__main__":
    sample_resume = "I know Python, SQL and Excel. I have worked on data projects."
    sample_skills = ["Python", "SQL", "Excel", "Tableau", "Power BI", "Statistics"]
    
    result = analyze_resume(sample_resume, "Data Analyst", sample_skills)
    print(result)


def calculate_readiness_score(resume_text, role_skills):
    if not role_skills:
        return {
            "score": 0,
            "matched_skills": [],
            "missing_skills": []
        }
    
    resume_lower = resume_text.lower()
    matched = []
    missing = []
    
    for skill in role_skills:
        if skill.lower() in resume_lower:
            matched.append(skill)
        else:
            missing.append(skill)
    
    score = int((len(matched) / len(role_skills)) * 100)
    
    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing
    }