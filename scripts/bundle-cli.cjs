/* eslint-disable @typescript-eslint/no-require-imports */
const esbuild = require("esbuild");
const fs = require("fs");

const OUTFILE = "dist/curator.mjs";

async function bundle() {
  console.log("📦 Bundling CLI with esbuild...\n");

  try {
    // Ensure dist directory exists
    if (!fs.existsSync("dist")) {
      fs.mkdirSync("dist", { recursive: true });
    }

    // Create a temporary entry point without the shebang
    const originalContent = fs.readFileSync("bin/cli.js", "utf-8");
    const contentWithoutShebang = originalContent.replace(/^#![^\n]*\n/, "");
    const tempEntry = "dist/.cli-entry.mjs";
    fs.writeFileSync(tempEntry, contentWithoutShebang);

    // Bundle the CLI as ESM
    await esbuild.build({
      entryPoints: [tempEntry],
      bundle: true,
      platform: "node",
      target: "node18",
      format: "esm",
      outfile: OUTFILE,
      external: ["better-sqlite3", "adm-zip"],
      minify: false,
      sourcemap: true,
      treeShaking: true,
      splitting: false,
    });

    // Add proper shebang and make executable
    const bundleContent = fs.readFileSync(OUTFILE, "utf-8");
    const withShebang = "#!/usr/bin/env node\n" + bundleContent;
    fs.writeFileSync(OUTFILE, withShebang);
    fs.chmodSync(OUTFILE, "755");

    // Cleanup temp file
    fs.unlinkSync(tempEntry);

    const stats = fs.statSync(OUTFILE);
    const sizeKB = (stats.size / 1024).toFixed(1);

    console.log("✅ CLI bundled successfully!");
    console.log(`   Output: ${OUTFILE}`);
    console.log(`   Size: ${sizeKB} KB`);
    console.log(`   Format: ESM (Node 18+)`);
    console.log("\n📋 To test:");
    console.log("   node dist/curator.mjs --help");
  } catch (error) {
    console.error("\n❌ Bundle failed:", error.message);
    process.exit(1);
  }
}

bundle();
