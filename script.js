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
