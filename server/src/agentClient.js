import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";
// line 5 in agentClient.ts
import { selectRelevantExperience } from "./utils/selectRelevantExperience.js";
dotenv.config();
const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const groq = new Groq({ apiKey });
// Converts an MCP tool definition into the JSON schema shape Groq's
// tool-calling API expects.
function mcpToolToGroqTool(tool) {
    return {
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
        },
    };
}
export async function runAgent(goalPrompt, onProgress) {
    // Spawn the MCP server as a subprocess and connect to it over stdio
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", "src/mcpServer.ts"],
    });
    const client = new Client({ name: "jobpilot-agent", version: "1.0.0" });
    await client.connect(transport);
    const { tools } = await client.listTools();
    const groqTools = tools.map(mcpToolToGroqTool);
    const messages = [
        {
            role: "system",
            content: "You are an agent that helps prepare job applications. You MUST complete ALL SIX of these steps, in order, using the real tools provided — do not skip any: (1) parse_job_description, (2) parse_resume, (3) match_resume, (4) tailor_bullets, (5) generate_cover_letter, (6) save_application. The task is NOT complete until save_application has been called successfully — this is the final, required step, not optional. NEVER write code, pseudocode, or simulate what a tool would return in your text response. NEVER generate Python or any other code. Only call the real tools provided to you, one at a time, using the actual results from previous tool calls as inputs to later ones. After generate_cover_letter succeeds, your very next action MUST be to call save_application — do not respond with a text summary until save_application has actually been called and succeeded.",
        },
        { role: "user", content: goalPrompt },
    ];
    const MAX_STEPS = 10;
    // Cache of real tool outputs, keyed by tool name, so we can substitute
    // faithful data back in even if the LLM mis-transcribes large JSON args.
    const resultCache = {};
    for (let step = 0; step < MAX_STEPS; step++) {
        const completion = await groq.chat.completions.create({
            model,
            messages,
            tools: groqTools,
            tool_choice: "auto",
            temperature: 0.2,
        });
        const choice = completion.choices[0];
        const message = choice?.message;
        if (!message)
            throw new Error("No message returned from Groq");
        if (message.tool_calls && message.tool_calls.length > 0) {
            messages.push(message);
            for (const toolCall of message.tool_calls) {
                const toolName = toolCall.function.name;
                let args = JSON.parse(toolCall.function.arguments);
                // Substitute cached real outputs for known large-payload params,
                // instead of trusting the LLM's retyped version.
                if ("parsed_jd" in args && resultCache["parse_job_description"]) {
                    args.parsed_jd = resultCache["parse_job_description"];
                }
                if ("parsed_resume" in args && resultCache["parse_resume"]) {
                    args.parsed_resume = resultCache["parse_resume"];
                }
                if ("match_summary" in args && resultCache["match_resume"]) {
                    args.match_summary = resultCache["match_resume"].summary;
                }
                if (toolName === "tailor_bullets") {
                    console.log("  [debug] tailor_bullets override check:");
                    console.log("  [debug] parse_resume cached?", !!resultCache["parse_resume"]);
                    console.log("  [debug] parse_job_description cached?", !!resultCache["parse_job_description"]);
                    if (resultCache["parse_resume"]) {
                        const jd = resultCache["parse_job_description"];
                        console.log("  [debug] jd required_skills:", jd?.required_skills);
                        console.log("  [debug] jd nice_to_have_skills:", jd?.nice_to_have_skills);
                        const relevantEntry = selectRelevantExperience(resultCache["parse_resume"].experience || [], [...(jd?.required_skills || []), ...(jd?.nice_to_have_skills || [])], jd?.keywords || [], jd?.role_title || "");
                        console.log("  [debug] selected entry company:", relevantEntry?.company);
                        if (relevantEntry?.bullets) {
                            args.original_bullets = relevantEntry.bullets;
                        }
                        if (resultCache["match_resume"]) {
                            args.missing_skills = resultCache["match_resume"].missing_skills;
                        }
                    }
                }
                if (toolName === "save_application" && resultCache["match_resume"]) {
                    args.match_score = resultCache["match_resume"].match_score;
                    args.matched_skills = resultCache["match_resume"].matched_skills;
                    args.missing_skills = resultCache["match_resume"].missing_skills;
                }
                if (toolName === "save_application" && resultCache["tailor_bullets"]) {
                    args.tailored_bullets = resultCache["tailor_bullets"].tailored_bullets;
                }
                if (toolName === "save_application" && resultCache["generate_cover_letter"]) {
                    args.cover_letter = resultCache["generate_cover_letter"].cover_letter;
                }
                console.log(`  → calling tool: ${toolName}`);
                onProgress?.({ tool: toolName, status: "start" });
                const result = await client.callTool({ name: toolName, arguments: args });
                const resultText = Array.isArray(result.content) && result.content[0]?.type === "text"
                    ? result.content[0].text
                    : JSON.stringify(result);
                // Cache the real, faithful output for later substitution
                // Cache the real, faithful output for later substitution
                try {
                    resultCache[toolName] = JSON.parse(resultText);
                }
                catch {
                    console.log(`  [ERROR] ${toolName} did not return valid JSON. Raw response:`);
                    console.log(`  ${resultText}`);
                    resultCache[toolName] = resultText;
                }
                onProgress?.({ tool: toolName, status: "done" });
                // IMPORTANT: don't feed the full JSON blob back into conversation
                // history — it accumulates across steps and eventually exceeds
                // the per-request token limit. The real data lives in resultCache
                // and gets substituted into arguments before each real tool call
                // anyway, so the LLM only needs a short acknowledgment to know
                // the step succeeded and move on to the next tool.
                const shortAck = `${toolName} completed successfully.`;
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: shortAck,
                });
            }
            continue;
        }
        await client.close();
        const match = resultCache["match_resume"];
        const tailoredBullets = resultCache["tailor_bullets"]?.tailored_bullets;
        const coverLetter = resultCache["generate_cover_letter"]?.cover_letter;
        const savedApplication = resultCache["save_application"];
        // Safety net: if the model finished without calling save_application,
        // but we have everything needed, save it ourselves rather than failing.
        if (match && tailoredBullets && coverLetter && !savedApplication) {
            console.log("  [safety-net] Model skipped save_application — saving directly.");
            const { saveApplication } = await import("./tools/saveApplication.js");
            const jd = resultCache["parse_job_description"];
            const forcedSave = saveApplication({
                company_name: jd?.company_name || null,
                role_title: jd?.role_title || "Unknown Role",
                match_score: match.match_score,
                matched_skills: match.matched_skills,
                missing_skills: match.missing_skills,
                tailored_bullets: tailoredBullets,
                cover_letter: coverLetter,
            });
            resultCache["save_application"] = forcedSave;
        }
        // Fail loudly instead of silently returning incomplete data that
        // would render as NaN%/blank fields on the frontend.
        const missingParts = [];
        if (!match || typeof match.match_score !== "number" || Number.isNaN(match.match_score)) {
            missingParts.push("match_resume result");
        }
        if (!tailoredBullets || tailoredBullets.length === 0) {
            missingParts.push("tailor_bullets result");
        }
        if (!coverLetter) {
            missingParts.push("generate_cover_letter result");
        }
        if (!savedApplication) {
            missingParts.push("save_application result");
        }
        if (missingParts.length > 0) {
            throw new Error(`Agent finished but some steps didn't complete properly: ${missingParts.join(", ")}. This usually means a tool call failed silently or the model skipped a step. Please try again.`);
        }
        return {
            summary: message.content || "(no response)",
            match,
            tailoredBullets,
            coverLetter,
            savedApplication,
        };
    }
    await client.close();
    throw new Error("Agent exceeded max steps without finishing.");
}
//# sourceMappingURL=agentClient.js.map