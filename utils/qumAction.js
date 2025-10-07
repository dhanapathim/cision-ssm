import { test } from '@playwright/test';
import { addStepMetric } from '../utils/performanceMetrics.js';

export let userActionCount=0;
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
  const timings = {};

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

  const startUserAction = Date.now();
  const startSystemDelay = startUserAction;

  // Execute the step
  await test.step(description, async () => {
    await fn();
  });
  const endUserAction = Date.now();
  timings.userActionTime = endUserAction - startUserAction;

await waitForPageStability(page, 800, 5000);
  const endSystemDelay = Date.now();
  timings.systemDelay = endSystemDelay - startSystemDelay;

  console.log(`🧩 Metrics`);
  console.log(`User Action Time: ${timings.userActionTime} ms`);
  console.log(`System Delay: ${timings.systemDelay} ms`);

  // Capture simplified performance entries
  const perfEntries = await page.evaluate(() => {
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

/*
  if (!perfEntries || perfEntries.length === 0) {
    console.log('No navigation/resource entries detected during this step.');
  } else {
    console.log('Entries during step:');
    perfEntries.forEach((entry, i) => {
      console.log(
        `${i + 1}. [${entry.type.toUpperCase()}] ${entry.name} | Status: ${entry.status} | Time: ${entry.time}ms`
      );
    });
  }
*/
if (!perfEntries)
{
    console.log('No navigation/resource entries detected during this step.');
}
else
{
    console.log('Entries count during step:{}', perfEntries.length);
}

await addStepMetric({
  task: taskName,
  scenario: scenario,
  step: step,
  action: description,
  userActionTime: timings.userActionTime,
  systemDelay: timings.systemDelay,
  networkCalls: perfEntries,
  isValid: true
});
userActionCount++;
  console.log(`--- END of Action ${description} ---\n`);
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
    { stabilityTime, timeout } // pass arguments as a single object
  );
}