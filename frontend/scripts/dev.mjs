import { spawn } from "node:child_process";
const args = process.argv.slice(2);
const host = args[args.indexOf("--host") + 1];
const port = args[args.indexOf("--port") + 1];
const command = [
  "dev",
  ...(host && host !== "--port" ? ["-H", host] : []),
  ...(port && port !== "--strictPort" ? ["-p", port] : []),
];
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", ...command],
  { stdio: "inherit" },
);
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
child.on("exit", (code) => process.exit(code || 0));
