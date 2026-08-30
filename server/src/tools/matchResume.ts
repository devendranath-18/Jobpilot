import { askGroq } from "../llm/groqClient.js";
import type { ParsedJobDescription } from "./parseJobDescription.js";
import type { ParsedResume } from "./parseResume.js";
import { parseGroqJson } from "../utils/parseGroqJson.js";
import { loadSkill } from "../utils/loadSkill.js";

export interface MatchResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  summary: string;
}

/**
 * Normalizes a skill string for reliable comparison:
 * lowercase, strip punctuation/spacing variations.
 */
function normalize(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/[.\-_/]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Deterministic exact-match check (case/punctuation-insensitive).
 * This is 100% reliable, unlike asking an LLM to compare two long lists.
 */
function computeExactMatches(
  jdSkills: string[],
  resumeSkills: string[]
): { exactMatched: string[]; stillMissing: string[] } {
  const normalizedResumeSkills = resumeSkills.map(normalize);

  const exactMatched: string[] = [];
  const stillMissing: string[] = [];

  for (const jdSkill of jdSkills) {
    const normalizedJdSkill = normalize(jdSkill);
    const isExactMatch = normalizedResumeSkills.some(
      (resumeSkill) =>
        resumeSkill === normalizedJdSkill ||
        resumeSkill.includes(normalizedJdSkill) ||
        normalizedJdSkill.includes(resumeSkill)
    );

    if (isExactMatch) {
      exactMatched.push(jdSkill);
    } else {
      stillMissing.push(jdSkill);
    }
  }

  return { exactMatched, stillMissing };
}

function buildSystemPrompt(): string {
  const skillInstructions = loadSkill("ats-optimization");

  return `You are a resume-to-job matching assistant.
CRITICAL: Your response must be raw, valid JSON only. Never include comments (no // or /* */), explanations, or annotations inside the JSON structure itself — only the JSON values.
A deterministic exact-match check has ALREADY been run in code and found some matches reliably.
Your job is ONLY to review the REMAINING "still missing" skills and identify near-matches based on the candidate's actual experience and projects (e.g. "Next.js" experience reasonably counts toward a "React" requirement). Do NOT re-evaluate skills already confirmed as exact matches — trust that list completely.

${skillInstructions ? `Additional guidelines:\n${skillInstructions}\n` : ""}

Respond with ONLY valid JSON, no preamble, no markdown fences:
{
  "near_matches": array of strings (skills from the "still_missing" list that you believe the candidate effectively has, based on related experience/projects — be conservative, only include genuine near-matches),
  "summary": a 1-2 sentence plain-English assessment of the candidate's overall fit for this role
}`;
}

export async function matchResume(
  parsedJD: ParsedJobDescription,
  parsedResume: ParsedResume
): Promise<MatchResult> {
  const allJdSkills = [
    ...parsedJD.required_skills,
    ...parsedJD.nice_to_have_skills,
  ];

  // Step 1: reliable, deterministic exact matching in code
  const { exactMatched, stillMissing } = computeExactMatches(
    allJdSkills,
    parsedResume.skills
  );

  // Step 2: let the LLM only judge the harder "near match" cases
  // among skills that didn't exact-match, plus write the summary
  const userPrompt = JSON.stringify({
    job_description: parsedJD,
    resume: parsedResume,
    already_matched_exactly: exactMatched,
    still_missing: stillMissing,
  });

  const rawResponse = await askGroq(buildSystemPrompt(), userPrompt);
  const llmResult = parseGroqJson<{ near_matches: string[]; summary: string }>(
    rawResponse
  );

  const nearMatches = llmResult.near_matches || [];

  // Step 3: merge deterministic + LLM-judged results
  const matchedSkills = [...exactMatched, ...nearMatches];
  const missingSkills = stillMissing.filter(
    (skill) => !nearMatches.includes(skill)
  );

  // Step 4: compute score in code too — weighted toward required_skills
  const requiredSet = new Set(parsedJD.required_skills.map(normalize));
  const matchedRequiredCount = matchedSkills.filter((s) =>
    requiredSet.has(normalize(s))
  ).length;
  const totalRequiredCount = parsedJD.required_skills.length || 1;

  const requiredScore = matchedRequiredCount / totalRequiredCount;
  const overallScore =
    matchedSkills.length / (allJdSkills.length || 1);

  // Weight required skills more heavily (70/30 split)
  const matchScore = Math.round((requiredScore * 0.7 + overallScore * 0.3) * 100) / 100;

  return {
    match_score: matchScore,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    summary: llmResult.summary,
  };
}