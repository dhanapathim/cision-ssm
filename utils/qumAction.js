import { test } from '@playwright/test';
import { addStepMetric } from '../utils/performanceMetrics.js';

export let userActionCount = 0;
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

  // wait for backend response and UI update
  await waitForDOMInteractive(page);
  const systemEnd = performance.now();

  const userActionTime = requestSent - userStart;
  const systemDelay = systemEnd - requestSent;
  const totalTime = userActionTime + systemDelay;

  console.log(`User Action Time: ${userActionTime.toFixed(2)}ms`);
  console.log(`System Delay: ${systemDelay.toFixed(2)}ms`);

  // Capture simplified performance entries
  const perfEntries = await getPerfEntries(page);

  addStepMetric({
    task: taskName,
    scenario: scenario,
    step: step,
    action: description,
    userActionTime,
    systemDelay,
    totalTime,
    networkCalls: perfEntries,
    isValid: true,
  });

  userActionCount++;
  console.log(`--- END of Action ${description} ---\n`);
}

/**
 * Wait until the DOM is interactive (or complete).
 * Works for both normal web pages and SPAs that trigger DOM changes early.
 */
export async function waitForDOMInteractive(page, timeout = 15000) {
  await page.waitForFunction(
    () => ['interactive', 'complete'].includes(document.readyState),
    { timeout }
  );

  // Small buffer to ensure scripts attached to DOM have executed
  await page.waitForTimeout(300);
}

async function getPerfEntries(page) {
  return await page.evaluate(() => {
    const entries = performance.getEntries()
      .filter(e => e.entryType === 'navigation' || e.entryType === 'resource')
      .map(entry => ({
        name: entry.name,
        type: entry.entryType,
        status: 200, // approximate, real status requires interception
        time: entry.duration.toFixed(2)
      }));
    performance.clearResourceTimings();
    return entries;
  });
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

async function waitForPageStability(page, stabilityTime = 800, timeout = 5000) {
  await page.evaluate(
    ({ stabilityTime, timeout }) => {
      const wait = ms => new Promise(r => setTimeout(r, ms));

      let lastChange = Date.now();
      const observer = new MutationObserver(() => (lastChange = Date.now()));
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });

      const start = Date.now();
      return (async () => {
        while (Date.now() - start < timeout) {
          if (Date.now() - lastChange > stabilityTime) break;
          await wait(100);
        }
        observer.disconnect();
      })();
    },
    { stabilityTime, timeout }
  );
}
