import chromadb
import json

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="job_descriptions")

def load_roles():
    with open("roles.json", "r") as f:
        return json.load(f)

def populate_chromadb():
    roles = load_roles()
    for role, skills in roles.items():
        skill_text = f"Role: {role}. Required skills: {', '.join(skills)}"
        collection.add(
            documents=[skill_text],
            ids=[role.replace(" ", "_")]
        )
    print("ChromaDB populated successfully!")
    
def get_role_skills(role_name):
    role_name = role_name.replace("-", " ").replace("_", " ").strip().title()
    with open("roles.json", "r") as f:
        roles = json.load(f)
    return roles.get(role_name, [])

def search_role(role_name):
    results = collection.query(
        query_texts=[role_name],
        n_results=1
    )
    return results