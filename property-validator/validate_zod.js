#!/usr/bin/env node
// property-validator/validate.js
// Usage:
//   node validate.js                          → validates all *.csv in ./data/
//   node validate.js path/to/file.csv         → validates a single file
//   node validate.js --strict                 → treats warnings as errors
//   node validate.js --out report.json        → saves JSON report
//   node validate.js --summary                → only show summary, suppress per-row errors

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { PropertySchema } from "./propertySchema.js";

// PapaParse is CommonJS — safe require via createRequire
const require = createRequire(import.meta.url);
const Papa   = require("papaparse");
const chalk  = (await import("chalk")).default;

// ─── CLI Args ─────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const STRICT   = args.includes("--strict");
const SUMMARY  = args.includes("--summary");
const outIdx   = args.indexOf("--out");
const OUT_FILE = outIdx !== -1 ? args[outIdx + 1] : null;
const csvFiles = args.filter((a) => !a.startsWith("--") && a !== args[outIdx + 1]);

// ─── Discover files ───────────────────────────────────────────────────────────
function resolveFiles() {
  if (csvFiles.length > 0) {
    return csvFiles.map((f) => path.resolve(f));
  }
  const dataDir = path.resolve("./data");
  if (!fs.existsSync(dataDir)) {
    console.error(chalk.red(`No CSV files specified and ./data/ directory not found.`));
    console.error(chalk.gray(`Usage: node validate.js yourfile.csv`));
    process.exit(1);
  }
  return fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => path.join(dataDir, f));
}

// ─── Parse CSV ────────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, errors, meta } = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (errors.length > 0) {
    console.warn(
      chalk.yellow(`  ⚠  PapaParse warnings in ${path.basename(filePath)}:`)
    );
    errors.forEach((e) => console.warn(chalk.gray(`     Row ${e.row}: ${e.message}`)));
  }

  return { rows: data, meta };
}

// ─── Warnings (non-fatal quality checks) ─────────────────────────────────────
function collectWarnings(row) {
  const w = [];

  // Title quality
  if (row.title && row.title.length < 15)
    w.push(`title is very short (${row.title.length} chars) — consider expanding`);

  // Description quality
  if (row.description && row.description.length < 50)
    w.push(`description is short (${row.description.length} chars) — production listings should be richer`);

  // Price sanity for India (₹ 10k–₹ 50Cr range)
  const price = Number(String(row.price || "").replace(/[₹,\s]/g, ""));
  if (!isNaN(price)) {
    if (price < 100_000)
      w.push(`price ₹${price.toLocaleString("en-IN")} seems very low — verify`);
    if (price > 5_000_000_000)
      w.push(`price ₹${price.toLocaleString("en-IN")} seems unrealistically high — verify`);
  }

  // Geo present but no mapLink
  if (row["coordinates.lat"] && row["coordinates.lng"] && !row.mapLink)
    w.push(`coordinates present but mapLink is empty — consider adding`);

  // RERA date in the past for Under Construction
  if (row.possessionStatus === "Under Construction" && row.reraDate) {
    const d = new Date(row.reraDate);
    if (!isNaN(d) && d < new Date())
      w.push(`reraDate ${row.reraDate} is in the past but possessionStatus is "Under Construction"`);
  }

  // No amenities
  if (!row.amenities || row.amenities.trim() === "")
    w.push(`amenities is empty — poor listing quality`);

  // No coverImage column or empty
  if ("coverImage" in row && !row.coverImage)
    w.push(`coverImage is empty — listing will display without a photo`);

  // dataSource missing
  if (!row.dataSource)
    w.push(`dataSource not set — default will be "manual", confirm that's correct`);

  return w;
}

