import { expect, test } from "./fixtures";

// The way back in (ADR-028): the Talent page casts straight into a brief, My ads keeps every ad,
// and "Make another" starts the next brief from an earlier one.

test("the Talent page casts someone in a new brief", async ({ page }) => {
  await page.goto("/talent");

  await expect(page.getByRole("heading", { level: 1, name: "Talent" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(5);
  await page.getByRole("button", { name: /^View Kai Okafor.s profile$/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Release signed/)).toBeVisible();
  await dialog.getByRole("link", { name: /Cast in a new ad/ }).click();

  await expect(page).toHaveURL(/\/\?talent=.+#brief$/);
  await expect(page.getByLabel(/^Cast Kai Okafor/)).toBeChecked();
});

test("My ads keeps each ad, and Make another starts from its brief", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByLabel("Product", { exact: true }).fill("Aero Bottle");
  await page.getByLabel("Why it matters").fill("Keeps water ice-cold through a full day out");
  await page.getByText("Product hero", { exact: true }).click();
  await page.getByRole("button", { name: "Create 3 concepts" }).click();
  await expect(page).toHaveURL(/\/p\/prj_/, { timeout: 60_000 });

  await page.goto("/ads");
  const card = page.getByRole("article").filter({ hasText: "Aero Bottle" });
  await expect(card).toHaveCount(1);
  await card.getByRole("link", { name: /^Make another ad like/ }).click();

  await expect(page).toHaveURL(/\/\?from=prj_/);
  await expect(page.getByLabel("Product", { exact: true })).toHaveValue("Aero Bottle");
  await expect(page.getByRole("radio", { name: /Product hero/ })).toBeChecked();
});

test("on a phone, the tab bar moves between sections", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The tab bar is for phones; wider screens use the header.");
  await page.goto("/");
  const tabs = page.getByRole("navigation", { name: "Main" });

  await tabs.getByRole("link", { name: "Talent" }).click();
  await expect(page).toHaveURL(/\/talent$/);
  await expect(tabs.getByRole("link", { name: "Talent" })).toHaveAttribute("aria-current", "page");

  await tabs.getByRole("link", { name: "My ads" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "My ads" })).toBeVisible();
});
