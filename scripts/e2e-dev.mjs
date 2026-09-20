/**
 * E2E dev server with a throwaway in-memory MongoDB.
 *
 * Used by playwright.config.ts webServer. Real DB calls work end-to-end
 * without touching any shared database; everything vanishes on exit.
 */
import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();
const child = spawn("npx", ["next", "dev", "--port", "3100"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, MONGODB_URI: mongod.getUri("satvastones-e2e") },
});

let stopping = false;
const shutdown = async (code) => {
  if (stopping) return;
  stopping = true;
  // Defensive: Playwright may already have reaped parts of the tree.
  try {
    child.kill();
  } catch {
    // Already gone — teardown continues.
  }
  try {
    await mongod.stop();
  } catch {
    // Already stopped — teardown continues.
  }
  process.exit(code ?? 0);
};

child.on("exit", (code) => void shutdown(code));
process.on("SIGINT", () => void shutdown(130));
process.on("SIGTERM", () => void shutdown(143));
