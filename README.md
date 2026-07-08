# 🚀 AI Career Analyzer

🏆 **Runner-up – AI Productathon 2025**

AI Career Analyzer is an AI-powered career readiness platform that analyzes resumes, identifies skill gaps, and generates personalized learning roadmaps using **Retrieval-Augmented Generation (RAG)** and **Large Language Models (LLMs)**.

Unlike traditional resume analyzers, the platform continuously updates job role requirements by scraping real-world job postings, ensuring recommendations remain aligned with current industry trends.

---

# 🌐 Live Demo

### 🚀 Try the Application

https://ai-career-analyzer-olive.vercel.app/

> **Note:** The backend is deployed on Render. If the application has been idle, the first request may take a few seconds while the backend wakes up.

---

# ✨ Features

- 📄 Upload resumes in PDF format
- ✏️ Edit resumes before analysis
- 🤖 AI-powered resume analysis
- 📊 Career Readiness Score
- 🎯 Skill Gap Analysis
- 📚 Personalized Learning Roadmap
- 🔍 Retrieval-Augmented Generation (RAG)
- 🌐 Dynamic role updates using job scraping
- 🧠 Semantic search with ChromaDB
- 🔐 JWT Authentication
- 👤 User Authentication & Profile Management
- 💾 PostgreSQL Database Integration
- ⚡ FastAPI Backend
- 🎨 Responsive React Frontend

---

# 🏗️ System Architecture

```
                    Resume Upload
                           │
                           ▼
                    Resume Parser
                           │
                           ▼
                  Skill Extraction
                           │
                           ▼
                 Resume Embeddings
                           │
                           ▼
                      ChromaDB
                           │
                           ▼
            Retrieval-Augmented Generation
                           │
                           ▼
                 Groq Llama 3.3 70B
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 Career Readiness     Skill Gap         Learning Roadmap
       Score           Analysis         Recommendations
```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3

## Backend

- FastAPI
- Python

## AI & NLP

- Groq API
- Llama 3.3 70B
- Sentence Transformers
- ChromaDB
- Retrieval-Augmented Generation (RAG)

## Database

- PostgreSQL
- SQLAlchemy

## Authentication

- JWT Authentication
- Password Hashing

## Deployment

- Vercel
- Render

---

# ⚙️ How It Works

### Step 1

Upload your resume in PDF format.

### Step 2

The resume parser extracts skills, education, experience, and projects.

### Step 3

Current industry job postings are scraped and processed to maintain an up-to-date knowledge base of role requirements.

### Step 4

Job descriptions are converted into vector embeddings and stored in ChromaDB.

### Step 5

Using Retrieval-Augmented Generation (RAG), the system retrieves the most relevant industry requirements for the selected role.

### Step 6

The LLM compares the resume with current market expectations.

### Step 7

The platform generates:

- 📊 Career Readiness Score
- 🎯 Skill Gap Analysis
- 💪 Strengths
- 📉 Areas for Improvement
- 📚 Personalized Learning Roadmap
- 💡 Actionable Career Recommendations

---

# 📂 Project Structure

```
AI-Career-Analyzer
│
├── backend
│   ├── analyzer.py
│   ├── auth.py
│   ├── database.py
│   ├── models.py
│   ├── resume_parser.py
│   ├── scraper.py
│   ├── roles.json
│   ├── main.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── README.md
```

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/Roshni395/ai-career-analyzer.git

cd ai-career-analyzer
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `backend` folder.

```env
GROQ_API_KEY=YOUR_GROQ_API_KEY

DATABASE_URL=YOUR_POSTGRESQL_DATABASE_URL

JWT_SECRET=YOUR_SECRET_KEY
```

---

# 📈 Future Enhancements

- 🤖 AI Mock Interviews
- 📄 ATS Resume Scoring
- 🎤 Interview Question Generation
- 🏢 Company-specific Career Roadmaps
- 📊 Resume Version History
- 📧 Email Notifications
- 💰 Salary Prediction
- 🌍 Multi-language Support

---


# 🎯 Why AI Career Analyzer?

Traditional resume analyzers rely primarily on keyword matching, often producing generic recommendations.

AI Career Analyzer takes a more intelligent approach by combining **Retrieval-Augmented Generation (RAG)** with **Large Language Models (LLMs)** to deliver personalized and context-aware insights. It continuously updates job role requirements through automated job scraping, ensuring users receive recommendations that reflect the latest industry expectations.

Key highlights include:

- Real-time role requirement updates through job scraping
- Semantic skill matching using vector embeddings
- AI-generated career readiness evaluation
- Personalized learning roadmap
- Resume editing before analysis
- Role-specific recommendations based on current market trends

---

# 👩‍💻 About the Author

**Roshni Kumari**

Computer Science Engineering student passionate about Artificial Intelligence, Machine Learning, Backend Development, and Generative AI. Interested in building scalable AI-powered applications that solve real-world problems.

**GitHub:**  
https://github.com/Roshni395

---

# ⭐ If you found this project interesting, consider giving it a star!