import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const directory = join(import.meta.dirname, "../src/app/styles");
const forbidden =
  /#[\da-f]{3,8}\b|\brgba?\(|font-size:\s*[\d.]+(?:px|rem)|(?:color|background):\s*(?:white|black)\s*;/i;
const violations = [];

for (const filename of readdirSync(directory)) {
  if (!filename.endsWith(".css") || filename === "tokens.css") continue;
  const lines = readFileSync(join(directory, filename), "utf8").split("\n");
  lines.forEach((line, index) => {
    if (forbidden.test(line))
      violations.push(`${filename}:${index + 1}: ${line.trim()}`);
  });
}

if (violations.length) {
  console.error(
    "Use semantic design tokens outside tokens.css:\n" + violations.join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log("Design token usage is consistent.");
}
