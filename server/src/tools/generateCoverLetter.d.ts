import type { ParsedJobDescription } from "./parseJobDescription.js";
import type { ParsedResume } from "./parseResume.js";
export interface CoverLetterResult {
    cover_letter: string;
}
export declare function generateCoverLetter(parsedJD: ParsedJobDescription, parsedResume: ParsedResume, matchSummary: string): Promise<CoverLetterResult>;
//# sourceMappingURL=generateCoverLetter.d.ts.map