import { test, expect } from '@playwright/test';

test.describe.serial('Module 5: Supervisor Management (P0 Flows)', () => {

    let supervisorName: string;
    let email: string;
    let phone: string;

    test.beforeAll(async ({ }, testInfo) => {
        const uniqueId = `${testInfo.workerIndex}_${Date.now()}`;
        supervisorName = `Test Supervisor ${uniqueId}`;
        email = `supervisor${uniqueId}@test.com`;
        phone = `+1234567890`;
    });

    test('1. View the list of supervisors on /supervisors', async ({ page }) => {
        await page.goto('/supervisors');

        // Check if the page heading exists
        await expect(page.getByRole('heading', { name: 'Supervisors', exact: true })).toBeVisible();

        // Check if the "Add Supervisor" button exists
        await expect(page.getByRole('button', { name: 'Add Supervisor' })).toBeVisible();

        // Wait for either the loading spinner to go away or the content to populate
        await expect(page.getByText('Loading...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // The table should have basic headers
        await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    });

    test('2. Add a new supervisor via the AddSupervisorDialog form', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err));

        await page.goto('/supervisors');
        await expect(page.getByText('Loading...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Open the dialog
        await page.getByRole('button', { name: 'Add Supervisor' }).click();
        await expect(page.getByRole('heading', { name: 'Add Supervisor' })).toBeVisible();

        // Fill in the form fields. Specific to AddSupervisorDialog fields.
        await page.getByLabel(/Name \*/i).fill(supervisorName);
        await page.getByLabel(/Email/i).fill(email);
        await page.getByLabel(/Phone/i).fill(phone);

        // Click "Save Supervisor"
        await page.getByRole('button', { name: 'Save Supervisor' }).click();

        await page.waitForTimeout(2000); // give it a moment to show any validation errors

        // The dialog should close upon success
        await expect(page.getByRole('heading', { name: 'Add Supervisor' })).toBeHidden({ timeout: 15000 });

        // The new supervisor should now appear in the ui data table
        // Wait for the UI to update and check visibility
        await expect(page.getByRole('cell', { name: supervisorName })).toBeVisible();
        await expect(page.getByRole('cell', { name: email })).toBeVisible();
    });

    test('3. Click a supervisor to view their specific details/assigned students (P1)', async ({ page }) => {
        // Ensure we are on the supervisors page (or rely on state from previous)
        await page.goto('/supervisors');
        await expect(page.getByText('Loading...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Find the specific supervisor row created in the previous step
        const supervisorRow = page.getByRole('row').filter({ hasText: supervisorName });
        await expect(supervisorRow).toBeVisible();

        // Click on the 'View Students' / 'View Details' action button/link in their row
        const viewLink = supervisorRow.getByRole('link', { name: /View (Students|Details)/i });
        await expect(viewLink).toBeVisible();
        await viewLink.click();

        // Assert navigation to the dynamic route
        await page.waitForURL('**/supervisors/*', { timeout: 15000 });
        expect(page.url()).toMatch(/\/supervisors\/[a-zA-Z0-9_-]+/);

        // Assert the detail page renders correctly by checking the supervisor's name heading
        await expect(page.getByRole('heading', { name: supervisorName, level: 1 }).or(page.getByRole('heading', { name: supervisorName, level: 2 }).or(page.getByRole('heading', { name: supervisorName })))).toBeVisible();
    });

    test('4. Search for a supervisor', async ({ page }) => {
        await page.goto('/supervisors');
        await expect(page.getByText('Loading...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        const searchInput = page.getByPlaceholder('Search supervisors...');
        await expect(searchInput).toBeVisible();

        // Search for the supervisor created
        await searchInput.fill(supervisorName);

        // Assert only this supervisor is visible
        await expect(page.getByRole('cell', { name: supervisorName })).toBeVisible();

        // Search for a non-existent supervisor
        await searchInput.fill('XYZ_NON_EXISTENT_SUPERVISOR_XYZ');
        await expect(page.getByText('No supervisors found.')).toBeVisible();
    });

    test('5. Delete a supervisor', async ({ page }) => {
        await page.goto('/supervisors');
        await expect(page.getByText('Loading...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Search for the supervisor to ensure we target the right row easily
        const searchInput = page.getByPlaceholder('Search supervisors...');
        await searchInput.fill(supervisorName);

        const supervisorRow = page.getByRole('row').filter({ hasText: supervisorName });
        await expect(supervisorRow).toBeVisible();

        // Setup dialog handler to accept the window.confirm
        page.on('dialog', dialog => dialog.accept());

        // Click delete button
        const deleteBtn = supervisorRow.locator('button.text-red-600');
        await deleteBtn.click();

        // Wait for success toast
        await expect(page.getByText('Supervisor deleted successfully')).toBeVisible({ timeout: 10000 });

        // Assert supervisor is no longer in the list
        await searchInput.fill(''); // Trigger change
        await searchInput.fill(supervisorName);
        await expect(page.getByText('No supervisors found.')).toBeVisible();
    });
});
