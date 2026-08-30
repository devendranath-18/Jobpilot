import type { ParsedJobDescription } from "./parseJobDescription.js";
import type { ParsedResume } from "./parseResume.js";
export interface MatchResult {
    match_score: number;
    matched_skills: string[];
    missing_skills: string[];
    summary: string;
}
export declare function matchResume(parsedJD: ParsedJobDescription, parsedResume: ParsedResume): Promise<MatchResult>;
//# sourceMappingURL=matchResume.d.ts.map