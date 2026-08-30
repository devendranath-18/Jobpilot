export interface ParsedJobDescription {
    role_title: string;
    company_name: string | null;
    seniority: "intern" | "junior" | "mid" | "senior" | "lead" | "unknown";
    required_skills: string[];
    nice_to_have_skills: string[];
    keywords: string[];
}
export declare function parseJobDescription(jdText: string): Promise<ParsedJobDescription>;
//# sourceMappingURL=parseJobDescription.d.ts.map