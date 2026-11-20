# Privacy Policy — OmniView Universal Device Simulator

**Effective Date:** November 2026  
**Project:** OmniView — Universal Device Simulator (Open-Source Chrome Extension)

## 1. Local-First, Zero-Tracking Architecture

OmniView is designed to be **100% local-first**. We do **not** operate a backend server, we do **not** require an account, and we do **not** collect, store, sell, or transmit any personal data, browsing history, URLs, screenshots, or screen recordings.

## 2. Data Stored Locally on Your Device

All user preferences are stored exclusively in your browser's local extension storage (`chrome.storage.local` and `chrome.storage.session`):

- Custom devices, favorite devices, and recently used devices.
- Saved comparison workspaces and recent simulator URLs.
- Studio appearance settings (selected backdrop, animation feel, interface mode) and optional local LAN IP for QR code generation.
- Temporary per-tab simulator session state (`tabId`, `declarativeNetRequest` rule IDs), which is automatically erased when you close the simulator tab.

You can clear all stored data at any time by removing the extension or clearing extension storage in Chrome.

## 3. Permissions Disclosure

OmniView requests only the permissions required for its features:

- **`tabs` & `activeTab`**: Reads the active tab URL when you click the OmniView toolbar icon, opens the simulator workspace tab, and captures visible tab pixels when you explicitly click Screenshot.
- **`declarativeNetRequest` & `host_permissions: ["<all_urls>"]`**: Used strictly to apply tab-scoped `sub_frame` header rules inside OmniView simulator tabs (Compatibility Mode & optional User-Agent override) and to enable Real-Time Live Sync (scrolling, navigation, clicks, inputs, X-Ray outlines) inside previewed device iframes. Normal browsing tabs are never modified.
- **`storage`**: Persists your custom devices, workspaces, and Studio theme preferences locally.
- **`downloads`**: Saves your screenshots (PNG/JPEG/WebP), QR codes, and screen recordings (MP4/WebM) directly to your computer when you click Download.

## 4. Media & Clipboard Privacy

- Screenshots and screen recordings are processed entirely in-memory inside your browser using HTML5 `<canvas>` and `MediaRecorder`.
- Offline QR codes in **Run on Live Device** are generated locally with zero external API calls.

## 5. Contact

For questions or security reports, please open an issue on the [OmniView GitHub Repository](https://github.com/David-mwas/OmniView/issues).
