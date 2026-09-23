import { expect, test } from "@playwright/test";

test("a signed-out visitor lands on the brief page", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Describe the film");
  await expect(page.getByLabel("What's your film about?")).toBeVisible();
  await expect(page.getByRole("radio", { name: /16:9/ })).toBeChecked();
  expect(consoleErrors).toEqual([]);
});

test("style chips toggle and cap at three", async ({ page }) => {
  await page.goto("/");

  const chips = ["Noir", "Dreamy", "Documentary", "Commercial"];
  for (const name of chips) {
    await page.getByRole("button", { name }).click();
  }

  await expect(page.getByRole("button", { name: "Noir" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Commercial" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
