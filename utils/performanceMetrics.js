import fs from 'fs';
import path from 'path';
import { exe_Time } from '../utils/global-setup.js';

// Global array to hold all step metrics
export const stepMetrics = [];

/**
 * Add a single step metric (does not write to disk yet)
 */
function addStepMetric({ task, scenario, step, action, userActionTime, systemDelay,
  totalTime, networkCalls, isValid }) {
  stepMetrics.push({
    //timestamp: new Date().toISOString(),
    task,
    scenario,
    step,
    action,
    userActionTime,
    systemDelay,
    totalTime,
    networkCalls,
    isValid
  });

  console.log(`📊 Added metrics for: ${task} → ${step} → ${action}`);
  console.log(stepMetrics.length + ' total steps recorded so far.');
}

export function addOutCome(userActions, outCome) {
  stepMetrics.push({
    userActions,
    outCome
  });
}

/**
 * Write all collected metrics once at the end
 */
function writeAllMetricsToFile(fileName = 'performanceMetrics') {
  fileName = fileName + ".json"
  const METRICS_FILE = path.join(process.cwd(), 'qum', exe_Time, "performance", fileName);

  const dir = path.dirname(METRICS_FILE);
  // ✅ 1. Ensure directory exists (recursive = create nested folders if missing)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log(stepMetrics.length + ' total steps recorded so far.');
  fs.writeFileSync(METRICS_FILE, JSON.stringify(stepMetrics, null, 2), 'utf-8');
  console.log(`✅ All metrics written to ${METRICS_FILE}`);
}

export { addStepMetric, writeAllMetricsToFile };
