export interface ParsedResume {
    candidate_name: string;
    skills: string[];
    experience: {
        title: string;
        company: string;
        duration: string;
        bullets: string[];
    }[];
    education: string[];
    projects: string[];
}
export declare function parseResume(filePath: string): Promise<ParsedResume>;
//# sourceMappingURL=parseResume.d.ts.map