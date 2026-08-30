interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

// Common words to ignore when scoring — they'd match everywhere and add noise
const STOP_WORDS = new Set([
  "and", "or", "the", "a", "an", "with", "for", "of", "in", "on", "to",
  "using", "via", "based", "systems", "experience", "familiarity",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Picks the experience entry most relevant to a job description.
 * Required skills are weighted much more heavily than nice-to-have
 * skills, and both are matched as whole phrases (not individual words)
 * to avoid noisy false matches from generic terms like "api" or "test".
 * JD keywords/role title are used only as a low-weight tie-breaker.
 * Falls back to the first entry if nothing scores above 0.
 */
export function selectRelevantExperience(
  experience: ExperienceEntry[],
  requiredSkills: string[],
  niceToHaveSkills: string[],
  jdKeywords: string[],
  jdRoleTitle: string
): ExperienceEntry | null {
  if (!experience || experience.length === 0) return null;
  if (experience.length === 1) return experience[0] ?? null;

  let bestEntry = experience[0];
  let bestScore = -1;

  for (const entry of experience) {
    const entryText = (entry.title + " " + entry.bullets.join(" ")).toLowerCase();

    let score = 0;

    // Required skills: whole-phrase containment, weighted heavily
    for (const skill of requiredSkills) {
      if (skill && entryText.includes(skill.toLowerCase())) {
        score += 5;
      }
    }

    // Nice-to-have skills: whole-phrase containment, weighted lower
    for (const skill of niceToHaveSkills) {
      if (skill && entryText.includes(skill.toLowerCase())) {
        score += 2;
      }
    }

    // Keywords/role title: word-level overlap, lowest weight (tie-breaker only)
    const searchWords = new Set(
      [...jdKeywords, jdRoleTitle].flatMap((term) => tokenize(term))
    );
    const entryWordSet = new Set(tokenize(entryText));
    for (const word of searchWords) {
      if (entryWordSet.has(word)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestEntry ?? null;
}