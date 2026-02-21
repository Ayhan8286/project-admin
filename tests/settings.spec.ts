import { test, expect } from '@playwright/test';

test.describe('Module: Settings (P2 Flows)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/settings');
    });

    test('1. Switch theme between Light, Dark, and System using the UI buttons', async ({ page }) => {
        // Ensure we are on the General settings tab where Theme Mode is located
        await expect(page.getByRole('tab', { name: /General/i })).toBeVisible();

        // Locate the theme toggle buttons by their unique Lucide icons
        const lightButton = page.locator('button:has(svg.lucide-sun)');
        const darkButton = page.locator('button:has(svg.lucide-moon)');
        const systemButton = page.locator('button:has(svg.lucide-monitor)');

        // Ensure the theme toggle buttons are visible before interacting
        await expect(lightButton).toBeVisible();
        await expect(darkButton).toBeVisible();
        await expect(systemButton).toBeVisible();

        // Switch to Light Mode
        await lightButton.click();
        await expect(page.locator('html')).not.toHaveClass(/dark/);

        // Switch to Dark Mode
        await darkButton.click();
        await expect(page.locator('html')).toHaveClass(/dark/);

        // Test System mode button
        await systemButton.click();
    });

    test('2. Update Organization settings and save to Local Storage', async ({ page }) => {
        const orgInput = page.getByLabel('Organization Name');
        const yearInput = page.getByLabel('Academic Year');

        await expect(orgInput).toBeVisible();
        await expect(yearInput).toBeVisible();

        // Fill new values
        await orgInput.fill('Playwright Test Org');
        await yearInput.fill('2099-2100');

        // Reload the page to verify localStorage persistence
        await page.reload();

        await expect(orgInput).toHaveValue('Playwright Test Org');
        await expect(yearInput).toHaveValue('2099-2100');

        // Cleanup/Reset to default
        await orgInput.fill('AL Huda Network');
        await yearInput.fill('2025-2026');
    });

    test('3. Toggle Default Timezone', async ({ page }) => {
        const pkButton = page.getByRole('button', { name: /Pakistan Time \(PKT\)/i });
        const ukButton = page.getByRole('button', { name: /UK Time \(UKT\)/i });

        await expect(pkButton).toBeVisible();
        await expect(ukButton).toBeVisible();

        // Default could be PKT, let's click UKT
        await ukButton.click();
        await expect(page.getByText('Default set to UKT')).toBeVisible();

        // Switch back to PKT
        await pkButton.click();
        await expect(page.getByText('Default set to PKT')).toBeVisible();
    });

    test('4. View Platform Overview Tab', async ({ page }) => {
        await page.getByRole('tab', { name: 'Platform Overview' }).click();

        // The active tab panel should have "Platform Overview" text in it
        const activeTab = page.locator('[role="tabpanel"][data-state="active"]');
        await expect(activeTab).toContainText('Platform Overview', { timeout: 10000 });

        // Check some stats cards
        await expect(activeTab).toContainText('Students');
        await expect(activeTab).toContainText('Teachers');
        await expect(activeTab).toContainText('Classes');
    });

    test('5. View Data Quality Tab', async ({ page }) => {
        await page.getByRole('tab', { name: 'Data Quality' }).click();

        const activeTab = page.locator('[role="tabpanel"][data-state="active"]');
        await expect(activeTab).toContainText('Data Quality Report', { timeout: 10000 });

        // Verify some quality cards are present
        await expect(activeTab).toContainText('Missing UK Times');
        await expect(activeTab).toContainText('N/A PK Times');
        await expect(activeTab).toContainText('Unassigned Students');
    });

    test('6. View Quick Actions Tab', async ({ page }) => {
        await page.getByRole('tab', { name: 'Quick Actions' }).click();

        const activeTab = page.locator('[role="tabpanel"][data-state="active"]');
        await expect(activeTab).toContainText('Quick Actions', { timeout: 10000 });

        // Verify buttons
        await expect(activeTab.getByRole('button', { name: 'Export' }).first()).toBeVisible();
    });
});
