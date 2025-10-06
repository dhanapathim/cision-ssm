import fs from 'fs';
import path from 'path';

// Global array to hold all step metrics
const stepMetrics = [];

// Define where the JSON will be saved
const METRICS_FILE = path.join(process.cwd(),'qum', 'performanceMetrics.json');

/**
 * Add a single step metric (does not write to disk yet)
 */
function addStepMetric({ task, scenario, step, action, userActionTime, systemDelay, entriesCount }) {
  stepMetrics.push({
    timestamp: new Date().toISOString(),
    task,
    scenario,
    step,
    action,
    userActionTime,
    systemDelay,
    entriesCount
  });

  console.log(`📊 Added metrics for: ${task} → ${step} → ${action}`);
}

/**
 * Write all collected metrics once at the end
 */
function writeAllMetricsToFile() {
  fs.writeFileSync(METRICS_FILE, JSON.stringify(stepMetrics, null, 2), 'utf-8');
  console.log(`✅ All metrics written to ${METRICS_FILE}`);
}

export { addStepMetric, writeAllMetricsToFile };
