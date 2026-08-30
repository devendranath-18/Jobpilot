import { runAgent } from "./agentClient.js";
const goal = `
Here is a job description:

"""
We are hiring a Full Stack Developer (Junior level) to join our team at TechNova Solutions.

Responsibilities:
- Build and maintain web applications using React and Node.js
- Work with REST APIs and MySQL databases
- Collaborate with designers and backend engineers

Required Skills:
- JavaScript, React.js, Node.js, Express
- MySQL or PostgreSQL
- Git version control

Nice to have:
- TypeScript experience
- AWS or cloud deployment experience
- Familiarity with CI/CD pipelines
"""

My resume file is located at: ./test-resume.pdf

Please parse the job description, parse my resume, match them, tailor my most recent role's bullet points, write a cover letter, and save the completed application.
`;
async function main() {
    console.log("Starting agent...\n");
    const result = await runAgent(goal);
    console.log("\n===== AGENT FINAL RESPONSE =====");
    console.log(result);
}
main().catch((err) => {
    console.error("Agent error:", err);
});
//# sourceMappingURL=testAgent.js.map