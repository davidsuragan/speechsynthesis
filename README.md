# Node.js TTS (Text-to-Speech) Integration

> **Automated text-to-speech synthesis tool using speechsynthesis.online** |
> Convert text to natural-sounding MP3 audio files with Node.js | Browser
> automation with Patchright/Playwright | Free TTS API alternative |
> Multi-language voice synthesis | SSML support | Cloudflare bypass

## 📖 Overview

A powerful **Node.js text-to-speech (TTS) automation tool** that leverages the
[speechsynthesis.online](https://speechsynthesis.online/) web service to convert
text into high-quality MP3 audio files. This project uses **Patchright** (an
enhanced, undetectable fork of Playwright) for robust browser automation, making
it an excellent free alternative to paid TTS APIs.

**Perfect for:** Voice-over generation, audiobook creation, accessibility tools,
language learning applications, content creation, podcast automation, and any
project requiring programmatic text-to-speech conversion.

**Keywords:** text to speech nodejs, tts automation, free tts api, speech
synthesis, text to mp3, voice generation, playwright automation, browser
automation tts, multilingual tts, ssml text to speech

## 🚀 Key Features

- **SSML 1007 Error Fix:** Automatically resolves the common "Prefix redefined"
  error by intercepting requests and cleaning up XHTML namespaces.
- **Cloudflare Turnstile Solver:** Built-in logic to automatically detect and
  bypass Cloudflare verification (captcha).
- **Incognito (Clean) Mode:** The `tts_clean.js` script opens a fresh session
  each time and clears temporary data after completion.
- **Ad Blocking:** Advertising modules and analytics scripts are blocked to save
  bandwidth and improve speed.

## 📂 Project Structure

- `tts.js` — Main script. Uses a persistent profile (`pw_profile`) to maintain
  cache.
- `tts_clean.js` — Optimized "clean" version. Opens a new temporary profile each
  time and doesn't load unnecessary resources except CSS/Images.
- `voices_info.json` — List and metadata of all available voices in the system.

## ⚠️ Important Notes

1. **Website Stability:** The
   [speechsynthesis.online](https://speechsynthesis.online/) website may
   occasionally fail to work properly due to technical issues or strict
   Cloudflare verification. In such cases, the script may throw "Timeout" or
   "Target page closed" errors.
2. **voices_info.json:** This file contains many voices, but some may be
   temporarily unavailable on the website itself.

## 🛠️ Installation and Usage

### Installation:

```powershell
npm install
```

### Running:

```powershell
# Using the main script (you can change the text)
node tts.js "Hello, this is a test message."

# Running in clean (Incognito) mode
node tts_clean.js "This is speech synthesis in clean mode."
```

## 📝 License

This project is created for educational and research purposes only.
