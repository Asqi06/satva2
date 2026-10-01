// Build and smoke-test with a disposable database; never touches the owner's catalogue.
import { spawn } from "node:child_process";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const env = { ...process.env, MONGODB_URI: database.getUri("seo-audit-build"), E2E_DIST_DIR: ".next-seo-audit", VERCEL_ENV: "production", SITE_INDEXING_ENABLED: "true", NEXT_PUBLIC_APP_URL: "https://www.satvastones.in" };
function run(args, options = {}) {
  return spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], { env, stdio: "inherit", ...options });
}
let server;
try {
  const build = run(["build", "--webpack"]);
  const code = await new Promise((resolve, reject) => { build.on("exit", resolve); build.on("error", reject); });
  if (code !== 0) process.exitCode = code ?? 1;
  else {
    server = run(["start", "--port", "3102"]);
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try { const response = await fetch("http://localhost:3102/api/health"); if (response.ok) { ready = true; break; } } catch { /* waiting for server */ }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error("Production smoke server did not start");
    for (const path of ["/", "/about", "/contact", "/guides/jewellery-buying-guide", "/robots.txt", "/sitemap.xml", "/product-feed.xml"]) {
      const response = await fetch(`http://localhost:3102${path}`);
      const body = await response.text();
      if (response.status !== 200) throw new Error(`${path}: ${response.status}`);
      if (["/", "/about", "/contact", "/guides/jewellery-buying-guide"].includes(path) && !body.includes("https://www.satvastones.in")) throw new Error(`${path}: public canonical absent`);
      if (response.headers.get("x-robots-tag")?.includes("noindex") && path !== "/product-feed.xml") throw new Error(`${path}: unexpected production noindex`);
      if (path === "/" && (!body.includes('"@type":"OnlineStore"') || !body.includes("satvastonesjewelry"))) throw new Error("Verified business identity absent");
      if (path === "/robots.txt" && !body.includes("Sitemap: https://www.satvastones.in/sitemap.xml")) throw new Error("Public sitemap pointer absent");
      console.log(`Production smoke ${path}: ${response.status}`);
    }
    const missing = await fetch("http://localhost:3102/products/no-such-seo-product", { headers: { "User-Agent": "Googlebot" } });
    if (missing.status !== 404) throw new Error(`Missing product returned ${missing.status}`);
    console.log("Production smoke missing product: 404");
  }
} finally {
  if (server) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await exited;
  }
  await database.stop();
}
