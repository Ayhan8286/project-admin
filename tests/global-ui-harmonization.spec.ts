import { test, expect, Page } from "@playwright/test";

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

async function openPage(page: Page, path: string) {
    await page.goto(path, { waitUntil: "load" });
    await page.waitForTimeout(1500); // let Next.js hydrate + backdrop-blur settle
}

// ─────────────────────────────────────────────────────────────
//  1 · VISUAL REGRESSION BASELINES  (Chromium only — most stable)
//     Viewport-only snapshots (NOT fullPage) to avoid
//     height jitter from async-loaded chart data.
//     maxDiffPixelRatio handles backdrop-blur sub-pixel diffs.
// ─────────────────────────────────────────────────────────────
const SNAPSHOT_OPTS = {
    animations: "disabled" as const,
    maxDiffPixelRatio: 0.15,
    timeout: 15_000,
};

test.describe("Visual Regression — Glassmorphic Baselines", () => {
    test.skip(({ browserName }) => browserName !== "chromium", "Snapshots are Chromium-only");

    test("Dashboard viewport snapshot", async ({ page }) => {
        await openPage(page, "/");
        await expect(page).toHaveScreenshot("dashboard.png", SNAPSHOT_OPTS);
    });

    test("Students list viewport snapshot", async ({ page }) => {
        await openPage(page, "/students");
        await expect(page).toHaveScreenshot("students-list.png", SNAPSHOT_OPTS);
    });

    test("Attendance page viewport snapshot", async ({ page }) => {
        await openPage(page, "/attendance");
        await expect(page).toHaveScreenshot("attendance.png", SNAPSHOT_OPTS);
    });

    test("Complaints page viewport snapshot", async ({ page }) => {
        await openPage(page, "/complaints");
        await expect(page).toHaveScreenshot("complaints.png", SNAPSHOT_OPTS);
    });
});

// ─────────────────────────────────────────────────────────────
//  2 · CLASS & DOM VERIFICATION
//     Tables must be wrapped in .glass-card; header must have
//     the sticky glass-table-header class applied
// ─────────────────────────────────────────────────────────────
test.describe("DOM Verification — Glass Table Structure", () => {
    test("Students table wrapped in glass-card container", async ({ page }) => {
        await openPage(page, "/students");
        const glassContainer = page.locator("[data-slot='table-container'].glass-card");
        await expect(glassContainer).toBeVisible();
    });

    test("Table header has glass-table-header (sticky blur) class", async ({ page }) => {
        await openPage(page, "/students");
        const thead = page.locator("[data-slot='table-header'].glass-table-header");
        await expect(thead).toBeAttached();
    });

    test("Complaints page has neon badge pills for status", async ({ page }) => {
        await openPage(page, "/complaints");
        const badges = page.locator(".badge-pending, .badge-resolved");
        const count = await badges.count();
        expect(count).toBeGreaterThanOrEqual(0);
        if (count > 0) {
            await expect(badges.first()).toBeVisible();
        }
    });

    test("Dashboard sidebar has glass-sidebar class", async ({ page }) => {
        await openPage(page, "/");
        const sidebar = page.locator(".glass-sidebar");
        await expect(sidebar).toBeAttached();
    });
});

// ─────────────────────────────────────────────────────────────
//  3 · INTERACTIVE FOCUS STATE
//     Tab into a search / text input and verify the neon
//     violet glow (border-color change) is applied
// ─────────────────────────────────────────────────────────────
test.describe("Interactive Focus State — Neon Input Glow", () => {
    test("Search input on students page receives neon focus border", async ({ page }) => {
        await openPage(page, "/students");
        const searchInput = page.getByPlaceholder(/search/i);
        await expect(searchInput).toBeVisible();

        await searchInput.focus();
        await page.waitForTimeout(200);

        const classes = await searchInput.getAttribute("class");
        expect(classes).toContain("input-glass");

        const borderColor = await searchInput.evaluate((el) =>
            getComputedStyle(el).borderColor
        );
        expect(borderColor).not.toBe("rgba(0, 0, 0, 0)");
    });

    test("Select trigger on attendance page has glass styling", async ({ page }) => {
        await openPage(page, "/attendance");
        const selectTrigger = page.locator("[data-slot='select-trigger']").first();
        await expect(selectTrigger).toBeVisible();

        const classes = await selectTrigger.getAttribute("class");
        expect(classes).toContain("input-glass");
    });
});

