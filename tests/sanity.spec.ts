import { test, expect } from '@playwright/test';

test('has Dashboard heading', async ({ page }) => {
    await page.goto('/');

    // Expect a heading with the name "Dashboard".
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
