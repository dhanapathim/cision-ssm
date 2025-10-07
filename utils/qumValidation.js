import { test } from '@playwright/test';
import { addStepMetric } from '../utils/performanceMetrics.js';
export let isValid = false;
/**
 * namedStep - Wraps a Playwright test step with:
 * - Step description + test info
 * - Network + navigation timings (name, type, duration, status)
 *
 * @param {string} description - Step description
 * @param {Page} page - Playwright Page object
 * @param {Function} fn - Async step actions
 */
export async function qumValidation(description, page, fn) {
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
const startUserAction = Date.now();
  const startSystemDelay = startUserAction;
  // Execute the step

  await test.step(description, async () => {

    try {
      await fn();
      isValid = true;
    } catch(e) {
      console.error(`Validation failed for Action ${description}.`);
      //throw Error(`Validation failed for Action ${description}.Error details are `, e);
    }
    console.log(`Validation is ${isValid}`);
  });
  const endUserAction = Date.now();
  const userActionTime = endUserAction - startUserAction;
  await addStepMetric({
  task: taskName,
  scenario: scenario,
  step: step,
  action: description,
  userActionTime: userActionTime,
  systemDelay: 0,
  networkCalls: [],
  isValid: isValid
});
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
