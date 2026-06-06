import { useState, useRef } from "react"

function parseResumeText(text) {
  if (!text) return { _meta: { name: "", title: "", phone: "", email: "" }, sections: {} }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  const phoneMatch = text.match(/(\+91[\s-]?)?[6-9]\d{9}/)

  const name = lines[0] || ""
  const email = emailMatch ? emailMatch[0] : ""
  const phone = phoneMatch ? phoneMatch[0] : ""

  const knownSections = [
    "education", "experience", "work experience", "projects", "skills",
    "technical skills", "certifications", "achievements", "summary",
    "objective", "leadership", "extracurricular", "positions of responsibility",
    "relevant coursework", "coursework", "internship", "publications",
    "volunteer", "awards", "interests", "languages", "skills & interests"
  ]

  const isSectionHeading = (line) => {
    const lower = line.toLowerCase().trim().replace(/[.\s]+$/, '')
    return knownSections.some(s => lower === s || lower.startsWith(s)) && line.length < 60
  }

  const sectionIndexes = []
  lines.forEach((line, idx) => {
    if (isSectionHeading(line) && idx > 0) {
      sectionIndexes.push({ title: line, idx })
    }
  })

  const sections = {}
  sectionIndexes.forEach((section, i) => {
    const start = section.idx + 1
    const end = sectionIndexes[i + 1] ? sectionIndexes[i + 1].idx : lines.length
    const content = lines.slice(start, end).join('\n')
    if (content.trim()) sections[section.title] = content
  })

  const title = lines.find((l, i) =>
    i > 0 && i < 4 &&
    !emailMatch?.[0].includes(l) &&
    !phoneMatch?.[0].includes(l) &&
    !isSectionHeading(l) &&
    l.length < 60
  ) || ""

  return { _meta: { name, title, phone, email }, sections }
}

const THEMES = {
  "Classic Black": "#000000",
  "Navy Blue":     "#1a365d",
  "Dark Green":    "#1a4731",
  "Maroon":        "#742a2a",
  "Purple":        "#44337a",
  "Teal":          "#234e52",
}

