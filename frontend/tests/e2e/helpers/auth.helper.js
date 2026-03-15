/**
 * Authentication helper functions for E2E tests
 */

/**
 * Login as a customer user
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} phone - Phone number
 * @param {string} password - Password
 */
export async function loginAsCustomer(page, phone = '0901234567', password = '123456') {
    await page.goto('/login');
    await page.fill('input[name="phone"], input[type="tel"]', phone);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for navigation or dashboard
    await page.waitForURL(/\/(customer-home|customer\/dashboard)/, { timeout: 10000 });
}

/**
 * Login as admin/staff user
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} phone - Phone number
 * @param {string} password - Password
 */
export async function loginAsAdmin(page, phone = '0900000001', password = 'admin123') {
    await page.goto('/login');
    await page.fill('input[name="phone"], input[type="tel"]', phone);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Logout the current user
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function logout(page) {
    // Clear localStorage
    await page.evaluate(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    });
    await page.goto('/login');
}

/**
 * Check if user is logged in
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>}
 */
export async function isLoggedIn(page) {
    return await page.evaluate(() => {
        return !!localStorage.getItem('token');
    });
}

/**
 * Get stored auth token
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string|null>}
 */
export async function getAuthToken(page) {
    return await page.evaluate(() => {
        return localStorage.getItem('token');
    });
}
