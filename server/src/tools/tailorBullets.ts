import { askGroq } from "../llm/groqClient.js";
import { parseGroqJson } from "../utils/parseGroqJson.js";
import { loadSkill } from "../utils/loadSkill.js";

export interface TailoredBullets {
  tailored_bullets: string[];
}

function buildSystemPrompt(): string {
  const skillInstructions = loadSkill("resume-tailoring");

  return `You are a resume bullet-point tailoring assistant.

Follow these guidelines strictly:
${skillInstructions}

Given a candidate's original resume bullets and a role title, rewrite the bullets using ONLY the skills, tools, and technologies already present in the original bullets — rephrased with stronger action verbs and JD-aligned terminology where truthful.

The "missing_skills" list is provided for your awareness ONLY — it tells you what NOT to add. Do not incorporate any of these missing skills into the tailored bullets under any circumstance, even if it would make the bullet sound more relevant to the role.
Return the same number of bullets as given in the input.

Respond with ONLY valid JSON, no preamble, no markdown fences:
{
  "tailored_bullets": array of strings
}`;
}

export async function tailorBullets(
  originalBullets: string[],
  missingSkills: string[],
  roleTitle: string
): Promise<TailoredBullets> {
  const userPrompt = JSON.stringify({
    original_bullets: originalBullets,
    missing_skills: missingSkills,
    role_title: roleTitle,
  });

  const rawResponse = await askGroq(buildSystemPrompt(), userPrompt);

  return parseGroqJson<TailoredBullets>(rawResponse);
}