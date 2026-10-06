import type { Page } from "@playwright/test";

import { expect, test, TINY_PNG } from "./fixtures";

async function writeBrief(page: Page) {
  await page.goto("/");
  await page.getByLabel("Product", { exact: true }).fill("LUMA Vitamin C Serum");
  await page
    .getByLabel("Why it matters")
    .fill("Brighter, more even-looking skin from a two-minute morning routine");
}

// The core loop on fakes (ADR-024): an ad brief with a product photo, polished with AI and cast
// with a talent → three storyboarded concepts → choose one → edit a shot → redraw its frame →
// produce (30 of the guest's 40 credits) → watch it. Generation is asynchronous, so waits are
// generous.
test("ad brief to concepts: polish, cast, storyboard, edit, produce and play", async ({ page }) => {
  test.setTimeout(300_000);

  await writeBrief(page);
  await page
    .getByLabel("Add photo")
    .first()
    .setInputFiles({ name: "luma.png", mimeType: "image/png", buffer: TINY_PNG });
  await expect(page.getByRole("button", { name: "Remove product photo 1" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });

  // Polish with AI: the fake coach suggests a call to action; applying it fills the field.
  await page.getByRole("button", { name: "Polish with AI" }).click();
  await expect(page.getByText("Suggested rewrites")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Apply", exact: true }).first().click();
  await expect(page.getByLabel("Call to action")).toHaveValue("Try LUMA Vitamin C Serum today");

  // Casting is a click on the talent's card, which is the label of a visually hidden radio. The
  // talent wall above the brief shows the same faces, so the click is scoped to the Cast step.
  await page.locator("#cast").getByText("Ava Moreno", { exact: true }).click();
  await expect(page.getByLabel(/^Cast Ava Moreno/)).toBeChecked();
  await page.getByRole("button", { name: "Create 3 concepts" }).click();

  await expect(page).toHaveURL(/\/p\/prj_/, { timeout: 60_000 });
  await expect(page.getByText("Starring Ava Moreno")).toBeVisible();
  await expect(page.getByText(/Storyboards ready/)).toBeVisible({ timeout: 120_000 });
  // Each frame is the button that enlarges it, so count the frames by their pictures.
  await expect(page.locator('img[alt$="in frame"]')).toHaveCount(9);
  await expect(page.getByText("End card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Choose this concept" })).toHaveCount(3);

  // Choosing is a round trip and a refetch: allow for a busy test server.
  await page.getByRole("button", { name: "Choose this concept" }).nth(1).click();
  await expect(page.getByText("Your concept")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Choose this concept" })).toHaveCount(0);

  await page.getByRole("button", { name: "Edit shot 1" }).click();
  await page
    .getByLabel("What the camera sees")
    .fill("Close-up: she holds the bottle beside her cheek as morning light hits the label");
  await page.getByRole("button", { name: "Save shot" }).click();
  await expect(page.getByText("Frame out of date")).toBeVisible();

  await page.getByRole("button", { name: "Redraw frame" }).click();
  await expect(page.getByText("Frame out of date")).toBeHidden({ timeout: 60_000 });

  // Produce: the price is on the button, and the header balance drops when it's reserved.
  await expect(page.getByText("40 credits", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Produce 3 shots · 30 credits" }).click();
  await expect(page.getByText(/Rendering your ad/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("10 credits", { exact: true })).toBeVisible();

  await expect(page.getByText("Your ad is ready. Press play to watch it.")).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByRole("link", { name: /^Download shot/ })).toHaveCount(3);

  // Downloads stream through our route under a friendly name, not the storage key.
  const href = await page.getByRole("link", { name: "Download shot 1" }).getAttribute("href");
  const download = await page.request.get(href ?? "");
  expect(download.ok()).toBe(true);
  expect(download.headers()["content-disposition"]).toMatch(
    /attachment; filename=".+-shot-1\.webm"/,
  );

  // Playback runs the shots back to back.
  await page.getByRole("button", { name: "Play ad" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect
    .poll(() =>
      page.locator("video[data-current]").evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(0.2);
  await expect(page.getByText("Shot 2 of 3")).toBeVisible({ timeout: 20_000 });
});

test("an incomplete brief is explained, not sent", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.getByLabel("Product", { exact: true }).fill("L");
  await page.getByRole("button", { name: "Create 3 concepts" }).click();

  await expect(page.getByText("Name the product in 2 to 60 characters.")).toBeVisible();
  await expect(page.getByText(/Pick a talent: a UGC testimonial needs a person/)).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("a product hero can go without a talent", async ({ page }) => {
  test.setTimeout(90_000);
  await writeBrief(page);
  await page.getByText("Product hero", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /No talent/ })).toBeChecked();

  await page.getByRole("button", { name: "Create 3 concepts" }).click();
  await expect(page).toHaveURL(/\/p\/prj_/, { timeout: 60_000 });
});
