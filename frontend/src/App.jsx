import { useState } from "react"
import axios from "axios"
import ResumeEditor from "./ResumeEditor"

const roles = [
  "Data Analyst",
  "Software Developer Engineer",
  "ML Engineer",
  "DevOps Engineer",
  "Frontend Developer",
  "Backend Developer"
]

const API = "https://ai-career-analyzer-gnu5.onrender.com"

function App() {
  const [page, setPage] = useState("login") // login, register, home
  const [token, setToken] = useState(localStorage.getItem("token") || null)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"))

  // Auth states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  // Analyze states
  const [file, setFile] = useState(null)
  const [role, setRole] = useState("Data Analyst")
  const [customRole, setCustomRole] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // History states
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const selectedRole = customRole || role

  const handleRegister = async () => {
    setAuthLoading(true)
    setAuthError("")
    try {
      await axios.post(`${API}/register`, { email, password })
      setPage("login")
      setAuthError("Registration successful! Please login.")
    } catch (error) {
      const detail = error.response?.data?.detail
      if (Array.isArray(detail)) {
        setAuthError("Please enter a valid email address!")
      } else {
        setAuthError(detail || "Registration failed!")
      }
    }
    setAuthLoading(false)
  }

  const handleLogin = async () => {
    setAuthLoading(true)
    setAuthError("")
    try {
      const response = await axios.post(`${API}/login`, { email, password })
      const { access_token, user_id, email: userEmail } = response.data
      setToken(access_token)
      setUser({ user_id, email: userEmail })
      localStorage.setItem("token", access_token)
      localStorage.setItem("user", JSON.stringify({ user_id, email: userEmail }))
      setPage("home")
    } catch (error) {
      setAuthError(error.response?.data?.detail || "Login failed!")
    }
    setAuthLoading(false)
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setPage("login")
    setResult(null)
  }

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload a resume first!")
      return
    }
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const response = await axios.post(
        `${API}/analyze?role=${selectedRole}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResult(response.data)
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout()
        alert("Session expired! Please login again.")
      } else {
        alert(error.response?.data?.detail || "Something went wrong!")
      }
    }
    setLoading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === "application/pdf") setFile(dropped)
  }

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory(response.data.history)
      setShowHistory(true)
    } catch (error) {
      alert("Could not fetch history!")
    }
  }

  // Auto redirect if token exists
  if (token && page === "login") setPage("home")

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        .glow { box-shadow: 0 0 40px rgba(99,102,241,0.15); }
        .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 16px; border-radius: 14px; padding: 16px; width: 100%; transition: all 0.2s; letter-spacing: 0.3px; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(99,102,241,0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #888; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 14px; border-radius: 10px; padding: 8px 16px; transition: all 0.2s; }
        .btn-secondary:hover { border-color: #6366f1; color: #a5b4fc; }
        .tag { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 30px; font-size: 12px; font-weight: 500; }
        input[type=text], input[type=email], input[type=password], select { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #f0f0f0; border-radius: 12px; padding: 12px 16px; width: 100%; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border 0.2s; }
        input:focus, select:focus { border-color: #6366f1; }
        select option { background: #1a1a2e; }
        .upload-zone { border: 2px dashed rgba(99,102,241,0.3); border-radius: 16px; padding: 40px 20px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .upload-zone:hover, .upload-zone.drag { border-color: #6366f1; background: rgba(99,102,241,0.05); }
        .analysis-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 24px; white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #c8c8d8; font-family: 'DM Sans', sans-serif; max-height: 500px; overflow-y: auto; }
        .analysis-box::-webkit-scrollbar { width: 4px; }
        .analysis-box::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 4px; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .spin { animation: spin 1s linear infinite; display:inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .history-item { padding: 16px; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .error-msg { color: #f87171; font-size: 13px; margin-top: 8px; text-align: center; }
        .success-msg { color: #4ade80; font-size: 13px; margin-top: 8px; text-align: center; }
      `}</style>

      {/* AUTH PAGES */}
      {(page === "login" || page === "register") && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card glow" style={{ width: "100%", maxWidth: 420, padding: 40 }}>

            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>🎯</div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>CareerAI</h1>
              <p style={{ color: "#555", fontSize: 14, marginTop: 6 }}>
                {page === "login" ? "Welcome back!" : "Create your account"}
              </p>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (page === "login" ? handleLogin() : handleRegister())}
              />

              {authError && (
                <p className={authError.includes("successful") ? "success-msg" : "error-msg"}>
                  {authError}
                </p>
              )}

              <button
                className="btn-primary"
                onClick={page === "login" ? handleLogin : handleRegister}
                disabled={authLoading}
                style={{ marginTop: 8 }}
              >
                {authLoading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span className="spin">⟳</span>
                    {page === "login" ? "Logging in..." : "Creating account..."}
                  </span>
                ) : (
                  page === "login" ? "Login →" : "Create Account →"
                )}
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#555", marginTop: 8 }}>
                {page === "login" ? "Don't have an account? " : "Already have an account? "}
                <span
                  onClick={() => { setPage(page === "login" ? "register" : "login"); setAuthError("") }}
                  style={{ color: "#a5b4fc", cursor: "pointer" }}
                >
                  {page === "login" ? "Register" : "Login"}
                </span>
              </p>
            </div>

          </div>
        </div>
      )}

      {/* MAIN APP */}
      {page === "home" && (
        <div>
          {/* Navbar */}
          <nav style={{ padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎯</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>CareerAI</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#555" }}>👤 {user?.email}</span>
              <button className="btn-secondary" onClick={fetchHistory}>📋 History</button>
              <button className="btn-secondary" onClick={handleLogout}>Logout</button>
            </div>
          </nav>

          <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>

            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 16 }}>
                Know your career
                <span style={{ background: "linear-gradient(135deg,#6366f1,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> readiness</span>
              </h1>
              <p style={{ color: "#666", fontSize: 17, lineHeight: 1.6 }}>
                Upload your resume and get an AI-powered skill gap analysis<br />with a personalized learning roadmap
              </p>
            </div>

            {/* History Panel */}
            {showHistory && (
              <div className="card fade-in" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>Your Analysis History</h2>
                  <button className="btn-secondary" onClick={() => setShowHistory(false)}>Close</button>
                </div>
                {history.length === 0 ? (
                  <p style={{ color: "#555", fontSize: 14, textAlign: "center" }}>No analyses yet!</p>
                ) : (
                  history.map(h => (
                    <div key={h.id} className="history-item">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{h.role}</div>
                        <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{new Date(h.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span className="tag" style={{
                          background: h.readiness_score >= 70 ? "rgba(34,197,94,0.1)" : h.readiness_score >= 40 ? "rgba(234,179,8,0.1)" : "rgba(248,113,113,0.1)",
                          color: h.readiness_score >= 70 ? "#4ade80" : h.readiness_score >= 40 ? "#facc15" : "#f87171",
                          border: `1px solid ${h.readiness_score >= 70 ? "rgba(34,197,94,0.2)" : h.readiness_score >= 40 ? "rgba(234,179,8,0.2)" : "rgba(248,113,113,0.2)"}`
                        }}>
                          {h.readiness_score}/100
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Upload Card */}
            <div className="card glow" style={{ padding: 32, marginBottom: 20 }}>
              <div
                className={`upload-zone ${dragOver ? "drag" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileInput").click()}
                style={{ marginBottom: 24 }}
              >
                <input type="file" accept=".pdf" id="fileInput" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
                {file ? (
                  <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <div style={{ color: "#a5b4fc", fontWeight: 500, fontSize: 15 }}>{file.name}</div>
                    <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>Click to change file</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
                    <div style={{ color: "#888", fontSize: 15 }}>Drop your resume here or <span style={{ color: "#a5b4fc" }}>browse</span></div>
                    <div style={{ color: "#444", fontSize: 13, marginTop: 6 }}>PDF files only</div>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#888", marginBottom: 8 }}>Select role</label>
                  <select value={role} onChange={(e) => { setRole(e.target.value); setCustomRole("") }}>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#888", marginBottom: 8 }}>Or type custom role</label>
                  <input
                    type="text"
                    placeholder="e.g. Blockchain Developer"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#555" }}>Analyzing for:</span>
                <span className="tag" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}>
                  💼 {selectedRole}
                </span>
              </div>

              <button className="btn-primary" onClick={handleAnalyze} disabled={loading}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span className="spin">⟳</span> Analyzing your resume...
                  </span>
                ) : "Analyze My Resume →"}
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="card fade-in" style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>Processing pipeline</div>
                {["Extracting resume text", "Searching job database", "Comparing skills with RAG", "Generating roadmap with AI"].map((step, i) => (
                  <div key={i} className="pulse" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", animationDelay: `${i * 0.2}s` }}>
                    <span className="dot" style={{ background: "#6366f1", flexShrink: 0 }}></span>
                    <span style={{ fontSize: 14, color: "#888" }}>{step}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="card fade-in" style={{ padding: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700 }}>Analysis Result</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="tag" style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}>#{result.id}</span>
                    <span className="tag" style={result.used_rag ? { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" } : { background: "rgba(234,179,8,0.1)", color: "#facc15", border: "1px solid rgba(234,179,8,0.2)" }}>
                      {result.used_rag ? "✅ RAG Pipeline" : "⚡ AI Knowledge"}
                    </span>
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 24 }}></div>

                {result.score !== undefined && (
                  <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                        <circle cx="60" cy="60" r="50" fill="none"
                          stroke={result.score >= 70 ? "#4ade80" : result.score >= 40 ? "#facc15" : "#f87171"}
                          strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${(result.score / 100) * 314} 314`}
                          transform="rotate(-90 60 60)"
                        />
                        <text x="60" y="55" textAnchor="middle" fill="#f0f0f0" fontSize="22" fontWeight="700">{result.score}</text>
                        <text x="60" y="72" textAnchor="middle" fill="#666" fontSize="11">/100</text>
                      </svg>
                      <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Readiness Score</div>
                    </div>

                    <div style={{ flex: 1 }}>
                      {result.matched_skills?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 13, color: "#4ade80", marginBottom: 8, fontWeight: 500 }}>✅ Skills you have ({result.matched_skills.length})</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {result.matched_skills.map(skill => (
                              <span key={skill} className="tag" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.missing_skills?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 13, color: "#f87171", marginBottom: 8, fontWeight: 500 }}>❌ Skills you need ({result.missing_skills.length})</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {result.missing_skills.map(skill => (
                              <span key={skill} className="tag" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }}></div>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>📋 Detailed Analysis & Roadmap</div>
                <div className="analysis-box">{result.analysis}</div>
                <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#444" }}>
                  <span>Role: {result.role}</span>
                  <span>Llama 3.3 70B via Groq</span>
                </div>
                {/* Edit Resume Button */}
                <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                  <button
                    className="btn-primary"
                    onClick={() => setShowEditor(true)}
                    style={{ width: "auto", padding: "12px 28px" }}
                  >
                    ✏️ Edit My Resume
                  </button>
                </div>

                {/* Resume Editor Modal */}
                {showEditor && (
                  <ResumeEditor
                    resumeText={result.resume_text}
                    onClose={() => setShowEditor(false)}
                  />
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

export default App