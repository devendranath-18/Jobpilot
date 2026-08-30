import { askGroq } from "../llm/groqClient.js";
import { parseGroqJson } from "../utils/parseGroqJson.js";
import { loadSkill } from "../utils/loadSkill.js";
function buildSystemPrompt() {
    const skillInstructions = loadSkill("cover-letter-writing");
    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    return `You are a cover letter writing assistant.

Today's date is: ${today}

Follow these guidelines strictly:
${skillInstructions}

Given a parsed job description, a parsed resume, and a match summary, write a complete, professionally formatted cover letter draft including all required structural elements (sender info, date, recipient block, subject line, salutation, body, closing).

Respond with ONLY valid JSON, no preamble, no markdown fences:
{
  "cover_letter": string (the full letter text, including all formatting elements, with appropriate line breaks between sections)
}`;
}
export async function generateCoverLetter(parsedJD, parsedResume, matchSummary) {
    const userPrompt = JSON.stringify({
        job_description: parsedJD,
        resume: parsedResume,
        match_summary: matchSummary,
    });
    const rawResponse = await askGroq(buildSystemPrompt(), userPrompt);
    return parseGroqJson(rawResponse);
}
//# sourceMappingURL=generateCoverLetter.js.map