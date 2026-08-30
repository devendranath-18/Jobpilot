// Common words to ignore when scoring — they'd match everywhere and add noise
const STOP_WORDS = new Set([
    "and", "or", "the", "a", "an", "with", "for", "of", "in", "on", "to",
    "using", "via", "based", "systems", "experience", "familiarity",
]);
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}
/**
 * Picks the experience entry most relevant to a job description,
 * using word-level (not phrase-level) overlap between the JD's
 * skills/keywords/role title and the experience entry's text.
 * Falls back to the first entry if nothing scores above 0.
 */
export function selectRelevantExperience(experience, jdSkills, jdKeywords, jdRoleTitle) {
    if (!experience || experience.length === 0)
        return null;
    if (experience.length === 1)
        return experience[0] ?? null;
    // Break every JD term down into individual meaningful words,
    // not whole phrases — this is what makes matching realistic.
    const searchWords = new Set([...jdSkills, ...jdKeywords, jdRoleTitle].flatMap((term) => tokenize(term)));
    let bestEntry = experience[0];
    let bestScore = -1;
    for (const entry of experience) {
        const entryWords = tokenize(entry.title + " " + entry.bullets.join(" "));
        const entryWordSet = new Set(entryWords);
        let score = 0;
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
//# sourceMappingURL=selectRelevantExperience.js.map