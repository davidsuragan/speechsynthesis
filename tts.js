import fs from "fs";
import path from "path";
import { chromium } from "patchright";

const SITE_URL = "https://speechsynthesis.online/";
const PROFILE_DIR = "./pw_profile";

export async function tts(text, outputFile = "output.mp3", voice = "en-US-Andrew:DragonHDOmniLatestNeural", lang = "kk-KZ") {
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

  console.log("🚀 Браузер іске қосылуда...");
  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: "chromium",
    headless: false,                                
    args: [
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled"
    ],
    ignoreDefaultArgs: ["--enable-automation"]
  });

  const page = await browser.newPage();

  const BLOCKED_DOMAINS = [
    "google-analytics.com",
    "doubleclick.net",
    "googleads.g.doubleclick.net",
    "pagead2.googlesyndication.com",
    "adsbygoogle.js",
    "googletagmanager.com"
  ];
  
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
      return route.abort();
    }
    return route.continue();
  });

  await page.route("**/synthesis", async (route) => {
    if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON();
      if (payload && payload.ssml) {
        let fixedSsml = payload.ssml;
        fixedSsml = fixedSsml.replace(/xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, '');
        
        if (payload.ssml !== fixedSsml) {
          console.log("🛠️ SSML форматы түзетілді (1007-нің алдын алу)");
          payload.ssml = fixedSsml;
          return route.continue({ postData: payload });
        }
      }
    }
    return route.continue();
  });

  try {
    console.log("🌐 Сайтқа өту...");
    await page.goto(SITE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("🌍 Тіл таңдалуда...");
    const langSelect = page.locator('div.flex.flex-col:has(label[for="language"]) select').first();
    await langSelect.waitFor({ state: "visible" });
    await langSelect.selectOption(lang);
    await page.waitForTimeout(1000);

    console.log("🗣️ Дауыс таңдалуда...");
    const voiceSelect = page.locator('div.grow:has(label[for="voice"]) select').first();
    await voiceSelect.waitFor({ state: "visible" });
    
    await page.waitForFunction(() => {
      const sel = document.querySelector('div.grow:has(label[for="voice"]) select');
      return sel && sel.options.length > 1;
    }, { timeout: 30000 });
    
    await voiceSelect.selectOption(voice);
    await page.waitForTimeout(1000);

    console.log("✍️ Мәтін жазылуда...");
    const textbox = page.locator("textarea#text");
    await textbox.fill(text);
    await page.waitForTimeout(1000);

    const turnstileSolver = async () => {
      for (let i = 0; i < 20; i++) {
        try {
          if (page.isClosed()) return;
          const frames = page.frames();
          for (const frame of frames) {
            if (frame.url().includes("challenges.cloudflare.com")) {
              const bbox = await (await frame.frameElement()).boundingBox();
              if (bbox) {
                console.log("👆 Turnstile табылды, басылуда...");
                await page.mouse.click(bbox.x + bbox.width / 10, bbox.y + bbox.height / 2);
                return;
              }
            }
          }
        } catch (e) {}
        await page.waitForTimeout(2000);
      }
    };

    console.log("🖱️ Синтез басталуда...");
    const btn = page.locator('button.bg-indigo-600').first();

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes("/synthesis") && r.status() === 200, { timeout: 120000 }),
      btn.click().then(() => turnstileSolver())
    ]);

    const data = await response.json();
    const audioUrl = data?.data?.url;
    
    if (audioUrl) {
      console.log("✅ Аудио дайын! Жүктелуде...");
      const audioBuffer = await page.request.get(audioUrl);
      fs.writeFileSync(outputFile, await audioBuffer.body());
      console.log(`🎉 Файл сақталды: ${outputFile}`);
    } else {
      throw new Error("Аудио сілтемесі табылмады.");
    }

  } catch (err) {
    console.error("❌ Қате:", err.message);
    if (page && !page.isClosed()) {
      await page.screenshot({ path: "error.png" }).catch(() => {});
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (__filename === path.resolve(process.argv[1])) {
  const textArg = process.argv.slice(2).join(" ");
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const fileName = `tts_${dateStr}_${timeStr}.mp3`;
  
  if (textArg) {
    tts(textArg, fileName);
  } else {
    tts("Сәлем! Байланыста Сәуірбек және Асылжан.", fileName);
  }
}
