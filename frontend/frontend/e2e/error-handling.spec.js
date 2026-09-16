import { test, expect } from "@playwright/test";

test.describe("Error Handling UX", () => {
  test.describe("Form Validation", () => {
    test("submitting admin login form with empty fields shows validation message", async ({ page }) => {
      await page.goto("/admin-login");
      await page.waitForLoadState("networkidle");

      const loginButton = page.locator("button:has-text('Admin Login')");
      await loginButton.click();

      const errorMessage = page.locator("text=Please enter your email and password");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("submitting doctor login form with empty fields shows validation message", async ({ page }) => {
      await page.goto("/doctor-login");
      await page.waitForLoadState("networkidle");

      const loginButton = page.locator("button:has-text('Doctor Login'), button:has-text('Login')");
      await loginButton.click();

      const errorMessage = page.locator("text=Please fill all fields");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("submitting patient login form with empty fields shows validation message", async ({ page }) => {
      await page.goto("/patient-login");
      await page.waitForLoadState("networkidle");

      const loginButton = page.locator("button:has-text('Patient Login')");
      await loginButton.click();

      const errorMessage = page.locator("text=Please enter email and password");
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test("submitting provider login form with empty fields shows validation toast", async ({ page }) => {
      await page.goto("/provider-login");
      await page.waitForLoadState("networkidle");

      const loginButton = page.locator("button:has-text('Provider Login')");
      await loginButton.click();

      const toastMessage = page.locator("text=Please fill all fields");
      await expect(toastMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Non-existent Pages", () => {
    test("navigating to non-existent page shows error state, not raw error", async ({ page }) => {
      await page.goto("/this-page-does-not-exist-12345");
      await page.waitForLoadState("networkidle");

      const bodyText = await page.locator("body").textContent();

      expect(bodyText).not.toContain("AxiosError");
      expect(bodyText).not.toContain("TypeError");
      expect(bodyText).not.toContain("Cannot read properties");
      expect(bodyText).not.toContain("undefined is not");
      expect(bodyText).not.toContain("Uncaught");
    });

    test("navigating to deeply nested non-existent route shows error state", async ({ page }) => {
      await page.goto("/admin-dashboard/nonexistent/deep/route");
      await page.waitForLoadState("networkidle");

      const bodyText = await page.locator("body").textContent();

      expect(bodyText).not.toContain("AxiosError");
      expect(bodyText).not.toContain("TypeError");
      expect(bodyText).not.toContain("localhost:");
    });
  });

  test.describe("No Raw Technical Errors", () => {
    test("login pages do not display raw error text", async ({ page }) => {
      const loginPages = ["/admin-login", "/doctor-login", "/patient-login", "/provider-login"];

      for (const loginPage of loginPages) {
        await page.goto(loginPage);
        await page.waitForLoadState("networkidle");

        const bodyText = await page.locator("body").textContent();

        expect(bodyText).not.toContain("AxiosError");
        expect(bodyText).not.toContain("422");
        expect(bodyText).not.toContain("localhost");
        expect(bodyText).not.toContain("ECONNREFUSED");
        expect(bodyText).not.toContain("fetch failed");
      }
    });

    test("dashboard pages do not display raw error text when not authenticated", async ({ page }) => {
      const dashboards = [
        "/admin-dashboard",
        "/doctor-dashboard",
        "/patient-dashboard",
        "/provider-dashboard",
      ];

      for (const dashboard of dashboards) {
        await page.goto(dashboard);
        await page.waitForLoadState("networkidle");

        const bodyText = await page.locator("body").textContent();

        expect(bodyText).not.toContain("AxiosError");
        expect(bodyText).not.toContain("TypeError");
        expect(bodyText).not.toContain("Cannot read properties");
      }
    });
  });

  test.describe("ErrorBoundary Fallback", () => {
    test("error boundary shows friendly message, not stack trace", async ({ page }) => {
      await page.goto("/admin-login");
      await page.waitForLoadState("networkidle");

      const pageContent = await page.content();

      expect(pageContent).not.toMatch(/at\s+\w+\s*\(/);
      expect(pageContent).not.toMatch(/at\s+.*\.js:\d+:\d+/);
      expect(pageContent).not.toContain("stack trace");
    });
  });
});
