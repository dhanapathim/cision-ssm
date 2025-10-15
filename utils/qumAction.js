import { test } from '@playwright/test';
import { getPerformanceMetrics,writePerformanceMetricsToFile } from '../utils/performanceMetrics.js';
import { checkAllyViolations,writeA11yMetricsToFile } from './a11yMetrics.js';
import { getBrowserMetrics,writeBrowserMetricsToFile } from './browserPerformanceMetrics.js';


export let userActionCount = 0;
//const runA11y = process.env.RUN_A11Y?.toLowerCase() === 'true' || false;
//const runPerformance = process.env.RUN_PERFORMANCE?.toLowerCase() === 'true' || false;

//const runA11y = testInfo.project.metadata.ally?.toLowerCase() === 'true' || false;
//const runPerformance = testInfo.project.metadata.performance?.toLowerCase() === 'true' || false;
/**
 * namedStep - Wraps a Playwright test step with:
 * - Step description + test info
 * - Network + navigation timings (name, type, duration, status)
 *
 * @param {string} description - Step description
 * @param {Page} page - Playwright Page object
 * @param {Function} fn - Async step actions
 */
export async function qumAction(description, page, fn) {
  const info = test.info();

  if (!page || typeof page.evaluate !== 'function') {
    throw new Error(`namedStep expected a Playwright Page, but got: ${page}`);
  }

  console.log(`\n--- Start of Action ---`);
  const [task, scenario, step] = info.titlePath;
  const taskName = formatTaskName(task);

  console.log(`Task: ${taskName}`);
  console.log(`Scenario: ${scenario}`);
  console.log(`Step: ${step}`);
  console.log(`Action: ${description}`);

  const userStart = performance.now();
  // Execute the step
  await test.step(description, async () => {
    await fn();
  });
  const requestSent = performance.now();
  const runA11y = info.project.metadata.a11y?.toLowerCase() === 'true' || false;
  const runPerformance = info.project.metadata.performance?.toLowerCase() === 'true' || false;
  const runBrowserMetrics = info.project.metadata.browserMetrics?.toLowerCase() === 'true' || false;

  console.log(`A11y=${runA11y}; perf=${runPerformance}; browserM=${runBrowserMetrics}`);
  if (runPerformance) {
    await getPerformanceMetrics(page, taskName, scenario, step, description, userStart, requestSent);
  }
  userActionCount++;
  await page.waitForTimeout(3000);
  if (runA11y) {
    checkAllyViolations(page, description, taskName, scenario, step);
  }
  if (runBrowserMetrics) {
    await getBrowserMetrics(page, description, taskName, scenario, step);
  }
  console.log(`--- END of Action ${description} ---\n`);
  await page.waitForTimeout(6000);
}

/**
 * Formats the task/spec filename:
 * - Removes .spec.ts / .spec.js / .ts / .js
 * - Replaces - and _ with spaces
 * - Capitalizes each word
 */
function formatTaskName(fileName) {
  return fileName
    .replace(/\.(spec|test)?\.(ts|js)$/i, '')
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
export function writeQUM(testInfo) {
  const runA11y = testInfo.project.metadata.a11y?.toLowerCase() === 'true' || false;
  const runPerformance = testInfo.project.metadata.performance?.toLowerCase() === 'true' || false;
  const runBrowserMetrics = testInfo.project.metadata.browserMetrics?.toLowerCase() === 'true' || false;
  console.log(`in writeQUM a11y=${testInfo.project.metadata.a11y} ,
     perf=${testInfo.project.metadata.performance}
     browser=${testInfo.project.metadata.browserMetrics}`);
  return runA11y || runPerformance || runBrowserMetrics;
}

export function writeQUMFiles(testInfo,fileName,filePath)
{
  if(writeQUM(testInfo)){
    try {
      writePerformanceMetricsToFile(fileName,filePath);
      writeA11yMetricsToFile(fileName,filePath);
      writeBrowserMetricsToFile(fileName,filePath);
      console.log('✅ Metrics written successfully');
    } catch (err) {
      console.error('⚠️ Failed to write metrics:', err);
    }
}
}