const { test, expect } = require('@playwright/test');

test('login flow', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Check if login page loads
    await expect(page).toHaveTitle(/Desafio FIRE/);

    // Fill login form (assuming standard selectors)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Click login button
    await page.click('button[type="submit"]');

    // Expect to be redirected to dashboard or see dashboard element
    // Note: This requires a running backend or mocked auth
    // await expect(page).toHaveURL('http://localhost:3000/');
});
