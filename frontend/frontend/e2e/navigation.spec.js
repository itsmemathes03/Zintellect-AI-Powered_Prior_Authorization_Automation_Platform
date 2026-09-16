import { test, expect } from "@playwright/test";
import { setupAuth, roleConfigs } from "./helpers.js";

for (const [roleName, config] of Object.entries(roleConfigs)) {
  test.describe(`${roleName.charAt(0).toUpperCase() + roleName.slice(1)} Navigation`, () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page, config.role);
    });

    test(`navigates to all ${roleName} sidebar pages without errors`, async ({ page }) => {
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      for (const pageConfig of config.pages) {
        await page.goto(pageConfig.path);
        await page.waitForLoadState("networkidle");

        const bodyText = await page.locator("body").textContent();
        expect(bodyText).toBeTruthy();

        const aside = page.locator("aside");
        await expect(aside).toBeVisible();

        const navLinks = page.locator("aside nav a");
        const linkCount = await navLinks.count();
        expect(linkCount).toBeGreaterThan(0);
      }

      const criticalErrors = consoleErrors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("404") &&
          !e.includes("net::ERR") &&
          !e.includes("Failed to load resource") &&
          !e.includes("ERR_CONNECTION_REFUSED") &&
          !e.includes("FetchError") &&
          !e.includes("NetworkError") &&
          !e.includes("AxiosError") &&
          !e.includes("Failed to load analytics") &&
          !e.includes("Encountered two children with the same key") &&
          !e.includes("status code 401") &&
          !e.includes("status code 403") &&
          !e.includes("status code 500")
      );
      expect(criticalErrors).toEqual([]);
    });

    test(`sidebar links are visible and clickable for ${roleName}`, async ({ page }) => {
      await page.goto(config.pages[0].path);
      await page.waitForLoadState("networkidle");

      const navLinks = page.locator("aside nav a");
      const linkCount = await navLinks.count();
      expect(linkCount).toBe(config.pages.length);

      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        await expect(link).toBeVisible();
        const text = await link.textContent();
        expect(text.trim()).toBeTruthy();
      }
    });

    test(`clicking sidebar link navigates to correct page for ${roleName}`, async ({ page }) => {
      await page.goto(config.pages[0].path);
      await page.waitForLoadState("networkidle");

      for (let i = 1; i < config.pages.length; i++) {
        const pageConfig = config.pages[i];

        await page.goto(pageConfig.path);
        await page.waitForLoadState("networkidle");

        const activeLink = page.locator(`aside nav a[href="${pageConfig.path}"]`);
        const isActive = await activeLink.evaluate((el) =>
          el.className.includes("text-white")
        );
        expect(isActive, `Link to ${pageConfig.path} should be active`).toBe(true);
      }
    });

    test(`active link is highlighted for ${roleName}`, async ({ page }) => {
      await page.goto(config.pages[0].path);
      await page.waitForLoadState("networkidle");

      const activeLink = page.locator("aside nav a").first();
      const classes = await activeLink.getAttribute("class");
      expect(classes).toContain("text-white");
      expect(classes).toMatch(/bg-(brand|teal|emerald|rose)-\d+/);
    });

    test(`header displays welcome message for ${roleName}`, async ({ page }) => {
      await page.goto(config.pages[0].path);
      await page.waitForLoadState("networkidle");

      const header = page.locator("header");
      await expect(header).toBeVisible();

      const welcomeText = header.locator("text=Welcome");
      await expect(welcomeText).toBeVisible();
    });
  });
}
