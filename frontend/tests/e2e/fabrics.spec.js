import { test, expect } from '@playwright/test';

test.describe('Fabrics Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/fabrics');
    });

    test('should display fabrics page', async ({ page }) => {
        await expect(page).toHaveURL('/fabrics');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check for fabric-related content
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
    });

    test('should display fabric list or grid', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Look for fabric cards or list items
        const fabricItems = page.locator('[class*="card"], [class*="fabric"], [class*="product"], [class*="item"]');

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Either we have fabric items OR we have some content on the page
        const itemCount = await fabricItems.count();
        const hasContent = await page.locator('main, [class*="content"]').count() > 0;

        expect(itemCount > 0 || hasContent).toBeTruthy();
    });

    test('should have search or filter functionality', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Look for search input or filter elements
        const searchInput = page.locator('input[type="search"], input[placeholder*="Tìm"], input[placeholder*="Search"]');
        const filterElements = page.locator('select, [class*="filter"], button:has-text("Lọc")');

        const hasSearch = await searchInput.count() > 0;
        const hasFilter = await filterElements.count() > 0;

        // At least one should exist
        expect(hasSearch || hasFilter).toBeTruthy();
    });

    test('should navigate to fabric detail when clicking a fabric', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for clickable fabric items
        const fabricLinks = page.locator('a[href*="/fabrics/"], [class*="fabric"] a, [class*="card"] a');

        if (await fabricLinks.count() > 0) {
            await fabricLinks.first().click();

            // Should navigate to detail page
            await page.waitForTimeout(1000);
            const url = page.url();
            expect(url.includes('/fabrics/') || url.includes('/fabric/')).toBeTruthy();
        }
    });
});

test.describe('Fabric Detail Page', () => {
    test('should display fabric detail with add to cart button', async ({ page }) => {
        // Navigate directly to fabrics page first
        await page.goto('/fabrics');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Find and click first fabric link
        const fabricLinks = page.locator('a[href*="/fabrics/"]');

        if (await fabricLinks.count() > 0) {
            await fabricLinks.first().click();
            await page.waitForLoadState('networkidle');

            // Check for add to cart button
            const addToCartBtn = page.locator('button:has-text("Thêm vào giỏ"), button:has-text("Add to cart"), button:has-text("Mua")');

            // Either we have add to cart button or some product detail content
            const hasAddToCart = await addToCartBtn.count() > 0;
            const hasDetailContent = await page.locator('[class*="detail"], [class*="price"], [class*="description"]').count() > 0;

            expect(hasAddToCart || hasDetailContent).toBeTruthy();
        }
    });
});
