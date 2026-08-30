import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing. Check your .env file.");
}
const groq = new Groq({ apiKey });
/**
 * Sends a prompt to Groq and returns the raw text response.
 * Used by every tool that needs an LLM call.
 */
export async function askGroq(systemPrompt, userPrompt) {
    const completion = await groq.chat.completions.create({
        model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
    });
    const text = completion.choices[0]?.message?.content;
    if (!text) {
        throw new Error("Groq returned an empty response.");
    }
    return text;
}
//# sourceMappingURL=groqClient.js.map