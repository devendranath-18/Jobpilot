export interface SaveApplicationInput {
    company_name: string | null;
    role_title: string;
    match_score: number;
    matched_skills: string[];
    missing_skills: string[];
    tailored_bullets: string[];
    cover_letter: string;
}
export interface SaveApplicationResult {
    id: number;
    saved_at: string;
}
export declare function saveApplication(input: SaveApplicationInput): SaveApplicationResult;
//# sourceMappingURL=saveApplication.d.ts.map