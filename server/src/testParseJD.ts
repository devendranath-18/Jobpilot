import { parseJobDescription } from "./tools/parseJobDescription.js";

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
  console.log("Parsing sample job description...\n");
  const result = await parseJobDescription(sampleJD);
  console.log("Parsed result:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Error:", err);
});