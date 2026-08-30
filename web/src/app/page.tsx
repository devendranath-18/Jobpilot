"use client";

import { useState, useRef, useEffect } from "react";
import { Space_Grotesk, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const body = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

const WAYPOINTS: { key: string; label: string }[] = [
  { key: "parse_job_description", label: "Parse JD" },
  { key: "parse_resume", label: "Parse resume" },
  { key: "match_resume", label: "Match skills" },
  { key: "tailor_bullets", label: "Tailor bullets" },
  { key: "generate_cover_letter", label: "Write letter" },
  { key: "save_application", label: "Save application" },
];

interface ToolStep {
  tool: string;
  status: "start" | "done" | "error";
}

export default function Home() {
  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<ToolStep[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setFormatMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function statusFor(key: string): "idle" | "start" | "done" | "error" {
    const step = steps.find((s) => s.tool === key);
    return step ? step.status : "idle";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSteps([]);

    if (!jdText.trim() || !resumeFile) {
      setError("A flight plan needs both a job description and a resume.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("jd_text", jdText);
      formData.append("resume", resumeFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.body) throw new Error("No response stream received.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.type === "progress") {
            setSteps((prev) => {
              const idx = prev.findIndex((s) => s.tool === payload.tool);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { tool: payload.tool, status: payload.status };
                return updated;
              }
              return [...prev, { tool: payload.tool, status: payload.status }];
            });
          } else if (payload.type === "complete") {
            setResult(payload.result);
          } else if (payload.type === "error") {
            setError(payload.error);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "The flight was aborted before landing.");
    } finally {
      setLoading(false);
    }
  }

  function downloadTxt() {
    if (!result?.coverLetter) return;
    const blob = new Blob([result.coverLetter], { type: "text/plain" });
    triggerDownload(blob, "cover-letter.txt");
  }

  function downloadPdf() {
    if (!result?.coverLetter) return;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 56;
    const maxWidth = 500;
    const lines = doc.splitTextToSize(result.coverLetter, maxWidth);
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(lines, margin, margin);
    doc.save("cover-letter.pdf");
  }

  async function downloadDocx() {
    if (!result?.coverLetter) return;
    const paragraphs = result.coverLetter
      .split("\n")
      .map((line: string) => new Paragraph({ children: [new TextRun(line)] }));
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    triggerDownload(blob, "cover-letter.docx");
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const scorePct = result?.match ? Math.round(result.match.match_score * 100) : null;
  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = scorePct !== null ? gaugeCircumference * (1 - scorePct / 100) : gaugeCircumference;

  return (
    <main
      className={`${display.variable} ${mono.variable} ${body.variable} min-h-screen`}
      style={{ background: "var(--ink)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* Header */}
        <header className="mb-12 flex items-baseline justify-between border-b pb-6" style={{ borderColor: "var(--panel-line)" }}>
          <div>
            <h1
              className="text-2xl tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              JOBPILOT
            </h1>
            <p
              className="text-xs uppercase tracking-[0.2em] mt-1"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              Flight deck for your job application
            </p>
          </div>
          <span
            className="text-xs px-3 py-1 rounded-full border"
            style={{ borderColor: "var(--panel-line)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {loading ? "IN FLIGHT" : result ? "LANDED" : "GROUNDED"}
          </span>
        </header>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Flight plan form */}
          <section className="md:col-span-5">
            <h2
              className="text-xs uppercase tracking-[0.2em] mb-4"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              01 · Flight plan
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-muted)" }}>
                  Job description
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={9}
                  placeholder="Paste the full job description here…"
                  className="w-full rounded-md p-3 text-sm outline-none transition"
                  style={{
                    background: "var(--panel)",
                    border: "1px solid var(--panel-line)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyan)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--panel-line)")}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-muted)" }}>
                  Resume (.pdf or .docx)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-medium py-3 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "var(--amber)",
                  color: "var(--ink)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                }}
              >
                {loading ? "ANALYZING…" : "SUBMIT FLIGHT PLAN"}
              </button>
            </form>

            {error && (
              <div
                className="mt-5 p-4 rounded-md text-sm"
                style={{ background: "rgba(226,102,90,0.1)", border: "1px solid var(--danger)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}
          </section>

          {/* Route / progress panel */}
          <section className="md:col-span-7">
            <h2
              className="text-xs uppercase tracking-[0.2em] mb-4"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              02 · Route
            </h2>
            <div
              className="rounded-lg p-6"
              style={{ background: "var(--panel)", border: "1px solid var(--panel-line)", minHeight: 260 }}
            >
              {steps.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Awaiting flight plan.
                </p>
              ) : (
                <ol className="relative pl-2">
                  {WAYPOINTS.map((wp, i) => {
                    const status = statusFor(wp.key);
                    const color =
                      status === "done" ? "var(--cyan)" : status === "start" ? "var(--amber)" : "var(--panel-line)";
                    return (
                      <li key={wp.key} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                        {i < WAYPOINTS.length - 1 && (
                          <span
                            className="absolute left-[7px] top-4 w-px"
                            style={{ height: "calc(100% - 8px)", background: "var(--panel-line)" }}
                          />
                        )}
                        <span
                          className="mt-0.5 w-4 h-4 rounded-full shrink-0 relative z-10"
                          style={{
                            background: color,
                            animation: status === "start" ? "blip 1.4s infinite" : undefined,
                          }}
                        />
                        <div>
                          <div
                            className="text-xs"
                            style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: status === "idle" ? "var(--text-muted)" : "var(--text-primary)" }}
                          >
                            {wp.label}
                            {status === "done" && " — complete"}
                            {status === "start" && " — in progress"}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>

        {/* Results */}
        {result && (
          <section className="mt-14 space-y-6">
            <h2
              className="text-xs uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
            >
              03 · Debrief
            </h2>

            {/* Match gauge + skills */}
            {result.match && (
              <div
                className="rounded-lg p-6 grid md:grid-cols-[auto_1fr] gap-6 items-center"
                style={{ background: "var(--panel)", border: "1px solid var(--panel-line)" }}
              >
                <div className="relative w-32 h-32 shrink-0 mx-auto">
                  <svg width="128" height="128" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r={gaugeRadius} fill="none" stroke="var(--panel-line)" strokeWidth="10" />
                    <circle
                      cx="64"
                      cy="64"
                      r={gaugeRadius}
                      fill="none"
                      stroke="var(--amber)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={gaugeOffset}
                      transform="rotate(-90 64 64)"
                      style={{ transition: "stroke-dashoffset 0.8s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
                      {scorePct}%
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
                    >
                      Match
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                    {result.match.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {result.match.matched_skills?.map((s: string) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          fontFamily: "var(--font-mono)",
                          background: "rgba(95,184,199,0.12)",
                          color: "var(--cyan)",
                          border: "1px solid rgba(95,184,199,0.3)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {result.match.missing_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.match.missing_skills.map((s: string) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            fontFamily: "var(--font-mono)",
                            background: "rgba(226,102,90,0.08)",
                            color: "var(--danger)",
                            border: "1px solid rgba(226,102,90,0.25)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tailored bullets */}
            {result.tailoredBullets && (
              <div className="rounded-lg p-6" style={{ background: "var(--panel)", border: "1px solid var(--panel-line)" }}>
                <h3 className="text-sm font-medium mb-3">Tailored bullets</h3>
                <ul className="space-y-2">
                  {result.tailoredBullets.map((bullet: string, i: number) => (
                    <li key={i} className="text-sm flex gap-3" style={{ color: "var(--text-primary)" }}>
                      <span style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>—</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cover letter */}
            {result.coverLetter && (
              <div className="rounded-lg p-6" style={{ background: "var(--panel)", border: "1px solid var(--panel-line)" }}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">Cover letter</h3>
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setFormatMenuOpen((v) => !v)}
                      className="text-xs px-3 py-1.5 rounded"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: "var(--amber)",
                        color: "var(--ink)",
                      }}
                    >
                      DOWNLOAD ▾
                    </button>
                    {formatMenuOpen && (
                      <div
                        className="absolute right-0 mt-1 rounded-md overflow-hidden z-10"
                        style={{ background: "var(--ink)", border: "1px solid var(--panel-line)", minWidth: 120 }}
                      >
                        {[
                          { label: "PDF", fn: downloadPdf },
                          { label: "DOCX", fn: downloadDocx },
                          { label: "TXT", fn: downloadTxt },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => {
                              opt.fn();
                              setFormatMenuOpen(false);
                            }}
                            className="block w-full text-left text-xs px-3 py-2 transition"
                            style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--panel)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {result.coverLetter}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}