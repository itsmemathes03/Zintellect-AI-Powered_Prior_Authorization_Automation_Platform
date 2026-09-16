import { test, expect } from "@playwright/test";
import { setupAuth, roleConfigs } from "./helpers.js";

async function injectScrollableContent(page) {
  await page.evaluate(() => {
    const main = document.querySelector("main");
    if (main) {
      const filler = document.createElement("div");
      filler.style.height = "3000px";
      filler.style.background = "linear-gradient(to bottom, transparent, #ccc)";
      main.appendChild(filler);
    }
    const nav = document.querySelector("aside nav");
    if (nav) {
      for (let i = 0; i < 30; i++) {
        const item = document.createElement("a");
        item.href = "#";
        item.textContent = `Extra Nav Item ${i}`;
        item.className = "block px-4 py-3 text-sm text-slate-600";
        nav.appendChild(item);
      }
    }
  });
}

for (const [roleName, config] of Object.entries(roleConfigs)) {
  test.describe(`${roleName.charAt(0).toUpperCase() + roleName.slice(1)} Scroll Independence`, () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page, config.role);
      await page.goto(config.pages[0].path);
      await page.waitForLoadState("networkidle");
      await injectScrollableContent(page);
    });

    test(`scrolling sidebar does not affect main content position for ${roleName}`, async ({ page }) => {
      const main = page.locator("main");
      const mainScrollBefore = await main.evaluate((el) => el.scrollTop);

      const sidebarNav = page.locator("aside nav");
      await sidebarNav.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(300);

      const mainScrollAfter = await main.evaluate((el) => el.scrollTop);
      expect(mainScrollAfter).toBe(mainScrollBefore);
    });

    test(`scrolling main content does not affect sidebar position for ${roleName}`, async ({ page }) => {
      const sidebarNav = page.locator("aside nav");
      const sidebarScrollBefore = await sidebarNav.evaluate((el) => el.scrollTop);

      const main = page.locator("main");
      await main.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(300);

      const sidebarScrollAfter = await sidebarNav.evaluate((el) => el.scrollTop);
      expect(sidebarScrollAfter).toBe(sidebarScrollBefore);
    });

    test(`sidebar remains fixed when main scrolls for ${roleName}`, async ({ page }) => {
      const aside = page.locator("aside");
      const asideBoxBefore = await aside.boundingBox();

      const main = page.locator("main");
      await main.evaluate((el) => {
        el.scrollTop = 500;
      });
      await page.waitForTimeout(300);

      const asideBoxAfter = await aside.boundingBox();
      expect(asideBoxAfter.x).toBe(asideBoxBefore.x);
      expect(asideBoxAfter.y).toBe(asideBoxBefore.y);
    });

    test(`main content scrolls independently for ${roleName}`, async ({ page }) => {
      const main = page.locator("main");

      const scrollTopBefore = await main.evaluate((el) => el.scrollTop);
      expect(scrollTopBefore).toBe(0);

      await main.evaluate((el) => {
        el.scrollTop = 200;
      });
      await page.waitForTimeout(300);

      const scrollTopAfter = await main.evaluate((el) => el.scrollTop);
      expect(scrollTopAfter).toBeGreaterThan(0);
    });
  });
}
