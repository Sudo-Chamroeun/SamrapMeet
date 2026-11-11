# SamrapMeet - Google Meet Bilingual Summarizer
**Created by Footprints IT-Team (Footprints International School)**

This folder contains the complete, ready-to-load Google Chrome Extension.

---

## How to Install in Chrome (Developer Mode):
1. Open Google Chrome.
2. Go to `chrome://extensions`.
3. In the top-right corner, toggle on **Developer mode**.
4. Click **Load unpacked** in the top-left corner.
5. Select this exact folder (`/extension`).
6. Join any Google Meet call at `meet.google.com` and turn on captions (`CC`).
7. SamrapMeet will automatically capture English and Khmer speech and provide real-time bilingual notes!

---

## File Contents:
- `manifest.json`: Chrome Extension Manifest V3 configuration.
- `content.js`: Captures live Google Meet captions and injects the floating HUD.
- `background.js`: Service worker managing sidepanel and storage state.
- `sidepanel.html` & `sidepanel.js`: In-meeting companion sidepanel.
- `popup.html` & `popup.js`: Extension action popup.
- `styles.css`: Styles for HUD overlay and sidepanel.