export default function ResumeEditor({ resumeText, onClose }) {
  const parsed = parseResumeText(resumeText)
  const [meta, setMeta] = useState(parsed._meta)
  const [sections, setSections] = useState(parsed.sections)
  const [themeColor, setThemeColor] = useState("#000000")
  const [newSectionName, setNewSectionName] = useState("")
  const previewRef = useRef()

  const updateMeta = (key, val) => setMeta(m => ({ ...m, [key]: val }))
  const updateSection = (key, val) => setSections(s => ({ ...s, [key]: val }))
  const deleteSection = (key) => setSections(s => { const u = { ...s }; delete u[key]; return u })
  const addSection = () => {
    if (!newSectionName.trim()) return
    setSections(s => ({ ...s, [newSectionName.trim()]: "" }))
    setNewSectionName("")
  }

  const downloadPDF = () => {
    const content = previewRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              font-family: 'Times New Roman', Times, serif !important;
              font-size: 11px !important;
              line-height: 1.5;
              color: #000;
              background: #fff;
            }
            .resume-wrap { padding: 16mm 18mm; }
            .rv-name { 
              text-align: center; 
              font-size: 20px !important; 
              font-weight: 700; 
              text-transform: uppercase; 
              letter-spacing: 1px; 
              color: #000; 
              font-family: 'Times New Roman', Times, serif !important; 
            }
            .rv-title { 
              text-align: center; 
              font-size: 11px !important; 
              color: #444; 
              margin-top: 2px; 
              font-family: 'Times New Roman', Times, serif !important; 
            }
            .rv-contact { 
              text-align: center; 
              font-size: 10px !important; 
              color: #333; 
              margin: 4px 0 6px; 
              font-family: 'Times New Roman', Times, serif !important; 
            }
            .rv-divider { 
              border: none; 
              border-top: 1.5px solid ${themeColor}; 
              margin: 6px 0; 
            }
            .rv-section-title { 
              font-size: 11px !important; 
              font-weight: 700; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
              margin: 10px 0 4px; 
              color: ${themeColor}; 
              border-bottom: 0.5px solid ${themeColor}; 
              padding-bottom: 2px; 
              font-family: 'Times New Roman', Times, serif !important; 
            }
            .rv-content { 
              font-size: 10px !important; 
              white-space: pre-wrap; 
              color: #222; 
              line-height: 1.6; 
              font-family: 'Times New Roman', Times, serif !important; 
            }
            @page { margin: 0; size: A4; }
            @media print {
              * { font-family: 'Times New Roman', Times, serif !important; }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="resume-wrap">
            ${content}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 800)
  }

  const inputStyle = {
    width: "100%", fontSize: 12, padding: "6px 8px",
    borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)", color: "#f0f0f0",
    fontFamily: "inherit"
  }
  const textareaStyle = { ...inputStyle, resize: "vertical", minHeight: 80 }
  const labelStyle = { fontSize: 11, color: "#888", marginBottom: 3 }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, overflowY: "auto", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#f0f0f0" }}>Edit Resume</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#888" }}>Theme:</span>
            {Object.entries(THEMES).map(([name, color]) => (
              <div
                key={name}
                onClick={() => setThemeColor(color)}
                title={name}
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: color, cursor: "pointer",
                  border: themeColor === color ? "2px solid #a5b4fc" : "2px solid transparent",
                  transition: "border 0.2s"
                }}
              />
            ))}
            <button onClick={downloadPDF} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              ⬇ Download PDF
            </button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>
              Close
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Left — Editor */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Edit Fields</div>

            {[
              { label: "Full Name", key: "name" },
              { label: "Title / Role", key: "title" },
              { label: "Phone", key: "phone" },
              { label: "Email", key: "email" }
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <div style={labelStyle}>{f.label}</div>
                <input value={meta[f.key] || ""} onChange={e => updateMeta(f.key, e.target.value)} style={inputStyle} />
              </div>
            ))}

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "16px 0" }} />

            {Object.keys(sections).length > 0 ? (
              Object.entries(sections).map(([sectionName, content]) => (
                <div key={sectionName} style={{ marginBottom: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 500 }}>{sectionName}</div>
                    <button
                      onClick={() => deleteSection(sectionName)}
                      style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    value={content || ""}
                    onChange={e => updateSection(sectionName, e.target.value)}
                    style={textareaStyle}
                  />
                </div>
              ))
            ) : (
              <div style={{ color: "#555", fontSize: 13 }}>No sections detected.</div>
            )}

            {/* Add new section */}
            <div style={{ marginTop: 16, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Add New Section</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  placeholder="e.g. Volunteer Work"
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={e => e.key === "Enter" && addSection()}
                />
                <button
                  onClick={addSection}
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Right — Preview */}
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", maxHeight: "85vh", overflowY: "auto" }}>
            <div ref={previewRef} style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 11, lineHeight: 1.5, color: "#000", padding: "28px 32px" }}>

              <div className="rv-name" style={{ textAlign: "center", fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#000" }}>{meta.name}</div>
              <div className="rv-title" style={{ textAlign: "center", fontSize: 11, color: "#444", marginTop: 2 }}>{meta.title}</div>
              <div className="rv-contact" style={{ textAlign: "center", fontSize: 10, color: "#333", margin: "4px 0 6px" }}>
                {[meta.phone, meta.email].filter(Boolean).join(" ◇ ")}
              </div>
              <div className="rv-divider" style={{ borderTop: `1.5px solid ${themeColor}`, margin: "6px 0", borderLeft: "none", borderRight: "none", borderBottom: "none" }} />

              {Object.entries(sections).map(([sectionName, content]) => (
                content?.trim() ? (
                  <div key={sectionName}>
                    <div className="rv-section-title" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, margin: "10px 0 4px", color: themeColor, borderBottom: `0.5px solid ${themeColor}`, paddingBottom: 2 }}>
                      {sectionName}
                    </div>
                    <div className="rv-content" style={{ fontSize: 10, whiteSpace: "pre-wrap", color: "#222", lineHeight: 1.6 }}>
                      {content}
                    </div>
                  </div>
                ) : null
              ))}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}