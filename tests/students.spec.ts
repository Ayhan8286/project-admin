import { test, expect } from '@playwright/test';

// Use serial execution because tests depend on state created by previous tests in this suite.
test.describe.serial('Module 2: Student Management (P0 Flows)', () => {

    let studentName: string;
    let regNo: string;
    let guardianName: string;

    test.beforeAll(async ({ }, testInfo) => {
        const uniqueId = `${testInfo.workerIndex}_${Date.now()}`;
        studentName = `Test Student ${uniqueId}`;
        regNo = `REG-${uniqueId}`;
        guardianName = `Guardian ${uniqueId}`;
    });

    test('1. View the list of all students', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err));

        await page.goto('/students');

        // Check if the page heading exists
        await expect(page.getByRole('heading', { name: 'Students', exact: true })).toBeVisible();

        // Check if the "Add Student" button exists
        await expect(page.getByRole('button', { name: 'Add Student' })).toBeVisible();

        // Wait for either the loading spinner to go away or the table to populate
        await expect(page.getByText('Loading students...')).toBeHidden({ timeout: 15000 });

        // The table should have basic headers
        await expect(page.getByRole('columnheader', { name: 'Full Name' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Reg. No.' })).toBeVisible();
    });

    test('2. Add a new student via the AddStudentDialog form', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err));

        await page.goto('/students');
        await expect(page.getByText('Loading students...')).toBeHidden({ timeout: 15000 });

        // Open the dialog
        await page.getByRole('button', { name: 'Add Student' }).click();
        await expect(page.getByRole('heading', { name: 'Add New Student' })).toBeVisible();

        // Fill in the form fields. The labels have asterisks in the component
        await page.getByLabel('Full Name *').fill(studentName);
        await page.getByLabel('Registration No *').fill(regNo);
        await page.getByLabel('Guardian Name *').fill(guardianName);

        // Status defaults to "Active" according to AddStudentDialog.tsx, so we can leave it.

        // Click "Save Student"
        await page.getByRole('button', { name: 'Save Student' }).click();

        await page.waitForTimeout(2000); // give it a moment to show any validation errors

        // The dialog should close upon success
        await expect(page.getByRole('heading', { name: 'Add New Student' })).toBeHidden({ timeout: 15000 });

        // The new student should now appear in the table on the /students page
        // Wait for the UI to update
        await expect(page.getByRole('link', { name: studentName, exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: regNo, exact: true })).toBeVisible();
    });

    test('3. Click on the newly created student\'s name to navigate to details', async ({ page }) => {
        await page.goto('/students');
        await expect(page.getByText('Loading students...')).toBeHidden({ timeout: 15000 });

        // Find the newly created student row and click the link
        const studentLink = page.getByRole('link', { name: studentName, exact: true });
        await expect(studentLink).toBeVisible();

        await studentLink.click();

        // Verify navigation to /students/[id]
        await expect(page).toHaveURL(/\/students\/[0-9a-fA-F-]+/);

        // The detail page should display the student's name
        await expect(page.getByRole('heading', { name: studentName })).toBeVisible();
    });

    test('4. Search input filters the student list correctly (P2)', async ({ page }) => {
        await page.goto('/students');
        await expect(page.getByText('Loading students...')).toBeHidden({ timeout: 15000 });

        // Find the search input field
        const searchInput = page.getByPlaceholder('Search by student name...');
        await expect(searchInput).toBeVisible();

        // Type the unique name of the student into the search bar
        await searchInput.fill(studentName);

        // Assert that the table updates to show ONLY that specific student (or at least that the student is visible)
        await expect(page.getByRole('link', { name: studentName, exact: true })).toBeVisible();

        // Also ensure the empty state is NOT showing, meaning we found a match
        await expect(page.getByText('No students found matching your search.')).toBeHidden();

        // Clear the search bar
        await searchInput.fill('');

        // Assert that the full list of students returns (e.g., student is still visible and no empty state)
        await expect(page.getByRole('link', { name: studentName, exact: true })).toBeVisible();
    });
});
