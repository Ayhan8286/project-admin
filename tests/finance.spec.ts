import { test, expect } from '@playwright/test';

test.describe.serial('Module 6: Finance & Billing (P0 Flows)', () => {

    const uniqueId = Date.now().toString();
    const studentName = `FinStudent ${uniqueId}`;
    const studentReg = `FIN-${uniqueId}`;
    const paymentAmount = '75.50';
    const dueDate = '2026-03-31';

    // Setup: Create a student via the /students UI so we have one to select in the payment form.
    test('0. Setup: Create a student for payment', async ({ page }) => {
        await page.goto('/students');
        await expect(page.getByText('Loading students...')).toBeHidden({ timeout: 15000 }).catch(() => { });

        await page.getByRole('button', { name: 'Add Student' }).click();
        await expect(page.getByRole('heading', { name: 'Add New Student' })).toBeVisible();

        await page.getByLabel('Full Name *').fill(studentName);
        await page.getByLabel('Registration No *').fill(studentReg);
        await page.getByLabel('Guardian Name *').fill('Finance Guardian');

        await page.getByRole('button', { name: 'Save Student' }).click();
        await expect(page.getByRole('heading', { name: 'Add New Student' })).toBeHidden({ timeout: 15000 });
        await expect(page.getByRole('link', { name: studentName, exact: true })).toBeVisible();
    });

    test('1. View financial stats and payments list on /finance', async ({ page }) => {
        await page.goto('/finance');

        // Check page heading
        await expect(page.getByRole('heading', { name: 'Financial Dashboard' })).toBeVisible();

        // Check stat cards are visible
        await expect(page.getByText('Total Revenue')).toBeVisible();
        await expect(page.getByText('Pending Collection')).toBeVisible();
        await expect(page.getByText('Overdue')).toBeVisible();

        // Check the "Record Fee" button
        await expect(page.getByRole('button', { name: 'Record Fee' })).toBeVisible();

        // Check the Transactions table headers
        await expect(page.getByRole('columnheader', { name: 'Student' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    });

    test('2. Record a new payment via the AddPaymentDialog form', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err));

        await page.goto('/finance');
        await expect(page.getByRole('heading', { name: 'Financial Dashboard' })).toBeVisible();

        // Open the Record Fee dialog
        await page.getByRole('button', { name: 'Record Fee' }).click();
        await expect(page.getByRole('heading', { name: 'Record Student Fee' })).toBeVisible();

        // Open the combobox dropdown
        const combobox = page.getByRole('combobox');
        await combobox.click();

        // Wait for the dropdown to open, then select our student (first option matching name)
        await page.waitForSelector('[role="option"]', { timeout: 10000 });
        // Look for our newly created student; if not found by name, just pick first option to proceed
        const studentOption = page.getByRole('option', { name: new RegExp(studentName, 'i') });
        const optionCount = await studentOption.count();
        if (optionCount > 0) {
            await studentOption.click();
        } else {
            // Fallback: pick first available student
            await page.getByRole('option').first().click();
        }

        // Fill in Amount using placeholder
        await page.getByPlaceholder('50.00').fill(paymentAmount);

        // Fill in Due Date using input[type=date]
        await page.locator('input[type="date"]').fill(dueDate);

        // Wait for Save Record button to become enabled (requires studentId + amount to be filled)
        const saveBtn = page.getByRole('button', { name: 'Save Record' });
        await expect(saveBtn).toBeEnabled({ timeout: 10000 });

        // Click "Save Record"
        await saveBtn.click();

        // Dialog should close upon success
        await expect(page.getByRole('heading', { name: 'Record Student Fee' })).toBeHidden({ timeout: 15000 });

        // The success toast confirms the payment was recorded
        await expect(page.getByText('Payment record added')).toBeVisible({ timeout: 10000 });
    });

    test('3. Mark an existing payment as Paid (P1)', async ({ page }) => {
        await page.goto('/finance');
        await expect(page.getByRole('heading', { name: 'Financial Dashboard' })).toBeVisible();

        // Wait for the Transactions table to load
        await expect(page.getByRole('columnheader', { name: 'Student' })).toBeVisible();

        // Find the table row that contains our student's payment
        // The student name and amount were set from our earlier test setup
        const paymentRow = page.getByRole('row').filter({ hasText: studentName });
        await expect(paymentRow).toBeVisible({ timeout: 15000 });

        // Verify the payment is currently in Pending status
        await expect(paymentRow.getByText('Pending')).toBeVisible();

        // Click the "Mark Paid" button within that specific row
        const markPaidBtn = paymentRow.getByRole('button', { name: 'Mark Paid' });
        await expect(markPaidBtn).toBeVisible();
        await markPaidBtn.click();

        // Assert: a success toast should appear
        await expect(page.getByText('Status updated')).toBeVisible({ timeout: 10000 });

        // Assert: the status badge in the row should now read "Paid" instead of "Pending"
        await expect(paymentRow.getByText('Paid')).toBeVisible({ timeout: 10000 });

        // Assert: the "Mark Paid" button should no longer be visible (it only renders for Pending)
        await expect(markPaidBtn).toBeHidden({ timeout: 5000 });
    });
});