// ─── Validate one file ────────────────────────────────────────────────────────
function validateFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(chalk.cyan(`\n${"─".repeat(60)}`));
  console.log(chalk.bold.cyan(`📄  ${fileName}`));
  console.log(chalk.cyan(`${"─".repeat(60)}`));

  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`  ✗  File not found: ${filePath}`));
    return { file: fileName, total: 0, passed: 0, failed: 0, warned: 0, rows: [] };
  }

  const { rows } = parseCSV(filePath);
  console.log(chalk.gray(`  Parsed ${rows.length} rows\n`));

  const results = [];
  let passed = 0, failed = 0, warned = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2: 1-indexed + header row
    const result = PropertySchema.safeParse(row);
    const warnings = collectWarnings(row);

    const label = `Row ${String(rowNum).padStart(4)} | ${(row.developerName || "???").slice(0, 20).padEnd(20)} | ${(row.title || "???").slice(0, 40)}`;

    if (!result.success) {
      failed++;
      const issues = result.error.issues;

      if (!SUMMARY) {
        console.log(chalk.red(`  ✗  ${label}`));
        issues.forEach((issue) => {
          const fieldPath = issue.path.join(".") || "(root)";
          console.log(chalk.red(`       ❌ [${fieldPath}] ${issue.message}`));
        });
        if (warnings.length > 0) {
          warnings.forEach((w) => console.log(chalk.yellow(`       ⚠  ${w}`)));
        }
        console.log();
      }

      results.push({
        row: rowNum,
        status: "FAIL",
        developerName: row.developerName,
        title: row.title,
        errors: issues.map((i) => ({ field: i.path.join(".") || "(root)", message: i.message })),
        warnings,
      });
    } else if (warnings.length > 0) {
      warned++;
      const effectiveStatus = STRICT ? "FAIL" : "WARN";

      if (!SUMMARY) {
        const icon = STRICT ? chalk.red(`  ✗  ${label}`) : chalk.yellow(`  ⚠  ${label}`);
        console.log(icon);
        warnings.forEach((w) => console.log(chalk.yellow(`       ⚠  ${w}`)));
        console.log();
      }

      if (STRICT) failed++;
      else passed++;

      results.push({
        row: rowNum,
        status: effectiveStatus,
        developerName: row.developerName,
        title: row.title,
        errors: [],
        warnings,
      });
    } else {
      passed++;
      if (!SUMMARY) {
        console.log(chalk.green(`  ✓  ${label}`));
      }
      results.push({
        row: rowNum,
        status: "PASS",
        developerName: row.developerName,
        title: row.title,
        errors: [],
        warnings: [],
      });
    }
  });

  // File summary
  console.log(chalk.cyan(`\n${"─".repeat(60)}`));
  console.log(
    chalk.bold(`  File Summary: `) +
    chalk.green(`${passed} passed`) + `  ` +
    chalk.red(`${failed} failed`) + `  ` +
    chalk.yellow(`${warned} warned`)
  );

  if (failed === 0 && warned === 0)
    console.log(chalk.bold.green(`  ✅  ${fileName} is PRODUCTION READY`));
  else if (failed === 0)
    console.log(chalk.bold.yellow(`  ⚠   ${fileName} passed validation but has quality warnings`));
  else
    console.log(chalk.bold.red(`  ❌  ${fileName} has ${failed} error(s) — FIX BEFORE IMPORTING`));

  return { file: fileName, total: rows.length, passed, failed, warned, rows: results };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const files = resolveFiles();

  if (files.length === 0) {
    console.error(chalk.red("No CSV files found."));
    process.exit(1);
  }

  console.log(chalk.bold.white(`\n🏗  CompareProjects — Property CSV Validator`));
  console.log(chalk.gray(`   Mode: ${STRICT ? "STRICT (warnings = errors)" : "standard"}`));
  console.log(chalk.gray(`   Files: ${files.length}`));

  const allReports = files.map((f) => validateFile(f));

  // ── Global summary ──────────────────────────────────────────────────────
  const totalRows   = allReports.reduce((s, r) => s + r.total,  0);
  const totalPassed = allReports.reduce((s, r) => s + r.passed, 0);
  const totalFailed = allReports.reduce((s, r) => s + r.failed, 0);
  const totalWarned = allReports.reduce((s, r) => s + r.warned, 0);

  console.log(chalk.bold.white(`\n${"═".repeat(60)}`));
  console.log(chalk.bold.white(`  GLOBAL SUMMARY`));
  console.log(chalk.bold.white(`${"═".repeat(60)}`));
  console.log(
    `  Total rows  : ${chalk.bold(totalRows)}\n` +
    `  Passed      : ${chalk.green.bold(totalPassed)}\n` +
    `  Failed      : ${chalk.red.bold(totalFailed)}\n` +
    `  Warnings    : ${chalk.yellow.bold(totalWarned)}`
  );

  if (totalFailed === 0 && totalWarned === 0) {
    console.log(chalk.bold.green(`\n  ✅  ALL FILES ARE PRODUCTION READY — safe to import.\n`));
  } else if (totalFailed === 0) {
    console.log(chalk.bold.yellow(`\n  ⚠   Validation passed but ${totalWarned} quality warning(s) found.\n`));
  } else {
    console.log(chalk.bold.red(`\n  ❌  ${totalFailed} row(s) FAILED — DO NOT IMPORT until fixed.\n`));
  }

  // ── JSON report ─────────────────────────────────────────────────────────
  if (OUT_FILE) {
    const report = {
      generatedAt: new Date().toISOString(),
      strict: STRICT,
      summary: { totalRows, totalPassed, totalFailed, totalWarned },
      files: allReports,
    };
    fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
    console.log(chalk.gray(`  Report saved → ${OUT_FILE}\n`));
  }

  // Exit with non-zero if errors (for CI pipelines)
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error:"), err);
  process.exit(1);
});