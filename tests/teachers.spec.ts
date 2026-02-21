import { test, expect } from '@playwright/test';

// Use serial execution because tests depend on state created by previous tests in this suite.
test.describe.serial('Module 3: Teacher Management (P0 Flows)', () => {

    const uniqueId = Date.now().toString();
    const teacherName = `Test Teacher ${uniqueId}`;
    const staffId = `STAFF-${uniqueId}`;

    test('1. View the list of active teachers on /teachers', async ({ page }) => {
        await page.goto('/teachers');

        // Check if the page heading exists
        await expect(page.getByRole('heading', { name: /Teachers/i })).toBeVisible();

        // Check if the "Add Teacher" button exists
        await expect(page.getByRole('button', { name: 'Add Teacher' })).toBeVisible();

        // Wait for either the loading spinner to go away or the content to populate
        // Adjust locator if the loading text is different, assuming 'Loading...' or hidden naturally
        await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15000 }).catch(() => { });
    });

    test('2. Add a new teacher profile via the Add Teacher dialog', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err));

        await page.goto('/teachers');
        await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Open the dialog
        await page.getByRole('button', { name: 'Add Teacher' }).click();
        await expect(page.getByRole('heading', { name: 'Add New Teacher' })).toBeVisible();

        // Fill in the form fields. The labels usually have asterisks if required.
        // E.g., 'Full Name *', 'Name *', etc.
        await page.getByLabel(/Name\b/i).fill(teacherName);
        await page.getByLabel(/Staff ID\b/i).fill(staffId);

        // Take a screenshot to debug
        await page.screenshot({ path: 'test-results/teacher-before-submit.png', fullPage: true });

        // Click "Save Teacher"
        await page.getByRole('button', { name: /Save Teacher/i }).click();

        await page.waitForTimeout(2000); // give it a moment to show any validation errors
        await page.screenshot({ path: 'test-results/teacher-after-submit.png', fullPage: true });

        // The dialog should close upon success
        await expect(page.getByRole('heading', { name: 'Add New Teacher' })).toBeHidden({ timeout: 15000 });

        // The new teacher should now appear in the ui (e.g. in a select dropdown or table)
        // Wait for the UI to update and check visibility
        await expect(page.getByText(teacherName)).toBeVisible();
    });

    test('3. Search for a teacher by Name or Staff ID', async ({ page }) => {
        await page.goto('/teachers');
        await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15000 }).catch(() => { });

        const searchInput = page.getByPlaceholder('Search by name or staff ID...');
        await expect(searchInput).toBeVisible();

        // Search for the teacher created in the previous step
        await searchInput.fill(teacherName);

        // Assert only this teacher is visible (or at least that this teacher is visible)
        await expect(page.getByRole('cell', { name: teacherName, exact: true })).toBeVisible();

        // Search for a non-existent teacher
        await searchInput.fill('XYZ_NON_EXISTENT_TEACHER_XYZ');
        await expect(page.getByText('No teachers found matching your search.')).toBeVisible();
    });

    test('4. View Visual Availability Grid and toggles', async ({ page }) => {
        await page.goto('/teachers');
        await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Switch to the Availability tab
        await page.getByRole('tab', { name: 'Visual Availability Grid' }).click();

        // Check if the grid title is visible inside the active tab panel
        const activeTab = page.locator('[role="tabpanel"][data-state="active"]');
        await expect(activeTab).toContainText('Teacher Schedule Matrix', { timeout: 10000 });

        // Check day chips exist
        await expect(page.getByRole('button', { name: 'Mon', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Tue', exact: true })).toBeVisible();

        // Check timezone toggles
        const uktToggle = page.getByRole('button', { name: 'UKT' });
        const pktToggle = page.getByRole('button', { name: 'PKT' });

        await expect(uktToggle).toBeVisible();
        await expect(pktToggle).toBeVisible();

        // Check if clicking toggles updates the timeline header
        await uktToggle.click();
        await expect(page.locator('.glass-table-header').filter({ hasText: 'UKT' })).toBeVisible();

        await pktToggle.click();
        await expect(page.locator('.glass-table-header').filter({ hasText: 'PKT' })).toBeVisible();
    });
});
