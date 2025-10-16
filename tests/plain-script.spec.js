import { test, expect } from '@playwright/test';

test.describe('Instagram', () => {

  test('Login', async ({ page, context, baseURL }) => {
    // 1. Open url
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle('Brandwatch');

    // 2. Accept Cookies
    await page.locator("//*[@id='onetrust-accept-btn-handler']").click();

    // 3. Click Sign in button
    await page.locator('//*[@id="spanrotate"]').click();
    await page.screenshot({ path: './screenshots/signin-clicked.png' });

    let newTab;

    // 4. Click "Social Media Management"
    const ssmLocator = page.locator("(//span[contains(@class,'f3-lg-xl u-hover__underline-target span-head')][contains(text(),'Social Media')])[1]");
    await ssmLocator.click();

    [newTab] = await Promise.all([
      context.waitForEvent('page'),
    ]);

    console.log(await newTab.title());

    // 5. Enter username.
    await newTab.locator('//*[@id="lookupUsername"]').fill(process.env.BW_USERNAME);
    await newTab.waitForLoadState('domcontentloaded');

    // 6. Click Next to go to Password Page
    await newTab.locator('//*[@id="continue-btn-text"]').click();
    await newTab.waitForLoadState('domcontentloaded');

    // 7. Enter Password
    await newTab.locator('//*[@id="password"]').fill(process.env.BW_PASSWORD);

    // 8. Click Sign in
    await newTab.locator('//*[@id="signin-btn-text"]').click();
    await newTab.waitForLoadState('domcontentloaded');

    // Final validation
    await expect(newTab).toHaveTitle('Social Media Management')
  });

});