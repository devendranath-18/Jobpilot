import { parseResume } from "./tools/parseResume.js";
async function main() {
    const filePath = "./test-resume.pdf"; // change to .pdf if that's what you used
    console.log(`Parsing resume: ${filePath}\n`);
    const result = await parseResume(filePath);
    console.log("Parsed result:");
    console.log(JSON.stringify(result, null, 2));
}
main().catch((err) => {
    console.error("Error:", err);
});
//# sourceMappingURL=testParseResume.js.map