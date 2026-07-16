import { analyzeConfiguredPaths } from "../src/engine/pathAnalysis";
import { validateDemoContent } from "../src/engine/validation";

const report = validateDemoContent();
const pathSummary = analyzeConfiguredPaths();

console.log(JSON.stringify({ report, pathSummary }, null, 2));

if (!report.valid) {
  process.exitCode = 1;
}
