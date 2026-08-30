function sanitizeControlCharsInStrings(input) {
    let result = "";
    let inString = false;
    let escapeNext = false;
    for (const char of input) {
        if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
        }
        if (char === "\\") {
            result += char;
            escapeNext = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            result += char;
            continue;
        }
        if (inString && char === "\n") {
            result += "\\n";
            continue;
        }
        if (inString && char === "\r") {
            result += "\\r";
            continue;
        }
        if (inString && char === "\t") {
            result += "\\t";
            continue;
        }
        result += char;
    }
    return result;
}
export function parseGroqJson(rawResponse) {
    const withoutFences = rawResponse
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
    // Strip JS-style comments some models mistakenly add inside JSON
    // (e.g. "value" /* explanation */ ,) — invalid JSON syntax otherwise.
    const withoutComments = withoutFences
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
    const sanitized = sanitizeControlCharsInStrings(withoutComments);
    try {
        return JSON.parse(sanitized);
    }
    catch (err) {
        throw new Error(`Failed to parse JSON from Groq response even after sanitizing.\nRaw response was:\n${rawResponse}`);
    }
}
//# sourceMappingURL=parseGroqJson.js.map