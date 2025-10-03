// tests/brandwatch-login.spec.js
import { test, expect, chromium } from '@playwright/test';
import { namedStep } from '../utils/namedStep.js';

test.describe('Instagram', () => {

  let context;
  let page;

  test.beforeAll(async () => {
    // Create a new context with video recording enabled
    context = await chromium.launchPersistentContext('', {
      headless: false,
      recordVideo: {
        dir: './videos/',       // folder to save videos
        size: { width: 1280, height: 720 }
      },
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    // Close context to finalize video
    await context.close();
  });

  test('Login', async ({ baseURL }) => {
  
    // 1. Open the url from config
    await namedStep('Open Url', page, async () => {
      await page.goto(baseURL, { waitUntil: 'load' });
    });

    // Assert title
    await expect(page).toHaveTitle('Brandwatch');
    
    // 2. Accept Cookies
    await namedStep('Accept Cookies', page, async () => {
      await page.locator("//*[@id='onetrust-accept-btn-handler']").click();
    });

    // 3. Click Sign in button
    await namedStep('Click Sign In Tab', page, async () => {
      await page.locator('//*[@id="spanrotate"]').click();
    });
    await page.screenshot({ path: './screenshots/signin-clicked.png' });

    // 4. Click "Social Media Management"
    await namedStep('Select Social Media Management', page, async () => {
      const ssmLocator = page.locator("(//span[contains(@class,'f3-lg-xl u-hover__underline-target span-head')][contains(text(),'Social Media')])[1]");
      await ssmLocator.click();
    });

    const [newTab] = await Promise.all([
      context.waitForEvent('page'),
    ]);

    console.log(await newTab.title());
    
    // 5. Enter username.
    await namedStep('Enter username', newTab, async () => {
      await newTab.locator('//*[@id="lookupUsername"]').fill(process.env.BW_USERNAME);
    });

    // 6. Click Next to go to Password Page
    await namedStep('Click Next go to password Page', newTab, async () => {
      await newTab.locator('//*[@id="continue-btn-text"]').click();
    });

    await newTab.waitForLoadState('load');

    // 7. Enter Password
    await namedStep('Enter Password', newTab, async () => {
      await newTab.locator('//*[@id="password"]').fill(process.env.BW_PASSWORD);
    });

    // 8. Click Sign in
    await namedStep('Click SignIn Button', newTab, async () => {
      await newTab.locator('//*[@id="signin-btn-text"]').click();
    });
    await newTab.waitForLoadState('load');

    // Final validation
    await expect(newTab).toHaveTitle('Social Media Management');
  });

});
