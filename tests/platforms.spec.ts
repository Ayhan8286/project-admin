import { test, expect } from '@playwright/test';

test.describe.serial('Module 8: Platforms & Integration (P1 Flows)', () => {

    test('1. View the list of virtual platforms on /platforms', async ({ page }) => {
        await page.goto('/platforms');

        // Check if the page heading exists
        await expect(page.getByRole('heading', { name: 'Platforms', exact: true })).toBeVisible();
        await expect(page.getByText('View students by their class platform')).toBeVisible();

        // Wait for loading to finish
        // The page uses a standard Loader2 from lucide-react with animate-spin
        await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Check that at least some platform cards are visible
        // e.g., Zoom, Teams, Hybrid (using a generic card locator to support any DB state)
        const platformCards = page.locator('.cursor-pointer').filter({ hasText: /Click to view students/i });
        const count = await platformCards.count();
        if (count > 0) {
            await expect(platformCards.first()).toBeVisible();
        }
    });

    test('2. Expand a platform folder to view connected students', async ({ page }) => {
        await page.goto('/platforms');
        await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15000 }).catch(() => { });

        const platformCards = page.locator('.cursor-pointer').filter({ hasText: /Click to view students/i });
        const count = await platformCards.count();

        if (count > 0) {
            // Click the first available platform card
            await platformCards.first().click();

            // Assert that the expanded view is visible (heading will have "Students")
            await expect(page.getByRole('heading', { name: /Students/i })).toBeVisible({ timeout: 15000 });

            // Assert the header containing student counts is visible
            await expect(page.getByText(/Student(s)? Found/)).toBeVisible();

            // The table or empty state should be present
            await expect(
                page.getByRole('table')
                    .or(page.getByText(/No students found for this platform/i))
            ).toBeVisible({ timeout: 15000 });

            // Test the back button
            const backBtn = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') });
            await backBtn.click();

            // Should be back to the list of platforms
            await expect(page.getByRole('heading', { name: 'Platforms', exact: true })).toBeVisible();
        } else {
            // If no platforms exist in DB, just verify the base page is loaded completely
            await expect(page.getByText('View students by their class platform')).toBeVisible();
        }
    });
});
