import fs from "fs";
import path from "path";
import { chromium } from "patchright";

const SITE_URL = "https://speechsynthesis.online/";

export async function tts(text, outputFile = "output.mp3", voice = "kk-KZ-DauletNeural", lang = "kk-KZ") {
  const TEMP_PROFILE = path.resolve(`./temp_profile_${Date.now()}`);
  if (!fs.existsSync(TEMP_PROFILE)) fs.mkdirSync(TEMP_PROFILE, { recursive: true });

  console.log("🚀 Таза браузер іске қосылуда (Жарнамасыз)...");
  
  const browser = await chromium.launchPersistentContext(TEMP_PROFILE, {
    channel: "chromium",
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars"
    ],
    ignoreDefaultArgs: ["--enable-automation"]
  });

  const page = await browser.newPage();

  await page.route("**/*", (route) => {
    const url = route.request().url();
    const ads = ["google-analytics", "doubleclick", "googleads", "adsbygoogle", "googletagmanager", "gpt.js"];
    if (ads.some(ad => url.includes(ad))) {
      return route.abort();
    }
    return route.continue();
  });

  await page.route("**/synthesis", async (route) => {
    if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON();
      if (payload && payload.ssml) {
        payload.ssml = payload.ssml.replace(/xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, '');
        return route.continue({ postData: payload });
      }
    }
    return route.continue();
  });

  try {
    console.log("🌐 Сайтқа өту...");
    await page.goto(SITE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("🌍 Параметрлер...");
    const langSelect = page.locator('div.flex.flex-col:has(label[for="language"]) select').first();
    await langSelect.waitFor({ state: "visible" });
    await langSelect.selectOption(lang);
    
    const voiceSelect = page.locator('div.grow:has(label[for="voice"]) select').first();
    await page.waitForFunction(() => document.querySelectorAll('select')[1].options.length > 1, { timeout: 30000 });
    await voiceSelect.selectOption(voice);

    console.log("✍️ Жазу...");
    await page.locator("textarea#text").fill(text);

    const turnstileSolver = async () => {
      for (let i = 0; i < 30; i++) {
        try {
          if (page.isClosed()) return;
          const frames = page.frames();
          for (const frame of frames) {
            if (frame.url().includes("challenges.cloudflare.com")) {
              const bbox = await (await frame.frameElement()).boundingBox();
              if (bbox) {
                console.log("👆 Turnstile басылуда...");
                await page.mouse.click(bbox.x + bbox.width / 10, bbox.y + bbox.height / 2);
                return;
              }
            }
          }
        } catch (e) {}
        await page.waitForTimeout(2000);
      }
    };

    console.log("🖱️ Синтез...");
    const btn = page.locator('button.bg-indigo-600').first();
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes("/synthesis") && r.status() === 200, { timeout: 120000 }),
      btn.click().then(() => turnstileSolver())
    ]);

    const data = await response.json();
    if (data?.data?.url) {
      console.log("✅ Жүктеу...");
      const audioBuffer = await page.request.get(data.data.url);
      fs.writeFileSync(outputFile, await audioBuffer.body());
      console.log(`🎉 Файл: ${outputFile}`);
    }

  } catch (err) {
    console.error("❌ Қате:", err.message);
  } finally {
    await browser.close();
    try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch(e) {}
  }
}

import { fileURLToPath } from 'url';
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const textArg = process.argv.slice(2).join(" ");
  const fileName = `tts_clean_${Date.now()}.mp3`;
  tts(textArg || "Байланыста Асылжан және Сәуірбек. Тексеріс сәтті!", fileName);
}
