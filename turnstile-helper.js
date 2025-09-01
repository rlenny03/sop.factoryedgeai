window.onloadTurnstileCallback = function () {
  window.turnstile.render("#cf-turnstile", {
    sitekey: window.TURNSTILE_SITEKEY,
    theme: "dark"
  });
};
