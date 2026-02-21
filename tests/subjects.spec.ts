import { test, expect } from '@playwright/test';

test.describe.serial('Module 7: Subject & Course Management (P0 Flows)', () => {

    const uniqueId = Date.now().toString();
    const courseName = `Course-${uniqueId}`;

    test('1. View the list of subjects/courses on /subjects', async ({ page }) => {
        await page.goto('/subjects');

        // Check heading
        await expect(page.getByRole('heading', { name: 'Subjects', exact: true })).toBeVisible();

        // Check the "Add Subject" button exists
        await expect(page.getByRole('button', { name: 'Add Subject' })).toBeVisible();

        // Wait for the loading state to disappear
        await expect(page.getByText('Loading subjects...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Either there's a course list or the empty state message
        const hasCourses = await page.getByText('Click to view students').count();
        const hasEmpty = await page.getByText('No subjects found').count();
        expect(hasCourses + hasEmpty).toBeGreaterThan(0);
    });

    test('2. Create a new subject via the Add Subject dialog', async ({ page }) => {
        await page.goto('/subjects');
        await expect(page.getByText('Loading subjects...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Open the dialog
        await page.getByRole('button', { name: 'Add Subject' }).click();
        await expect(page.getByRole('heading', { name: 'Add New Subject' })).toBeVisible();

        // Type the new course name into the Name input
        await page.getByPlaceholder('e.g. Quran Reading').fill(courseName);

        // Click "Save Subject"
        await page.getByRole('button', { name: 'Save Subject' }).click();

        // Dialog should close upon success
        await expect(page.getByRole('heading', { name: 'Add New Subject' })).toBeHidden({ timeout: 15000 });

        // The new course card should now appear in the grid
        await expect(page.getByText(courseName)).toBeVisible({ timeout: 10000 });
    });

    test('3. Expand a course to view enrolled students (P1)', async ({ page }) => {
        await page.goto('/subjects');
        await expect(page.getByText('Loading subjects...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        // Find the specific course card created in the previous step and click it
        const courseCard = page.locator('.cursor-pointer', { hasText: courseName });
        await expect(courseCard).toBeVisible();
        await courseCard.click();

        // Assert that the expanded details section (Student list view) becomes visible
        await expect(page.getByRole('heading', { name: `${courseName} Students` })).toBeVisible();

        // Assert the empty state message is visible inside the expanded area
        await expect(page.getByText('No students found for this subject.')).toBeVisible();

        // Go back to the subjects list
        await page.locator('button').filter({ has: page.locator('.lucide-arrow-left') }).click();

        // Assert we are back on the subjects page
        await expect(page.getByRole('heading', { name: 'Subjects', exact: true })).toBeVisible();
    });
});
