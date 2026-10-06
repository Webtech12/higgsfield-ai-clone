import { expect, test } from "./fixtures";

test("a first-time visitor lands on the talent wall and the brief", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cast an icon");
  await expect(page.getByRole("radio", { name: /UGC testimonial/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /9:16/ })).toBeChecked();
  await expect(page.getByLabel(/^Cast /)).toHaveCount(5);
  expect(consoleErrors).toEqual([]);
});

test("clicking a face on the wall casts them in the brief", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Kai Okafor: cast in your ad" }).first().click();

  await expect(page.getByLabel(/^Cast Kai Okafor/)).toBeChecked();
});

test("mood chips sit under More direction, and cap at three", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /More direction/ }).click();

  for (const name of ["Energetic", "Premium", "Warm"]) {
    await page.getByRole("button", { name }).click();
  }

  await expect(page.getByRole("button", { name: "Energetic" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Playful" })).toBeDisabled();
});

test("a talent's profile shows their consent on file", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "View profile" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Release signed/)).toBeVisible();
  await dialog.getByRole("button", { name: /^Cast / }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByLabel(/^Cast /).first()).toBeChecked();
});
