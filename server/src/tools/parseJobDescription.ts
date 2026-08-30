import { askGroq } from "../llm/groqClient.js";
import { parseGroqJson } from "../utils/parseGroqJson.js";

export interface ParsedJobDescription {
  role_title: string;
  company_name: string | null;
  seniority: "intern" | "junior" | "mid" | "senior" | "lead" | "unknown";
  required_skills: string[];
  nice_to_have_skills: string[];
  keywords: string[];
}

const SYSTEM_PROMPT = `You are a job description parser. 
Given raw job description text, extract structured information and respond with ONLY valid JSON — no preamble, no markdown code fences, no explanation.

The JSON must match this exact shape:
{
  "role_title": string,
  "company_name": string or null if not mentioned,
  "seniority": one of "intern" | "junior" | "mid" | "senior" | "lead" | "unknown",
  "required_skills": array of strings (technical skills explicitly required),
  "nice_to_have_skills": array of strings (skills mentioned as bonus/preferred),
  "keywords": array of strings (other notable keywords: tools, methodologies, domains)
}`;

export async function parseJobDescription(
  jdText: string
): Promise<ParsedJobDescription> {
  const rawResponse = await askGroq(SYSTEM_PROMPT, jdText);
  return parseGroqJson<ParsedJobDescription>(rawResponse);
}