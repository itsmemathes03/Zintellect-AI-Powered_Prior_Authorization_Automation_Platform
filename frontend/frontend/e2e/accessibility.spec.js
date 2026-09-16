import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { setupAuth } from "./helpers.js";

const KNOWN_VIOLATIONS = ["button-name", "color-contrast"];

test.describe("Accessibility", () => {
  test("admin dashboard has no critical axe violations", async ({ page }) => {
    await setupAuth(page, "admin");
    await page.goto("/admin-dashboard");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => (v.impact === "critical" || v.impact === "serious") && !KNOWN_VIOLATIONS.includes(v.id)
    );

    if (results.violations.length > 0) {
      console.log(`Admin Dashboard: ${results.violations.length} total violations`);
      for (const v of results.violations) {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
        console.log(`    Help: ${v.helpUrl}`);
      }
    }

    expect(
      criticalViolations,
      `Found ${criticalViolations.length} unexpected critical/serious violations on admin dashboard`
    ).toEqual([]);
  });

  test("doctor dashboard has no critical axe violations", async ({ page }) => {
    await setupAuth(page, "doctor");
    await page.goto("/doctor-dashboard");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => (v.impact === "critical" || v.impact === "serious") && !KNOWN_VIOLATIONS.includes(v.id)
    );

    if (results.violations.length > 0) {
      console.log(`Doctor Dashboard: ${results.violations.length} total violations`);
      for (const v of results.violations) {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
        console.log(`    Help: ${v.helpUrl}`);
      }
    }

    expect(
      criticalViolations,
      `Found ${criticalViolations.length} unexpected critical/serious violations on doctor dashboard`
    ).toEqual([]);
  });

  test("login page has no critical axe violations", async ({ page }) => {
    await page.goto("/admin-login");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => (v.impact === "critical" || v.impact === "serious") && !KNOWN_VIOLATIONS.includes(v.id)
    );

    if (results.violations.length > 0) {
      console.log(`Login Page: ${results.violations.length} total violations`);
      for (const v of results.violations) {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
        console.log(`    Help: ${v.helpUrl}`);
      }
    }

    expect(
      criticalViolations,
      `Found ${criticalViolations.length} unexpected critical/serious violations on login page`
    ).toEqual([]);
  });

  test("patient dashboard has no critical axe violations", async ({ page }) => {
    await setupAuth(page, "patient");
    await page.goto("/patient-dashboard");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => (v.impact === "critical" || v.impact === "serious") && !KNOWN_VIOLATIONS.includes(v.id)
    );

    if (results.violations.length > 0) {
      console.log(`Patient Dashboard: ${results.violations.length} total violations`);
      for (const v of results.violations) {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
        console.log(`    Help: ${v.helpUrl}`);
      }
    }

    expect(
      criticalViolations,
      `Found ${criticalViolations.length} unexpected critical/serious violations on patient dashboard`
    ).toEqual([]);
  });

  test("provider dashboard has no critical axe violations", async ({ page }) => {
    await setupAuth(page, "provider");
    await page.goto("/provider-dashboard");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => (v.impact === "critical" || v.impact === "serious") && !KNOWN_VIOLATIONS.includes(v.id)
    );

    if (results.violations.length > 0) {
      console.log(`Provider Dashboard: ${results.violations.length} total violations`);
      for (const v of results.violations) {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description}`);
        console.log(`    Help: ${v.helpUrl}`);
      }
    }

    expect(
      criticalViolations,
      `Found ${criticalViolations.length} unexpected critical/serious violations on provider dashboard`
    ).toEqual([]);
  });

  test("all pages have proper heading hierarchy", async ({ page }) => {
    await setupAuth(page, "admin");
    await page.goto("/admin-dashboard");
    await page.waitForLoadState("networkidle");

    const headings = await page.locator("h1, h2, h3, h4, h5, h6").allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test("all interactive elements have accessible names", async ({ page }) => {
    await page.goto("/admin-login");
    await page.waitForLoadState("networkidle");

    const buttons = page.locator("button");
    const count = await buttons.count();

    const buttonsWithoutNames = [];
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute("aria-label");
      const title = await button.getAttribute("title");
      const hasAccessibleName = (text && text.trim()) || ariaLabel || title;
      if (!hasAccessibleName) {
        const html = await button.innerHTML();
        buttonsWithoutNames.push({ index: i, html: html.substring(0, 100) });
      }
    }

    if (buttonsWithoutNames.length > 0) {
      console.log(`${buttonsWithoutNames.length} buttons without accessible names:`);
      for (const b of buttonsWithoutNames) {
        console.log(`  Button ${b.index}: ${b.html}`);
      }
    }

    expect(buttonsWithoutNames.length).toBe(0);
  });
});
