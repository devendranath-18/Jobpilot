import { askGroq } from "./llm/groqClient.js";
async function main() {
    console.log("Sending test message to Groq...");
    const response = await askGroq("You are a helpful assistant.", "Reply with exactly one sentence confirming you're working.");
    console.log("Groq replied:");
    console.log(response);
}
main().catch((err) => {
    console.error("Error calling Groq:", err);
});
//# sourceMappingURL=testGroq.js.map