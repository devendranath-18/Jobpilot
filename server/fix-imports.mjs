import fs from "fs";
import path from "path";

const srcDir = "./src";

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf8");
      const fixed = content.replace(
        /from\s+(["'])(\.\.?\/[^"']+?)(?<!\.js)\1/g,
        (match, quote, importPath) => `from ${quote}${importPath}.js${quote}`
      );
      if (fixed !== content) {
        fs.writeFileSync(fullPath, fixed, "utf8");
        console.log("Fixed:", fullPath);
      }
    }
  }
}

walk(srcDir);