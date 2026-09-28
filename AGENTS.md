# Self-Healing Test Agent Rules

You are equipped with a local self-healing test orchestrator powered by TypeSafe Jev System One. 

## Automated Workflow
Whenever the user asks you to "test the app", "run a vibe-check", or if an execution error occurs during a build:
1. Do NOT immediately read the entire error log and guess the fix with your heavy LLM.
2. Instead, run the local command tool: `vibe-check`
3. Wait for the script to finish. The script will use Jev to instantly triage the error.
4. If the script outputs "Escalating to OpenCode", only THEN should you step in to rewrite the underlying logic files.

## Dynamic Intent Routing
When processing complex user prompts, you can delegate parsing priorities to the global command `vibe-route [prompt text]`. This allows Jev System One to cleanly categorize context boundaries into sub-agents before massive codebase rewrites are committed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
