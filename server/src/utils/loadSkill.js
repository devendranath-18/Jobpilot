import fs from "fs";
import path from "path";
const skillsDir = path.join(__dirname, "..", "skills");
/**
 * Loads a SKILL.md file's content by skill folder name.
 * Returns an empty string if the file doesn't exist yet — safe to call
 * even before a skill has been written.
 */
export function loadSkill(skillName) {
    const skillPath = path.join(skillsDir, skillName, "SKILL.md");
    try {
        return fs.readFileSync(skillPath, "utf-8");
    }
    catch (err) {
        return "";
    }
}
//# sourceMappingURL=loadSkill.js.map