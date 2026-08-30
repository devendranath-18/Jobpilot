import fs from "fs";
import mammoth from "mammoth";
import { askGroq } from "../llm/groqClient.js";
import { parseGroqJson } from "../utils/parseGroqJson.js";
const SYSTEM_PROMPT = `You are a resume parser.
Given raw resume text, extract structured information and respond with ONLY valid JSON — no preamble, no markdown code fences, no explanation.

The JSON must match this exact shape:
{
  "candidate_name": string,
  "skills": array of strings (technical + soft skills mentioned),
  "experience": array of objects, each: { "title": string, "company": string, "duration": string, "bullets": array of strings },
  "education": array of strings (degree, institution, year if available),
  "projects": array of strings (project names with a short 1-line description each)
}

If a section is missing from the resume, return an empty array for it. Never fabricate information not present in the text.`;
async function extractTextFromFile(filePath) {
    const ext = filePath.toLowerCase().split(".").pop();
    if (ext === "docx") {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    }
    if (ext === "pdf") {
        const { PDFParse } = await import("pdf-parse");
        const dataBuffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        await parser.destroy();
        return result.text;
    }
    throw new Error(`Unsupported file type: .${ext}. Only .docx and .pdf are supported.`);
}
export async function parseResume(filePath) {
    const rawText = await extractTextFromFile(filePath);
    if (!rawText || rawText.trim().length === 0) {
        throw new Error("No text could be extracted from the resume file.");
    }
    const rawResponse = await askGroq(SYSTEM_PROMPT, rawText);
    return parseGroqJson(rawResponse);
}
//# sourceMappingURL=parseResume.js.map