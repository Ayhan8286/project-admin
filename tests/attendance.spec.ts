import { test, expect } from '@playwright/test';

test.describe.serial('Module 4: Attendance Module (P0 Flows)', () => {

    const uniqueId = Date.now().toString();
    const teacherName = `AttTeacher ${uniqueId}`;
    const studentName = `AttStudent ${uniqueId}`;

    test('0. Setup: Create Teacher and Student', async ({ page }) => {
        // 1. Create Teacher
        await page.goto('/teachers');
        await expect(page.locator('.shimmer-skeleton').first()).toBeHidden({ timeout: 20000 }).catch(() => { });
        await page.getByRole('button', { name: 'Add Teacher' }).click();

        await expect(page.getByRole('heading', { name: 'Add New Teacher' })).toBeVisible();
        await page.getByLabel(/Name\b/i).fill(teacherName);
        await page.getByLabel(/Staff ID\b/i).fill(`T-${uniqueId}`);
        await page.getByRole('button', { name: 'Save Teacher' }).click();

        // Wait for dialog to close
        await expect(page.getByRole('heading', { name: 'Add New Teacher' })).toBeHidden({ timeout: 15000 });

        await page.waitForTimeout(2000); // Wait for success toast to disappear

        // Wait for teacher in list and navigate to profile. Use a robust locator
        const teacherLink = page.getByRole('link', { name: teacherName });
        await expect(teacherLink).toBeVisible({ timeout: 15000 });
        await teacherLink.click();

        // 2. Create Student
        await expect(page.getByRole('heading', { name: 'Teacher Profile' })).toBeVisible({ timeout: 15000 });
        await page.getByRole('button', { name: 'Create Student' }).click();

        await expect(page.getByRole('heading', { name: 'Add New Student' })).toBeVisible({ timeout: 15000 });
        await page.getByLabel(/Full Name/i).fill(studentName);
        await page.getByLabel(/Registration/i).fill(`REG-${uniqueId}`);
        await page.getByLabel(/Guardian Name/i).fill('Test Guardian');

        await page.waitForTimeout(1000); // Wait for UI to settle
        await page.getByRole('button', { name: 'Save Student' }).click();
        await expect(page.getByRole('heading', { name: 'Add New Student' })).toBeHidden({ timeout: 15000 });

        // Switch to the 'Class List' tab to see the students
        await page.getByRole('tab', { name: /Class List/i }).click();

        // Verify student is shown in the teacher's profile class list
        await expect(page.getByRole('link', { name: studentName })).toBeVisible({ timeout: 15000 });
    });

    test('1. View today\'s attendance table on /attendance', async ({ page }) => {
        await page.goto('/attendance');
        await expect(page.getByRole('heading', { name: 'Attendance Manager' })).toBeVisible();

        // Open the teacher selector (combobox)
        await page.getByRole('combobox').click();

        // Select the teacher we created
        await page.getByRole('option', { name: new RegExp(teacherName, 'i') }).click();

        // Verify the student appears in the attendance list
        await expect(page.getByText(studentName)).toBeVisible({ timeout: 15000 });

        // By default, it initializes to 'Present'
        await expect(page.getByRole('radio', { name: 'Present' }).first()).toHaveAttribute('data-state', 'on');
    });

    test('2. Modify attendance status locally and 3. Submit attendance', async ({ page }) => {
        await page.goto('/attendance');
        await page.getByRole('combobox').click();
        await page.getByRole('option', { name: new RegExp(teacherName, 'i') }).click();
        await expect(page.getByText(studentName)).toBeVisible();

        // Modify attendance status locally (mark as Absent)
        const absentRadio = page.getByRole('radio', { name: 'Absent' }).first();
        await absentRadio.click();

        // Assert it changed locally
        await expect(absentRadio).toHaveAttribute('data-state', 'on');

        // Submit Attendance
        await page.getByRole('button', { name: 'Submit Attendance' }).click();

        // Assert success message or UI update occurs confirming the attendance was recorded
        await expect(page.getByText('Attendance submitted successfully!')).toBeVisible();
    });

    test('4. Navigate to historical attendance records (P1)', async ({ page }) => {
        // Go to main attendance page
        await page.goto('/attendance');
        await expect(page.getByRole('heading', { name: 'Attendance Manager' })).toBeVisible();

        // Find the link to historical records and click it
        const viewRecordsBtn = page.getByRole('link', { name: 'View Records' });
        await expect(viewRecordsBtn).toBeVisible();
        await viewRecordsBtn.click();

        // Assert navigation to the records page
        await page.waitForURL('**/attendance/records', { timeout: 15000 });
        expect(page.url()).toContain('/attendance/records');

        // Assert the historical view renders correctly
        await expect(page.getByRole('heading', { name: 'Attendance Records' })).toBeVisible();
        await expect(page.getByText('View recorded attendance by date')).toBeVisible();
    });
});
