import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsDir = path.join(__dirname, "..", "skills");

/**
 * Loads a SKILL.md file's content by skill folder name.
 * Returns an empty string if the file doesn't exist yet — safe to call
 * even before a skill has been written.
 */
export function loadSkill(skillName: string): string {
  const skillPath = path.join(skillsDir, skillName, "SKILL.md");
  try {
    return fs.readFileSync(skillPath, "utf-8");
  } catch (err) {
    return "";
  }
}