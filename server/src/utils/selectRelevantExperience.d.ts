interface ExperienceEntry {
    title: string;
    company: string;
    duration: string;
    bullets: string[];
}
/**
 * Picks the experience entry most relevant to a job description,
 * using word-level (not phrase-level) overlap between the JD's
 * skills/keywords/role title and the experience entry's text.
 * Falls back to the first entry if nothing scores above 0.
 */
export declare function selectRelevantExperience(experience: ExperienceEntry[], jdSkills: string[], jdKeywords: string[], jdRoleTitle: string): ExperienceEntry | null;
export {};
//# sourceMappingURL=selectRelevantExperience.d.ts.map