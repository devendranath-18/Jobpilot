import { parseJobDescription } from "./tools/parseJobDescription.js";
import { parseResume } from "./tools/parseResume.js";
import { matchResume } from "./tools/matchResume.js";
import { tailorBullets } from "./tools/tailorBullets.js";
import { generateCoverLetter } from "./tools/generateCoverLetter.js";
import { saveApplication } from "./tools/saveApplication.js";

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
  console.log("1. Parsing job description...");
  const jd = await parseJobDescription(sampleJD);

  console.log("2. Parsing resume...");
  const resume = await parseResume("./test-resume.pdf");

  console.log("3. Matching resume against JD...");
  const match = await matchResume(jd, resume);

  console.log("4. Tailoring bullets from most recent role...");
  const latestRoleBullets = resume.experience[0]?.bullets || [];
  const tailored = await tailorBullets(
    latestRoleBullets,
    match.missing_skills,
    jd.role_title
  );

  console.log("5. Generating cover letter...\n");
  const coverLetter = await generateCoverLetter(jd, resume, match.summary);

  console.log("===== MATCH RESULT =====");
  console.log(JSON.stringify(match, null, 2));

  console.log("\n===== TAILORED BULLETS =====");
  console.log(JSON.stringify(tailored, null, 2));

  console.log("\n===== COVER LETTER =====");
  console.log(coverLetter.cover_letter);

  console.log("\n6. Saving application...");
  const saved = saveApplication({
    company_name: jd.company_name,
    role_title: jd.role_title,
    match_score: match.match_score,
    matched_skills: match.matched_skills,
    missing_skills: match.missing_skills,
    tailored_bullets: tailored.tailored_bullets,
    cover_letter: coverLetter.cover_letter,
  });

  console.log("Saved:", saved);
}

main().catch((err) => {
  console.error("Error:", err);
});