let clicks = 0;

function updateMetrics() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const sizeEl = document.getElementById("v-size");
  const dprEl = document.getElementById("v-dpr");
  const orientEl = document.getElementById("v-orient");
  const uaEl = document.getElementById("v-ua");
  const pillEl = document.getElementById("bp-pill");

  if (sizeEl) sizeEl.textContent = `${w} × ${h}`;
  if (dprEl) dprEl.textContent = `${window.devicePixelRatio.toFixed(2)}x`;
  if (orientEl) orientEl.textContent = w >= h ? "Landscape" : "Portrait";
  if (uaEl) uaEl.textContent = navigator.userAgent;

  const bp =
    w >= 1536
      ? "2xl"
      : w >= 1280
        ? "xl"
        : w >= 1024
          ? "lg"
          : w >= 768
            ? "md"
            : w >= 640
              ? "sm"
              : "xs";
  if (pillEl) pillEl.textContent = `TW: ${bp} • ${w}px`;
}

updateMetrics();
window.addEventListener("resize", updateMetrics);

const counterBtn = document.getElementById("btn-counter");
if (counterBtn) {
  counterBtn.addEventListener("click", (e) => {
    clicks++;
    const target = e.currentTarget;
    if (target) target.textContent = `Clicks: ${clicks}`;
  });
}

window.addEventListener("keydown", (e) => {
  const keyEl = document.getElementById("v-key");
  if (keyEl) keyEl.textContent = e.key;

  if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
    const focusables = Array.from(document.querySelectorAll("button, .card"));
    const idx = focusables.indexOf(document.activeElement);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      focusables[(idx + 1) % focusables.length]?.focus();
    } else {
      focusables[(idx - 1 + focusables.length) % focusables.length]?.focus();
    }
  }
});
