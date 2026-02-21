import { test, expect } from '@playwright/test';

test.describe('Module 1: Dashboard (P0 Flows)', () => {

    test('1. Dashboard loads and renders the Main Stats Grid', async ({ page }) => {
        await page.goto('/');

        // --- Page Heading ---
        await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
        await expect(page.getByText('Welcome to the School Management System.')).toBeVisible();

        // --- Wait for all loading spinners to disappear ---
        // The dashboard shows ShimmerBlock/LoadingShimmer while data is fetching
        await expect(page.locator('.shimmer-skeleton').first()).toBeHidden({ timeout: 20000 }).catch(() => { });

        // --- Main Stats Grid: 5 stat card titles ---
        await expect(page.getByText('Total Students')).toBeVisible();
        await expect(page.getByText('Active Teachers')).toBeVisible();
        await expect(page.getByText('Total Classes')).toBeVisible();
        await expect(page.getByText('Active Students')).toBeVisible();
        await expect(page.getByText('Attendance Today')).toBeVisible();

        // --- Main Stats Grid: card descriptions ---
        await expect(page.getByText('Enrolled in the system')).toBeVisible();
        await expect(page.getByText('Currently teaching')).toBeVisible();
        await expect(page.getByText('Student-teacher assignments')).toBeVisible();
        await expect(page.getByText('Students present today')).toBeVisible();

        // --- Secondary Widgets ---
        await expect(page.getByText('Students by Shift')).toBeVisible();
        await expect(page.getByText("Today's Attendance")).toBeVisible();
        await expect(page.getByText('Daily Teaching Hours')).toBeVisible();

        // --- Today's Attendance widget breakdown labels ---
        // Scoped to the card that contains the attendance widget
        const attendanceCard = page.locator('a[href="/attendance/today"]');
        await expect(attendanceCard.getByText('Present')).toBeVisible();
        await expect(attendanceCard.getByText('Absent')).toBeVisible();
        await expect(attendanceCard.getByText('Late')).toBeVisible();
        await expect(attendanceCard.getByText('Leave')).toBeVisible();

        // --- Daily Teaching Hours: day labels ---
        await expect(page.getByText('Mon')).toBeVisible();
        await expect(page.getByText('Fri')).toBeVisible();
    });

    test('2. Navigation links from dashboard widgets work correctly (P1)', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

        // Wait for loading to finish
        await expect(page.locator('.shimmer-skeleton').first()).toBeHidden({ timeout: 20000 }).catch(() => { });

        // --- Link 1: "Today's Attendance" widget → /attendance/today ---
        const attendanceLink = page.locator('a[href="/attendance/today"]');
        await expect(attendanceLink).toBeVisible();
        await attendanceLink.click();
        await page.waitForURL('**/attendance/today', { timeout: 15000 });
        expect(page.url()).toContain('/attendance/today');

        // --- Go back to dashboard ---
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

        // --- Link 2: Sidebar "Students" link → /students ---
        const studentsLink = page.locator('nav a[href="/students"]');
        await expect(studentsLink).toBeVisible();
        await studentsLink.click();
        await page.waitForURL('**/students', { timeout: 15000 });
        expect(page.url()).toContain('/students');
    });
});
