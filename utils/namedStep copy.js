import { test } from '@playwright/test';

/**
 * namedStep - Wraps a Playwright test step with:
 * - Step description + test info
 * - Network request/response logging (URL, method, status, duration)
 * - Handling of failed/aborted requests
 *
 * @param {string} description - Step description
 * @param {Page} page - Playwright Page object
 * @param {Function} fn - Async step actions
 */
export async function namedStep(description, page, fn) {
  const info = test.info();

  if (!page || typeof page.on !== 'function') {
    throw new Error(`namedStep expected a Playwright Page, but got: ${page}`);
  }

  console.log(`\n--- STEP START ---`);
  const [task, scenario, step] = info.titlePath;
  const taskName = formatTaskName(task);

  console.log(`Task: ${taskName}`);
  console.log(`Scenario: ${scenario}`);
  console.log(`Step: ${step}`);

  const requests = [];

  // Track requests
  const onRequest = (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      startTime: Date.now(),
    });
  };

  // Track responses
  const onResponse = (response) => {
    const req = requests.find(r => r.url === response.url() && !r.endTime);
    if (req) {
      req.status = response.status();
      req.endTime = Date.now();
      req.duration = req.endTime - req.startTime;
    }
  };

  // Track failed requests
  const onFailed = (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      status: 'FAILED',
      duration: 0,
    });
  };

  page.on('request', onRequest);
  page.on('response', onResponse);
  page.on('requestfailed', onFailed);

  // Execute the step
  await test.step(description, async () => {
    await fn();
  });

  // Allow late responses to come in
  await new Promise(res => setTimeout(res, 300));

  // Detach listeners
  page.off('request', onRequest);
  page.off('response', onResponse);
  page.off('requestfailed', onFailed);

  console.log(`<<< AFTER step: ${description}`);

  if (requests.length === 0) {
    console.log('No network calls detected during this step.');
  } else {
    console.log('Network calls during step:');
    for (const r of requests) {
      console.log(
        `  [${r.method}] ${r.url} | Status: ${r.status ?? 'PENDING'} | Duration: ${r.duration ?? 'N/A'}ms`
      );
    }
  }

  console.log(`--- STEP END ---\n`);
}


function formatTaskName(fileName) {
  return fileName
    .replace(/\.(spec|test)?\.(ts|js)$/i, '')   // remove extensions
    .replace(/[-_]+/g, ' ')                     // replace - or _ with space
    .split(' ')                                 // split words
    .filter(Boolean)                            // remove empty entries
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // capitalize
    .join(' ');                                 // join with spaces
}


