const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// Tests use the actual running storefront; no invented outcomes.
async function signIn(page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) throw new Error('Set E2E_EMAIL and E2E_PASSWORD for a REAL test account before running checkout tests.');
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login|log in|sign in/i }).click();
  await expect(page.getByText(/signed in as/i)).toBeVisible();
}

// Capture a baseline with: npx playwright test --update-snapshots
// Later rerun without --update-snapshots to detect changes.
test('VIS-01 homepage visual regression', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page).toHaveScreenshot('home-desktop.png', { animations: 'disabled', fullPage: true });
});

test('VIS-02 products visual regression', async ({ page }) => {
  await page.goto('/products');
  await expect(page.locator('main')).toBeVisible();
  await expect(page).toHaveScreenshot('products-desktop.png', { animations: 'disabled', fullPage: true });
});

test('VIS-03 checkout visual regression', async ({ page }) => {
  await signIn(page);
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await expect(page).toHaveScreenshot('checkout-desktop.png', { animations: 'disabled', fullPage: true });
});

test('AXE-01 checkout automated accessibility audit', async ({ page }) => {
  await signIn(page);
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  console.log('AXE_CHECKOUT_RESULTS=' + JSON.stringify({ violations: results.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => n.target) })) }));
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
