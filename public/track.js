(function () {
  "use strict";

  var script = document.currentScript;
  var siteKey = script && script.getAttribute("data-site");
  if (!siteKey) {
    console.warn("[analytics] track.js loaded without a data-site attribute — not tracking.");
    return;
  }

  // Same origin the script itself was loaded from, so this works no matter
  // which domain embeds the snippet.
  var apiBase = new URL(script.src).origin;

  function getOrCreate(storage, key, factory) {
    try {
      var existing = storage.getItem(key);
      if (existing) return existing;
      var value = factory();
      storage.setItem(key, value);
      return value;
    } catch {
      // storage unavailable (private browsing, etc.) — fall back to an
      // ephemeral id for this page load only.
      return factory();
    }
  }

  function randomId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  var visitorId = getOrCreate(window.localStorage, "_analytics_visitor_id", randomId);
  var sessionId = getOrCreate(window.sessionStorage, "_analytics_session_id", randomId);

  function send(payload) {
    var body = JSON.stringify(
      Object.assign(
        {
          siteKey: siteKey,
          url: location.href,
          referrer: document.referrer || "",
          visitorId: visitorId,
          sessionId: sessionId,
        },
        payload
      )
    );

    if (navigator.sendBeacon) {
      navigator.sendBeacon(apiBase + "/api/collect", new Blob([body], { type: "application/json" }));
    } else {
      fetch(apiBase + "/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true,
      }).catch(function () {});
    }
  }

  function trackPageview() {
    send({ type: "pageview" });
  }

  // Public API for conversion tracking: window.trackEvent('signup')
  window.trackEvent = function (name) {
    send({ type: "conversion", name: String(name) });
  };

  trackPageview();

  // Re-fire on client-side route changes for SPAs.
  var pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(history, arguments);
    trackPageview();
  };
  window.addEventListener("popstate", trackPageview);
})();
