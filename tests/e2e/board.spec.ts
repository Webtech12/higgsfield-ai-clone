import { expect, test } from "@playwright/test";

// The S2 journey on fakes: brief → three storyboarded directions → choose one → edit a shot →
// redraw its frame. Generation is asynchronous, so waits are generous.
test("brief to board: choose a direction, edit a shot and redraw its frame", async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto("/");
  await page
    .getByLabel("What's your film about?")
    .fill("A lighthouse keeper finds a message in a bottle from her future self");
  await page.getByRole("button", { name: "Direct it" }).click();

  await expect(page).toHaveURL(/\/p\/prj_/, { timeout: 60_000 });
  await expect(page.getByText(/Storyboards ready/)).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole("img")).toHaveCount(9);
  await expect(page.getByRole("button", { name: "Choose this direction" })).toHaveCount(3);

  await page.getByRole("button", { name: "Choose this direction" }).nth(1).click();
  await expect(page.getByText("Your direction")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose this direction" })).toHaveCount(0);

  await page.getByRole("button", { name: "Edit shot 1" }).click();
  await page
    .getByLabel("What the camera sees")
    .fill("Rain streaks across the lamp glass as she reads");
  await page.getByRole("button", { name: "Save shot" }).click();
  await expect(page.getByText("Frame out of date")).toBeVisible();

  await page.getByRole("button", { name: "Redraw frame" }).click();
  await expect(page.getByText("Frame out of date")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByText("Rain streaks across the lamp glass as she reads")).toBeVisible();
});

test("a brief that is too short is explained, not sent", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("What's your film about?").fill("A film");
  await page.getByRole("button", { name: "Direct it" }).click();

  await expect(page.getByText(/at least 12 characters/)).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
