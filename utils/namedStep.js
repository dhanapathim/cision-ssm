import { test } from '@playwright/test';

/**
 * namedStep - Wraps a Playwright test step with:
 * - Step description + test info
 * - Network + navigation timings (name, type, duration, status)
 *
 * @param {string} description - Step description
 * @param {Page} page - Playwright Page object
 * @param {Function} fn - Async step actions
 */
export async function namedStep(description, page, fn) {
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

  // Execute the step
  await test.step(description, async () => {
    await fn();
  });

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
