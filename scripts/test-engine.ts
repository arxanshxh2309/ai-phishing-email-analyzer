import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { runEngine } from "../lib/engine";

async function main() {
  const fixturesDir = join(__dirname, "..", "fixtures");
  const files = readdirSync(fixturesDir).filter((f) => f.endsWith(".eml"));

  for (const file of files) {
    const raw = readFileSync(join(fixturesDir, file));
    const result = await runEngine(raw);

    console.log("=".repeat(70));
    console.log(file);
    console.log("-".repeat(70));
    console.log(`Score: ${result.score}  Tier: ${result.tier.toUpperCase()}`);
    console.log(`From: ${result.summary.fromName} <${result.summary.from}>`);
    console.log(`Subject: ${result.summary.subject}`);
    console.log("Category scores:");
    for (const cs of result.categoryScores) {
      console.log(`  ${cs.category.padEnd(15)} ${cs.score}`);
    }
    console.log(`Findings (${result.findings.length}):`);
    for (const f of result.findings) {
      if (f.weight === 0) continue;
      console.log(`  [${f.severity.toUpperCase()}] (${f.category}, +${f.weight}) ${f.title}`);
      if (f.evidence) console.log(`      evidence: ${f.evidence}`);
    }
    console.log(`Links extracted: ${result.links.length}`);
    for (const l of result.links) {
      if (l.flags.length > 0) {
        console.log(`  FLAGGED [${l.flags.join(", ")}] ${l.href}`);
      }
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
