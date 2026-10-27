
const { test, expect } = require('@playwright/test');
const { StorefrontPage } = require('../pages/StorefrontPage');

test.describe('Track A - Storefront Automation', () => {

  test('home page displays main navigation', async ({ page }) => {
    const storefront = new StorefrontPage(page);

    await storefront.goto();

    await expect(storefront.navigation).toBeVisible();
    await expect(storefront.homeLink).toBeVisible();
    await expect(storefront.productsLink).toBeVisible();
  });

  test('user can navigate to the products page', async ({ page }) => {
    const storefront = new StorefrontPage(page);

    await storefront.goto();
    await storefront.openProducts();

    await expect(page).toHaveURL(/\/products$/);
  });

  test('guest can navigate to the login page', async ({ page }) => {
    const storefront = new StorefrontPage(page);

    await storefront.goto();
    await storefront.openLogin();

    await expect(page).toHaveURL(/\/login$/);
  });

});
