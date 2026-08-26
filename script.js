/* theme toggle (persisted) + footer year */
(function () {
  var btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var d = document.documentElement;
      var next = d.dataset.theme === "dark" ? "light" : "dark";
      d.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ---- favicon follows the theme ----
   The SVG carries its own prefers-color-scheme query, which covers the OS
   setting before this runs. That query cannot see the in-page toggle though,
   so swap the file when data-theme changes. The <link> is replaced rather
   than re-pointed: several browsers ignore an href edit on a live icon. */
(function () {
  var cur = document.querySelector('link[rel="icon"]');
  if (!cur) return;
  var base = cur.getAttribute("href").replace(/favicon(-dark|-light)?\.svg$/, "favicon");
  var shown = null;
  function sync() {
    var want = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    if (want === shown) return;
    shown = want;
    var next = document.createElement("link");
    next.rel = "icon";
    next.type = "image/svg+xml";
    next.href = base + "-" + want + ".svg";
    cur.parentNode.replaceChild(next, cur);
    cur = next;
  }
  sync();
  new MutationObserver(sync).observe(document.documentElement,
    { attributes: true, attributeFilter: ["data-theme"] });
})();
