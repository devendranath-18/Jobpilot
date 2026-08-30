import db from "../db/db.js";
/**
 * Validates that the agent produced genuinely complete data before
 * allowing it to be saved. This guards against a derailed agent run
 * (e.g. a smaller model hallucinating fake tool results instead of
 * calling real tools) silently corrupting the database with empty
 * or NaN data.
 */
function validateInput(input) {
    const errors = [];
    if (!input.role_title || input.role_title.trim().length === 0) {
        errors.push("role_title is missing or empty");
    }
    if (input.match_score === undefined ||
        input.match_score === null ||
        Number.isNaN(input.match_score) ||
        input.match_score < 0 ||
        input.match_score > 1) {
        errors.push(`match_score is invalid: ${input.match_score}`);
    }
    if (!Array.isArray(input.matched_skills)) {
        errors.push("matched_skills is not an array");
    }
    if (!Array.isArray(input.missing_skills)) {
        errors.push("missing_skills is not an array");
    }
    if (!Array.isArray(input.tailored_bullets) || input.tailored_bullets.length === 0) {
        errors.push("tailored_bullets is missing or empty");
    }
    if (!input.cover_letter || input.cover_letter.trim().length < 50) {
        errors.push("cover_letter is missing or suspiciously short");
    }
    if (errors.length > 0) {
        throw new Error(`save_application refused to save incomplete/invalid data:\n- ${errors.join("\n- ")}\n\nThis usually means the agent's tool-calling chain broke somewhere earlier (e.g. a hallucinated tool result instead of a real one). Check the earlier tool outputs.`);
    }
}
export function saveApplication(input) {
    validateInput(input);
    const stmt = db.prepare(`
    INSERT INTO applications
      (company_name, role_title, match_score, matched_skills, missing_skills, tailored_bullets, cover_letter)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    const result = stmt.run(input.company_name, input.role_title, input.match_score, JSON.stringify(input.matched_skills), JSON.stringify(input.missing_skills), JSON.stringify(input.tailored_bullets), input.cover_letter);
    const row = db
        .prepare("SELECT created_at FROM applications WHERE id = ?")
        .get(result.lastInsertRowid);
    return {
        id: Number(result.lastInsertRowid),
        saved_at: row.created_at,
    };
}
//# sourceMappingURL=saveApplication.js.map