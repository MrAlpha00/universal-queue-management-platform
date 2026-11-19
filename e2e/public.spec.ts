import { expect, test } from "@playwright/test";

test.describe("marketing and documentation", () => {
  test("renders the landing page with the primary calls to action", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/TokenFlow/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Every appointment.");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One elegant flow.");
    await expect(page.getByRole("link", { name: /Start for free/i })).toHaveAttribute(
      "href",
      "/signup",
    );
    await expect(page.getByRole("link", { name: /See how it works/i })).toHaveAttribute(
      "href",
      "/how-it-works",
    );
  });

  test("navigates to every public information page", async ({ page }) => {
    const pages = [
      "/features",
      "/how-it-works",
      "/platform-capabilities",
      "/about",
      "/contact",
      "/docs",
    ];

    for (const path of pages) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    }
  });

  test("shows the setup guidance on the login screen", async ({ page }) => {
    await page.goto("/login?setup=1");

    await expect(page.getByRole("heading", { name: "Log in to TokenFlow" })).toBeVisible();
    await expect(page.getByText(/Supabase credentials are not configured yet/i)).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("validates the login form before contacting the API", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password must be at least 6 characters")).toBeVisible();
  });

  test("sends protected pages to the login gate", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Log in to TokenFlow" })).toBeVisible();
  });
});
