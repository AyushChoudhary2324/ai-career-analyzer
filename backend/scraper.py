import json
import os
import re
import chromadb

from groq import Groq
from dotenv import load_dotenv
from serpapi import GoogleSearch

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
SERPAPI_KEY = os.getenv("SERPAPI_KEY")

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="job_descriptions")


# Generic skills to always remove
GENERIC_SKILLS_BLACKLIST = [
    "communication", "teamwork", "leadership", "problem solving",
    "time management", "organization", "attention to detail",
    "adaptability", "patience", "compassion", "transportation",
    "scheduling", "customer service", "interpersonal", "multitasking",
    "work ethic", "self motivated", "critical thinking", "creativity",
    "flexibility", "reliability", "professionalism", "collaboration",
    "presentation", "microsoft office", "ms office", "typing",
    "phone", "email", "filing", "data entry", "administrative",
    "healthcare", "patient care", "medical", "retail", "cashier",
    "inventory", "merchandising", "hospitality", "cleaning"
]

def clean_text(text):
    text = re.sub('<[^<]+?>', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def is_relevant_skill(skill, role):
    skill_lower = skill.lower().strip()

    if len(skill_lower) < 2:
        return False

    if len(skill_lower) > 40:
        return False

    for blacklisted in GENERIC_SKILLS_BLACKLIST:
        if blacklisted in skill_lower:
            return False

    if skill_lower.isdigit():
        return False

    return True

def preprocess_skills(skills, role):

    if not skills:
        return []

    # Step 1 - basic filtering
    filtered = [s for s in skills if is_relevant_skill(s, role)]

    # Step 2 - remove duplicates
    seen = set()
    unique = []

    for skill in filtered:
        if skill.lower() not in seen:
            seen.add(skill.lower())
            unique.append(skill)

    filtered = unique

    # Step 3 - LLM final validation
    if not filtered:
        return []

    prompt = f"""
    You are a strict technical recruiter reviewing skills for: {role}

    Review this skills list and:
    1. Keep ONLY skills directly relevant to {role}
    2. Remove ANY generic soft skills
    3. Remove ANY skills from unrelated industries
    4. Keep technical tools, frameworks, methodologies
    5. Maximum 12 skills

    Skills to review:
    {json.dumps(filtered)}

    Return ONLY a clean JSON array:
    ["skill1", "skill2"]

    No explanation, just the array.
    """

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        content = response.choices[0].message.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()

        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        validated = json.loads(content)

        # final dedup
        seen = set()
        final = []

        for skill in validated:
            if skill.lower() not in seen:
                seen.add(skill.lower())
                final.append(skill)

        print(f"After preprocessing: {len(final)} clean skills")

        return final

    except Exception as e:
        print(f"Preprocessing error: {e}")
        return filtered[:12]

def fetch_jobs_serpapi(role):

    print(f"Fetching real time jobs for: {role}")

    try:

        params = {
            "engine": "google_jobs",
            "q": role,
            "hl": "en",
            "api_key": SERPAPI_KEY
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        jobs = results.get("jobs_results", [])

        descriptions = []

        for job in jobs[:10]:

            title = job.get("title", "")
            company = job.get("company_name", "")

            # NEW METADATA
            source = job.get("via", "Unknown Source")
            location = job.get("location", "Unknown Location")

            description = clean_text(job.get("description", ""))
            highlights = job.get("job_highlights", [])

            highlight_text = ""

            for h in highlights:
                items = h.get("items", [])
                highlight_text += " ".join(items) + " "

            highlight_text = clean_text(highlight_text)

            # SHOW METADATA
            print("\n==============================")
            print(f"Role      : {title}")
            print(f"Company   : {company}")
            print(f"Source    : {source}")
            print(f"Location  : {location}")
            print("==============================")

            # UPDATED TEXT
            full_text = f"""
            Title: {title}
            Company: {company}
            Source: {source}
            Location: {location}
            Description: {description[:300]}
            Requirements: {highlight_text[:300]}
            """

            descriptions.append(full_text)

        print(f"\nFound {len(descriptions)} real jobs for {role}")

        return descriptions

    except Exception as e:
        print(f"Error fetching jobs: {e}")
        return []

def get_base_skills(role):

    print(f"Getting base skills for: {role}")

    prompt = f"""
    You are a technical recruiter with deep industry knowledge.

    List core established technical skills for: {role}

    Rules:
    - Only well established technical skills
    - Tools, frameworks, languages, methodologies
    - No soft skills at all
    - Maximum 8 skills

    Return ONLY a JSON array:
    ["skill1", "skill2"]
    """

    try:

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        content = response.choices[0].message.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()

        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        skills = json.loads(content)

        print(f"Base skills: {skills}")

        return skills

    except:
        return []

def extract_skills_from_jds(role, descriptions):

    print(f"Extracting skills from JDs for: {role}")

    jd_text = "\n".join(descriptions[:5])

    prompt = f"""
    Extract technical skills mentioned in these job descriptions for: {role}

    Job Descriptions:
    {jd_text[:2000]}

    Rules:
    - Only extract TECHNICAL skills
    - NO soft skills
    - NO unrelated industry skills
    - Only skills specific to {role}

    Return ONLY a JSON array:
    ["skill1", "skill2"]
    """

    try:

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        content = response.choices[0].message.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()

        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        skills = json.loads(content)

        print(f"Extracted from JDs: {skills}")

        return skills

    except:
        return []

def merge_and_validate_skills(role, base_skills, jd_skills):

    print(f"Merging and validating skills for: {role}")

    combined = list(set(base_skills + jd_skills))

    prompt = f"""
    You are a strict technical recruiter for: {role}

    Combined skills from multiple sources:
    {json.dumps(combined)}

    Task:
    1. Keep base skills still relevant in 2025
    2. Only use skills from the provided list, do not add new ones
    3. Remove outdated skills
    4. Remove soft skills
    5. Final list should have 10-15 skills
    6. No duplicates

    Return ONLY a JSON array:
    ["skill1", "skill2"]

    No explanation.
    """

    try:

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        content = response.choices[0].message.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()

        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        merged = json.loads(content)

        print(f"Merged skills: {merged}")

        return merged

    except:
        return combined[:12]

def update_chromadb(role, descriptions):

    if not descriptions:
        print(f"No descriptions for {role}")
        return

    for i, desc in enumerate(descriptions):

        doc_id = f"{role.replace(' ', '_')}_{i}"

        try:
            collection.upsert(
                documents=[desc],
                ids=[doc_id]
            )

        except Exception as e:
            print(f"Error updating ChromaDB: {e}")

    print(f"ChromaDB updated for {role}!")

def add_role_to_json(role, skills):
    if not skills:
        return
    role = role.replace("-", " ").replace("_", " ").strip().title()
    with open("roles.json", "r") as f:
        roles = json.load(f)
    roles[role] = skills
    with open("roles.json", "w") as f:
        json.dump(roles, f, indent=2)
    print(f"Added '{role}' with {len(skills)} skills to roles.json!")

def scrape_jobs(role):
    descriptions = fetch_jobs_serpapi(role)
    return descriptions

def process_role(role):

    print(f"\n{'='*50}")
    print(f"Processing: {role}")
    print(f"{'='*50}")

    # Step 1 - fetch jobs
    descriptions = fetch_jobs_serpapi(role)

    # Step 2 - store in chromadb
    update_chromadb(role, descriptions)

    # Step 3 - base skills
    base_skills = get_base_skills(role)

    # Step 4 - JD skills
    jd_skills = extract_skills_from_jds(role, descriptions) if descriptions else []

    # Step 5 - merge
    final_skills = merge_and_validate_skills(
        role,
        base_skills,
        jd_skills
    )

    # Step 6 - clean
    clean_skills = preprocess_skills(final_skills, role)

    # Step 7 - save
    add_role_to_json(role, clean_skills)

    print(f"\n✅ Done! Final skills for {role}:")
    print(clean_skills)

def run_scraper():

    print("Starting hybrid scraper...")

    with open("roles.json", "r") as f:
        roles = json.load(f)

    for role in roles.keys():
        process_role(role)

    print("\nScraper finished!")

if __name__ == "__main__":
    run_scraper()