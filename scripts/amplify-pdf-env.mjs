#!/usr/bin/env node
/**
 * Set Amplify branch env vars for server PDF (NODE_OPTIONS heap).
 * Requires AWS CLI credentials with amplify:UpdateBranch on app d3vim3geq5td01.
 *
 * Usage: node scripts/amplify-pdf-env.mjs [--region ap-southeast-2] [--heap-mb 768]
 */
import { execSync } from "node:child_process";

const APP_ID = "d3vim3geq5td01";
const BRANCH = "main";
const args = process.argv.slice(2);
const regionIdx = args.indexOf("--region");
const heapIdx = args.indexOf("--heap-mb");
const region = regionIdx >= 0 ? args[regionIdx + 1] : process.env.AWS_REGION || "ap-southeast-2";
const heapMb = heapIdx >= 0 ? args[heapIdx + 1] : "768";
const nodeOptions = `--max-old-space-size=${heapMb}`;

console.log(`Updating Amplify branch ${BRANCH} on app ${APP_ID} (${region})…`);
console.log(`  NODE_OPTIONS=${nodeOptions}`);

try {
  execSync(
    `aws amplify update-branch --app-id ${APP_ID} --branch-name ${BRANCH} --region ${region} --environment-variables NODE_OPTIONS="${nodeOptions}"`,
    { stdio: "inherit" }
  );
  console.log("\nDone. Redeploy main in the Amplify console (or push a commit) for runtime to pick up the change.");
} catch (err) {
  console.error("\nFailed. Configure AWS credentials (aws configure) and confirm app region.");
  process.exit(1);
}
