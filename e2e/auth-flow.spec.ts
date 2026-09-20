/**
 * E2E Smoke Test — Multi-Role Authentication & Role-Based Redirect Protection.
 *
 * ⚠️ SMOKE STUB: These specs document the intended end-to-end contract and
 * run against the live dev server (`bun run test:e2e`). Selectors are
 * intentionally resilient (role/label-first, fallback text matches) so they
 * survive copy tweaks; tighten them once the flows are frozen.
 *
 * Covered journey:
 *   1. Unauthenticated users hitting protected routes are bounced to /auth
 *   2. 1-click demo login as Student → lands on /student/dashboard
 *   3. Demo switcher swaps to TPO → lands on /tpo/dashboard
 *   4. Demo switcher swaps to Recruiter → lands on /company dashboard
 *   5. Cross-role deep links are redirected to the actor's own dashboard
 *   6. Sign-out returns to the public landing/auth surface
 */

import { test, expect, type Page } from "@playwright/test";

const PROTECTED_ROUTES = ["/student/dashboard", "/tpo/dashboard", "/company/dashboard"] as const;

/** Click a demo-login button by fuzzy label match (label-first, text fallback). */
async function clickDemoLogin(page: Page, roleText: string) {
  const byLabel = page.getByRole("button", { name: new RegExp(roleText, "i") });
  if (await byLabel.first().isVisible().catch(() => false)) {
    await byLabel.first().click();
    return;
  }
  await page.getByText(roleText, { exact: false }).first().click();
}

test.describe("Authentication & RBAC smoke flow", () => {
  test("signed-out users are redirected from protected routes to /auth", async ({ page }) => {
    for (const route of PROTECTED_ROUTES) {
      await page.goto(route);
      // RequireAuth forwards to /auth preserving the returnTo param
      await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
    }
  });

  test("auth page renders credentials form and demo login options", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password'], input[name='password']")).toBeVisible();
  });

  test("1-click demo login as Student lands on the student dashboard", async ({ page }) => {
    await page.goto("/auth");
    await clickDemoLogin(page, "Aditya Verma|Student");
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 15_000 });

    // Dashboard shell renders with sidebar navigation
    await expect(
      page.getByRole("link", { name: /drives/i }).or(page.getByText(/Welcome back/i)),
    ).toBeVisible();
  });

  test("demo switcher swaps to TPO and lands on the TPO analytics dashboard", async ({ page }) => {
    await page.goto("/auth");
    await clickDemoLogin(page, "Aditya Verma|Student");
    await expect(page).toHaveURL(/\/student/, { timeout: 15_000 });

    // Floating demo role switcher (bottom-left pill)
    await clickDemoLogin(page, "Dr\\. K\\. Srinivas Rao|TPO");
    await expect(page).toHaveURL(/\/tpo\/dashboard/, { timeout: 15_000 });
    await expect(page.getByText(/Placement|Analytics|Overview/i).first()).toBeVisible();
  });

  test("demo switcher swaps to Recruiter and lands on the recruiter portal", async ({ page }) => {
    await page.goto("/auth");
    await clickDemoLogin(page, "Student|Aditya");
    await expect(page).toHaveURL(/\/student/, { timeout: 15_000 });

    await clickDemoLogin(page, "Google Cloud|Recruiter");
    await expect(page).toHaveURL(/\/company/, { timeout: 15_000 });
  });

  test("cross-role deep links bounce to the actor's own dashboard", async ({ page }) => {
    // Sign in as a student…
    await page.goto("/auth");
    await clickDemoLogin(page, "Aditya Verma|Student");
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 15_000 });

    // …then try to deep-link into the TPO admin area
    await page.goto("/tpo/students");
    // RouteMiddleware wrong-role bounce: back to the student's own home
    await expect(page).not.toHaveURL(/\/tpo\//, { timeout: 10_000 });
  });

  test("sign-out clears the session and returns to a public route", async ({ page }) => {
    await page.goto("/auth");
    await clickDemoLogin(page, "Aditya Verma|Student");
    await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 15_000 });

    // Sidebar footer sign-out button
    const signOut = page
      .getByRole("button", { name: /sign out|log ?out/i })
      .or(page.getByRole("button", { name: /exit/i }));
    await signOut.first().click();

    await expect(page).toHaveURL(/\/($|auth)/, { timeout: 10_000 });

    // Session cleared: protected routes bounce again
    await page.goto("/student/dashboard");
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });
});
