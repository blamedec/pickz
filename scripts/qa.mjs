import { chromium } from "playwright";

const errors = [];

async function capture(name, viewport, actions = async () => {}) {
  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({ viewport });
    page.setDefaultTimeout(7000);
    page.on("console", (msg) => {
      if (["error", "warning"].includes(msg.type())) {
        errors.push(`${name} ${msg.type()}: ${msg.text()}`);
      }
    });
    page.on("pageerror", (error) => errors.push(`${name} pageerror: ${error.message}`));

    const response = await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await actions(page);
    await page.waitForTimeout(450);
    const path = `${process.cwd()}/${name}.png`;
    await page.screenshot({ path, fullPage: true });
    const text = (await page.locator("body").innerText()).slice(0, 900);
    const bonusPick = await page
      .getByLabel("Highest-scoring team bonus")
      .evaluate((select) => select.options[select.selectedIndex]?.text ?? "")
      .catch(() => "");
    const joinedLeagueCount = await page.locator(".joined-league-card").count().catch(() => 0);
    const navLabels = await page.locator(".nav-item span").allTextContents().catch(() => []);
    const firstLeagueRow = await page.locator(".leaderboard .leader-row").first().innerText().catch(() => "");
    return { name, status: response?.status(), path, text, bonusPick, joinedLeagueCount, navLabels, firstLeagueRow };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${name} failed: ${message}`);
    return { name, status: "failed", path: "", text: "", bonusPick: "", joinedLeagueCount: 0, navLabels: [], firstLeagueRow: "" };
  } finally {
    await page?.close().catch(() => {});
    await browser?.close().catch(() => {});
  }
}

const results = [];
results.push(await capture("qa-mobile-rules", { width: 390, height: 844 }));
results.push(
  await capture("qa-mobile-picks", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /I understand, start picking/ }).click();
  }),
);
results.push(
  await capture("qa-mobile-bonus-picks", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /I understand, start picking/ }).click();
    await page.getByLabel("Highest-scoring team bonus").selectOption("eng");
    await page.getByText("Bonus slip").scrollIntoViewIfNeeded();
  }),
);
results.push(
  await capture("qa-mobile-global-table", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /View leaderboards/ }).click();
    await page.getByRole("tab", { name: "Global" }).click();
  }),
);
results.push(
  await capture("qa-mobile-header-league-switch", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /POT26/ }).click();
    await page.locator(".header-join-row input").fill("TOP2");
    await page.locator(".header-join-button").click();
    await page.getByRole("button", { name: /Table/ }).click();
  }),
);
results.push(
  await capture("qa-mobile-league-row-open", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /View leaderboards/ }).click();
    await page.getByRole("button", { name: /Declan/ }).first().click();
  }),
);
results.push(
  await capture("qa-mobile-global-row-open", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /View leaderboards/ }).click();
    await page.getByRole("tab", { name: "Global" }).click();
    await page.getByRole("button", { name: /Nina R/ }).click();
  }),
);
results.push(
  await capture("qa-mobile-selections", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /View leaderboards/ }).click();
    await page.getByRole("tab", { name: "Selections" }).click();
  }),
);
results.push(
  await capture("qa-mobile-dark-live", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /I understand, start picking/ }).click();
    await page.getByLabel("Toggle light and dark mode").click();
    await page.getByRole("button", { name: /Live/ }).click();
  }),
);
results.push(
  await capture("qa-mobile-live-standings", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /I understand, start picking/ }).click();
    await page.getByRole("button", { name: /Live/ }).click();
    await page.getByText("Highest-scoring team").scrollIntoViewIfNeeded();
  }),
);
results.push(
  await capture("qa-mobile-league", { width: 390, height: 844 }, async (page) => {
    await page.getByRole("button", { name: /League/ }).click();
    await page.getByLabel("New league name").fill("Friday Five-a-Side Fund");
    await page.getByLabel("Entry fee per person").fill("15");
    await page.getByRole("button", { name: "Create league" }).click();
    await page.getByLabel("Join with invite code").fill("PUB12");
    await page.getByRole("button", { name: "Join league" }).click();
    await page.locator(".section-kicker").filter({ hasText: "My leagues" }).scrollIntoViewIfNeeded();
  }),
);
results.push(
  await capture("qa-desktop", { width: 1440, height: 1000 }, async (page) => {
    await page.getByRole("button", { name: /Table/ }).click();
  }),
);

console.log(JSON.stringify({ results, errors }, null, 2));
