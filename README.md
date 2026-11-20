# OmniView — Universal Device Simulator

Free, open-source Manifest V3 Chrome Extension for responsive web testing across **both emerging-market devices** (Itel, Tecno, Infinix, Oppo, Xiaomi/Redmi) and **international flagships** (Apple iPhone, Samsung Galaxy, Google Pixel, iPads, Laptops, Macs, and Smart TVs) — with **zero PRO paywalls**.

## Key Features

- **36+ Built-In Devices + Custom Device Manager**: Includes popular local & emerging-market phones (Itel A70, P55 5G, S23+, Tecno Spark 20/30C, Camon 30, Phantom V Fold, Infinix Hot 40, Note 40 Pro, Oppo A18, Reno 11, Redmi 13C, Note 13 Pro) alongside flagship phones, tablets, laptops, desktops, and 720p/1080p/4K Smart TVs. Switch between **Compact List** and **Visual Device Grid** views, star favorites, add/edit/delete custom devices, and import/export JSON.
- **Multi-Device Comparison + Real-Time Live Sync**: Compare up to **6 devices side-by-side** with **Live Sync** powered by an isolated iframe bridge ([syncBridge.ts](./src/content/syncBridge.ts)) — scrolling, navigating between pages (MPA & SPA), clicking menus/buttons/tabs, and typing in search/form inputs on one device mirror in real time across all other devices!
- **Realistic OS Status Bars & Mobile Browser Chrome**: Toggle authentic iOS Safari (bottom bar, Dynamic Island/notch, status bar) and Android Chrome (top address bar, 100% battery, punch-hole/waterdrop) overlays with a single click (`OS UI`).
- **Run on Live Physical Device (Offline QR Code + LAN IP Helper)**: Click **Live Device** (top bar, right rail, or any device card) to generate an instant offline QR code for the exact live page you're inspecting — with automatic `localhost`/`127.0.0.1` LAN IP rewriting so your physical phone, tablet, or TV on the same Wi-Fi can open your local dev server in one scan.
- **Minimal Studio Mode, 16 Living Studio Themes & Choreographed Motion**: Opens in a calm, distraction-free Minimal Studio layout with smooth slide-in sidebar drawer, accordion Pro Toolbar, staggered device entrance & smooth exit animations, 3D physical orientation rotate transitions, hover-reveal controls, a floating right quick-action rail, **16 Living Themes across 4 Collections** (*Minimal*, *Cosmos & Space* with twinkling stars/shooting stars/solar eclipse, *Marine & Aquatic* with caustic water rays & rising bubbles, and *Nature* with northern aurora ribbons, drifting fireflies & falling sakura petals), plus **4 Animation Feel Presets** (*Silk*, *Spring*, *Snappy*, *Calm*).
- **Zen Presentation Mode & Keyboard Shortcuts**: Hit `Shift+Z` to hide all toolbars for clean client demos, `Ctrl/Cmd+K` to jump to device search, `Shift+S` to toggle Live Sync, and `Shift+R` to reload all frames.
- **Mockup Screenshot Studio & Full-Page Scrolling Capture**:
  - **Full-Page Scrolling Capture**: Automatically scrolls the target device from top to bottom and stitches the entire page into one crisp image.
  - **Mockup Studio**: Wrap any capture (single device, raw viewport, full page, or comparison grid) in designer gradient/solid/transparent backdrops with adjustable padding, corner radius, drop shadow, custom device captions, and export as **PNG**, **JPEG**, **WebP**, or **Copy to Clipboard**.
- **Universal MP4 (H.264) & WebM Screen Recorder + Built-In Preview Player**:
  - Prioritizes **MP4 (H.264)** when supported by Chrome (with WebM H.264 and VP9/VP8 options), selectable quality bitrate (**Standard / High HD / Ultra**), optional tab audio, and Region Capture (`CropTarget.fromElement`) with full-tab fallback.
  - Opens a built-in **Recording Preview Modal** upon stopping so you can play back and verify your video before downloading.
- **Honest Compatibility Mode & User-Agent Override**:
  - **Standard Mode (Default)**, **Opt-In Tab-Scoped Compatibility Mode** (strips `X-Frame-Options` and `Content-Security-Policy` strictly for `sub_frame` requests in the simulator tab), and **External Preview Fallback**.
  - Session-scoped User-Agent override (per-device in Single Mode, shared UA selector in Multi-Device Mode).
- **Developer & Smart TV Testing Tools**: Toggleable Tailwind (`xs`–`2xl`) & Bootstrap (`xs`–`xxl`) breakpoint inspector, pixel ruler overlay, touch cursor indicator, TV 5% / 10% overscan safe-area guides, TV landscape lock, and an on-screen D-Pad Remote HUD.

## Setup, Test & Build

```bash
npm install
npm run test
npm run build
```

## Load Unpacked in Chrome

1. Run `npm run build` to generate the `dist/` folder.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** (or click the **Reload** icon on OmniView if already loaded) and select the `dist/` directory.
5. Click the **OmniView** toolbar icon on any website to launch the simulator workspace.

## Known Browser & API Limitations

- **Rendering Engine**: Changing the User-Agent header does not replace Chrome's Blink rendering engine with iOS Safari, Android WebView, or native Smart TV engines.
- **Compatibility Mode is Best-Effort**: Stripping `X-Frame-Options` and `Content-Security-Policy` allows many production websites to load inside iframes, but sites using JavaScript frame-busters, strict `SameSite` cookies, or Service Worker cached CSP headers may still refuse embedding. Use the **External Preview** button on any device card for those sites.
- **Multi-Device User-Agent**: Chrome's `declarativeNetRequest` scopes session rules to `tabId`, not individual `<iframe>` elements. Single Device Mode applies the active device's UA; Multi-Device Mode applies one shared UA across the tab.
- **Privacy**: OmniView is 100% local-first (`chrome.storage.local` & `chrome.storage.session`) with no backend, no analytics, and no external data transmission.

## License

MIT — see [LICENSE](./LICENSE).