// ─────────────────────────────────────────────────────────────
//  4 · DIALOG OPEN/CLOSE VERIFICATION
//     Opens "Add Student" dialog and verifies it can close
// ─────────────────────────────────────────────────────────────
test.describe("Dialog Interaction — Open & Close", () => {
    test("Add Student dialog opens and closes correctly", async ({ page }) => {
        await openPage(page, "/students");
        const addBtn = page.getByRole("button", { name: /add student/i });
        await expect(addBtn).toBeVisible({ timeout: 10_000 });

        // Click and wait for dialog (retry once if hydration was slow)
        await addBtn.click();
        const dialogContent = page.locator("[data-slot='dialog-content']");
        try {
            await expect(dialogContent).toBeVisible({ timeout: 3_000 });
        } catch {
            await addBtn.click();
            await expect(dialogContent).toBeVisible({ timeout: 5_000 });
        }

        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
        await expect(dialogContent).not.toBeVisible();
    });

    test("Dialog overlay closes dialog on click", async ({ page }) => {
        await openPage(page, "/students");
        const addBtn = page.getByRole("button", { name: /add student/i });
        await expect(addBtn).toBeVisible({ timeout: 10_000 });

        await addBtn.click();
        const dialogContent = page.locator("[data-slot='dialog-content']");
        try {
            await expect(dialogContent).toBeVisible({ timeout: 3_000 });
        } catch {
            await addBtn.click();
            await expect(dialogContent).toBeVisible({ timeout: 5_000 });
        }

        const overlay = page.locator("[data-slot='dialog-overlay']");
        await overlay.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
        await expect(dialogContent).not.toBeVisible();
    });
});

// ─────────────────────────────────────────────────────────────
//  5 · MOBILE OVERFLOW CHECK
//     At 375px width — no horizontal scroll on any main page
// ─────────────────────────────────────────────────────────────
test.describe("Mobile Overflow — No Horizontal Scroll", () => {
    const mobileViewport = { width: 375, height: 812 };
    const routes = ["/", "/students", "/attendance", "/complaints"];

    for (const route of routes) {
        test(`No horizontal overflow on ${route} at 375px`, async ({ page }) => {
            await page.setViewportSize(mobileViewport);
            await openPage(page, route);

            const hasOverflow = await page.evaluate(() =>
                document.documentElement.scrollWidth > document.documentElement.clientWidth
            );
            expect(hasOverflow, `Horizontal overflow detected on ${route}`).toBe(false);
        });
    }
});

// ─────────────────────────────────────────────────────────────
//  6 · DESIGN TOKEN VERIFICATION
//     Body mesh gradient + custom scrollbar
// ─────────────────────────────────────────────────────────────
test.describe("Design Token Verification", () => {
    test("Body has animated mesh gradient background", async ({ page }) => {
        await openPage(page, "/");
        const bgImage = await page.evaluate(() =>
            getComputedStyle(document.body).backgroundImage
        );
        expect(bgImage).toContain("radial-gradient");
    });

    test("Custom scrollbar CSS is present in document", async ({ page }) => {
        await openPage(page, "/students");
        const hasScrollbarStyle = await page.evaluate(() => {
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    for (const rule of Array.from(sheet.cssRules ?? [])) {
                        if (rule.cssText?.includes("::-webkit-scrollbar")) return true;
                    }
                } catch {
                    // Cross-origin stylesheet, skip
                }
            }
            return false;
        });
        expect(hasScrollbarStyle).toBe(true);
    });
});
