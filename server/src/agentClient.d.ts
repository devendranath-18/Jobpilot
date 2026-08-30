export type AgentProgressEvent = {
    tool: string;
    status: "start" | "done" | "error";
};
export declare function runAgent(goalPrompt: string, onProgress?: (event: AgentProgressEvent) => void): Promise<{
    summary: string;
    match: any;
    tailoredBullets: string[] | null;
    coverLetter: string | null;
    savedApplication: any;
}>;
//# sourceMappingURL=agentClient.d.ts.map