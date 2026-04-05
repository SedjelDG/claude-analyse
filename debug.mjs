import { chromium } from "playwright";
import fs from "fs";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];

  page.on("pageerror", (err) => {
    errors.push({ message: err.message, stack: err.stack });
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({ type: "console_error", text: msg.text() });
    }
  });

  await page.goto("http://127.0.0.1:8080/management/products", { waitUntil: "networkidle" });
  
  setTimeout(async () => {
    fs.writeFileSync("error_dump.json", JSON.stringify(errors, null, 2));
    await browser.close();
  }, 2000);
})();
