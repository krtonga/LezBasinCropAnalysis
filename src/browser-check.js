// browser-check.js — feature detection + redirect for unsupported browsers.
// Loaded as a CLASSIC script (NOT type="module") so old browsers that don't
// support ES modules still parse and execute it. This file must run BEFORE
// any module imports — those imports themselves require ES module support.
//
// Spec §7: full experience needs ES modules + WebGL2 + fetch.
(function () {
  try {
    var hasModules = "noModule" in HTMLScriptElement.prototype;
    var hasFetch   = typeof fetch === "function";
    var hasWebGL2  = false;
    try {
      var canvas = document.createElement("canvas");
      hasWebGL2 = !!(canvas.getContext("webgl2"));
    } catch (_e) { /* old browser, leave hasWebGL2 false */ }

    if (hasModules && hasFetch && hasWebGL2) return;

    // Avoid an infinite redirect loop if the user lands on unsupported.html itself.
    if (location.pathname.endsWith("/unsupported.html")) return;

    location.replace("unsupported.html");
  } catch (e) {
    // If detection itself throws, the browser is definitely too old.
    try { location.replace("unsupported.html"); } catch (_) {}
  }
})();
