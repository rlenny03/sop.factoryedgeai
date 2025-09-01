window.mountTurnstile = function () {
  const sitekey = window.TURNSTILE_SITEKEY;
  const el = document.getElementById("cf-turnstile");

  if (!el || !sitekey) return;

  if (window.__turnstileRendered) {
    window.turnstile.reset(window.__turnstileWidgetId);
    return;
  }

  window.__turnstileWidgetId = window.turnstile.render("#cf-turnstile", {
    sitekey,
    theme: "dark"
  });
  window.__turnstileRendered = true;
};
