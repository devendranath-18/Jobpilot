import { askGroq } from "../llm/groqClient.js";
import type { ParsedJobDescription } from "./parseJobDescription.js";
import type { ParsedResume } from "./parseResume.js";
import { parseGroqJson } from "../utils/parseGroqJson.js";
import { loadSkill } from "../utils/loadSkill.js";

export interface CoverLetterResult {
  cover_letter: string;
}

function buildSystemPrompt(): string {
  const skillInstructions = loadSkill("cover-letter-writing");
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are a cover letter writing assistant.

Today's date is: ${today}

Follow these guidelines strictly:
${skillInstructions}

CRITICAL — DO NOT FABRICATE:
- Only reference facts, products, initiatives, or company details that are explicitly present in the job_description text provided to you. Never invent specifics about the company (e.g. "your recent platform rollout", "your award-winning X") that are not literally stated in the JD.
- Only reference metrics, percentages, or quantified outcomes (e.g. "reduced latency by 30%") that are explicitly present in the resume data provided. If no specific number exists for an achievement, describe the outcome qualitatively instead of inventing a figure.
- If you are unsure whether a detail was actually provided, leave it out rather than guessing or embellishing.

Given a parsed job description, a parsed resume, and a match summary, write a complete, professionally formatted cover letter draft including all required structural elements (sender info, date, recipient block, subject line, salutation, body, closing).

Respond with ONLY valid JSON, no preamble, no markdown fences:
{
  "cover_letter": string (the full letter text, including all formatting elements, with appropriate line breaks between sections)
}`;
}

export async function generateCoverLetter(
  parsedJD: ParsedJobDescription,
  parsedResume: ParsedResume,
  matchSummary: string
): Promise<CoverLetterResult> {
  const userPrompt = JSON.stringify({
    job_description: parsedJD,
    resume: parsedResume,
    match_summary: matchSummary,
  });

  const rawResponse = await askGroq(buildSystemPrompt(), userPrompt);

  return parseGroqJson<CoverLetterResult>(rawResponse);
}