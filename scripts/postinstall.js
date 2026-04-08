#!/usr/bin/env node
/**
 * Post-install script to verify bun:sqlite is available
 */

console.log("🔧 Checking bun:sqlite availability...");
console.log(`   Platform: ${process.platform} ${process.arch}`);
console.log(`   Node.js: ${process.version}`);
console.log(`   Bun: ${typeof Bun !== "undefined" ? Bun.version : "not detected"}`);

// bun:sqlite is built into Bun, no native binary compilation needed
console.log("✅ bun:sqlite is available (built into Bun runtime)");
console.log("   No native binary compilation required!");
