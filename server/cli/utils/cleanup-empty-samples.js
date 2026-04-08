// server/cli/utils/cleanup-empty-samples.js
// Clean up empty samples from the database

// Runtime-aware SQLite: uses bun:sqlite under Bun, better-sqlite3 under Node.js
const _sqliteModName = typeof Bun !== 'undefined' 
  ? [98,117,110,58,115,113,108,105,116,101].map(c => String.fromCharCode(c)).join('')
  : 'better-sqlite3';
const { Database } = await import(_sqliteModName).then(m => m.default ? { Database: m.default } : m);
import { join } from "path";

export async function cleanupEmptySamples(dataDir) {
  const dbPath = join(dataDir, "curator.db");
  const db = new Database(dbPath);

  try {
    console.log("🔍 Checking for empty samples...");

    // Find empty samples (instruction or output is empty/null)
    const emptySamples = db
      .prepare(
        `SELECT id, dataset_id FROM samples 
         WHERE instruction IS NULL 
            OR instruction = '' 
            OR output IS NULL 
            OR output = ''
            OR TRIM(instruction) = ''
            OR TRIM(output) = ''`
      )
      .all();

    if (emptySamples.length === 0) {
      console.log("✅ No empty samples found");
      return { deleted: 0 };
    }

    console.log(`⚠️  Found ${emptySamples.length} empty samples`);

    // Group by dataset for reporting
    const byDataset = {};
    for (const sample of emptySamples) {
      if (!byDataset[sample.dataset_id]) {
        byDataset[sample.dataset_id] = 0;
      }
      byDataset[sample.dataset_id]++;
    }

    console.log("📊 Empty samples by dataset:");
    for (const [datasetId, count] of Object.entries(byDataset)) {
      console.log(`   Dataset ${datasetId}: ${count} empty samples`);
    }

    // Delete empty samples
    console.log("🧹 Deleting empty samples...");
    const result = db
      .prepare(
        `DELETE FROM samples 
         WHERE instruction IS NULL 
            OR instruction = '' 
            OR output IS NULL 
            OR output = ''
            OR TRIM(instruction) = ''
            OR TRIM(output) = ''`
      )
      .run();

    const deletedCount = result.changes;
    console.log(`✅ Deleted ${deletedCount} empty samples`);

    // Update dataset statistics
    console.log("📊 Updating dataset statistics...");
    const datasets = db.prepare("SELECT id FROM datasets").all();

    for (const dataset of datasets) {
      const stats = db
        .prepare(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
           FROM samples WHERE dataset_id = ?`
        )
        .get(dataset.id);

      db.prepare(
        `UPDATE datasets 
         SET sample_count = ?, approved_count = ?, updated_at = datetime('now') 
         WHERE id = ?`
      ).run(stats.total, stats.approved, dataset.id);
    }

    console.log("✅ Dataset statistics updated");

    return {
      deleted: deletedCount,
      byDataset,
    };
  } finally {
    db.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const dataDir = process.argv[2] || "./data";
  cleanupEmptySamples(dataDir)
    .then((result) => {
      console.log("\n📊 Summary:");
      console.log(`   Deleted: ${result.deleted} empty samples`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Error:", err.message);
      process.exit(1);
    });
}
