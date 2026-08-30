import { parseJobDescription } from "./tools/parseJobDescription.js";
import { parseResume } from "./tools/parseResume.js";
import { matchResume } from "./tools/matchResume.js";
const sampleJD = `
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
`;
async function main() {
    console.log("Step 1: Parsing job description...");
    const jd = await parseJobDescription(sampleJD);
    console.log("Step 2: Parsing resume...");
    const resume = await parseResume("./test-resume.pdf");
    console.log("Step 3: Matching resume against JD...\n");
    const match = await matchResume(jd, resume);
    console.log("Match result:");
    console.log(JSON.stringify(match, null, 2));
}
main().catch((err) => {
    console.error("Error:", err);
});
//# sourceMappingURL=testMatchResume.js.map