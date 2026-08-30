import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { parseJobDescription } from "./tools/parseJobDescription.js";
import { parseResume } from "./tools/parseResume.js";
import { matchResume } from "./tools/matchResume.js";
import { tailorBullets } from "./tools/tailorBullets.js";
import { generateCoverLetter } from "./tools/generateCoverLetter.js";
import { saveApplication } from "./tools/saveApplication.js";

const server = new McpServer({
  name: "jobpilot-mcp-server",
  version: "1.0.0",
});

// Helper to wrap any result as MCP's expected text-content format
function toMcpResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

server.tool(
  "parse_job_description",
  "Extracts structured info (role, skills, seniority) from raw job description text.",
  { jd_text: z.string().describe("The raw pasted job description text") },
  async ({ jd_text }) => toMcpResult(await parseJobDescription(jd_text))
);

server.tool(
  "parse_resume",
  "Extracts structured info (skills, experience, education) from a resume file on disk (.docx or .pdf).",
  { file_path: z.string().describe("Absolute or relative path to the resume file") },
  async ({ file_path }) => toMcpResult(await parseResume(file_path))
);

server.tool(
  "match_resume",
  "Compares a parsed job description against a parsed resume and returns a match score, matched/missing skills, and a summary.",
  {
    parsed_jd: z.any().describe("Output of parse_job_description"),
    parsed_resume: z.any().describe("Output of parse_resume"),
  },
  async ({ parsed_jd, parsed_resume }) =>
    toMcpResult(await matchResume(parsed_jd, parsed_resume))
);

server.tool(
  "tailor_bullets",
  "Rewrites resume bullet points to better mirror a target job description's language.",
  {
    original_bullets: z.array(z.string()),
    missing_skills: z.array(z.string()),
    role_title: z.string(),
  },
  async ({ original_bullets, missing_skills, role_title }) =>
    toMcpResult(await tailorBullets(original_bullets, missing_skills, role_title))
);

server.tool(
  "generate_cover_letter",
  "Drafts a tailored cover letter given a parsed job description, parsed resume, and match summary.",
  {
    parsed_jd: z.any(),
    parsed_resume: z.any(),
    match_summary: z.string(),
  },
  async ({ parsed_jd, parsed_resume, match_summary }) =>
    toMcpResult(await generateCoverLetter(parsed_jd, parsed_resume, match_summary))
);

server.tool(
  "save_application",
  "Saves a completed application analysis (match score, tailored bullets, cover letter) to the database.",
  {
    company_name: z.string().nullable(),
    role_title: z.string(),
    match_score: z.number(),
    matched_skills: z.array(z.string()),
    missing_skills: z.array(z.string()),
    tailored_bullets: z.array(z.string()),
    cover_letter: z.string(),
  },
  async (input) => toMcpResult(saveApplication(input))
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});