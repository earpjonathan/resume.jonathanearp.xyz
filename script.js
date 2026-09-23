/* theme toggle (persisted) + footer year */
(function () {
  var btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var d = document.documentElement;
      var next = d.dataset.theme === "dark" ? "light" : "dark";
      /* __setTheme is defined by the boot script in <head>; it writes the
         cookie that carries the choice across the sibling subdomains. */
      if (window.__setTheme) window.__setTheme(next);
      else d.dataset.theme = next;
    });
  }
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ---- tailoring ----
   One entry per focus. sections is the order of Experience and Projects,
   entries the order of the entries inside them, skills the order of the skill
   groups, and name is what the status line calls it. Entries left with no
   bullets for a focus drop to the bottom of their section with just their
   title showing. The keys double as the ?for= value and the PDF name, and
   tools/build-pdfs.sh reads them from here, so a new focus needs a line
   below, a <p data-lens="key"> summary in index.html, and (if it should have
   a button) a button in .lens__opts. Without a button it is link-only.
   Optional: paper ("a4", default US Letter) and file, the name the PDF
   downloads as. */
var LENSES = {
  all:      { name: "everything",           sections: ["exp", "proj"], entries: ["lbnl", "upenn", "fpv", "splat", "vex", "peter"], skills: ["electrical", "controls", "cad", "code"] },
  hardware: { name: "hardware and drones",  sections: ["proj", "exp"], entries: ["fpv", "vex", "lbnl", "upenn", "splat", "peter"], skills: ["electrical", "cad", "controls", "code"] },
  controls: { name: "controls and sensors", sections: ["proj", "exp"], entries: ["fpv", "splat", "vex", "lbnl", "upenn", "peter"], skills: ["controls", "electrical", "code", "cad"] },
  software: { name: "software and data",    sections: ["proj", "exp"], entries: ["splat", "peter", "lbnl", "fpv", "vex", "upenn"], skills: ["code", "controls", "electrical", "cad"] },
  research: { name: "research",             sections: ["exp", "proj"], entries: ["lbnl", "upenn", "splat", "fpv", "vex", "peter"], skills: ["code", "controls", "cad", "electrical"] },

  /* link-only, sent with the Edinburgh technical team application */
  hyped:    { name: "this application",     sections: ["exp", "proj"], entries: ["lbnl", "upenn", "vex", "fpv", "splat", "peter"], skills: ["electrical", "controls", "cad", "code"], paper: "a4", file: "Jonathan_Earp_CV.pdf" }
};

(function () {
  var main = document.querySelector(".cv-main");
  if (!main) return;

  var opts = [].slice.call(document.querySelectorAll(".lens__opt"));
  var note = document.getElementById("lens-note");
  var reset = document.getElementById("lens-reset");
  var copy = document.getElementById("lens-copy");
  var summaries = [].slice.call(document.querySelectorAll(".cv-summary [data-lens]"));
  var skillsList = document.querySelector(".skills");
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = null;

  function tags(el) {
    return (el.getAttribute("data-for") || "").split(/\s+/).filter(Boolean);
  }
  function pdfFor(key) {
    return key === "all" ? "resume.pdf" : "pdf/resume-" + key + ".pdf";
  }

  /* each experience/project entry gets a "show the rest" button, built once */
  var entries = [].slice.call(main.querySelectorAll(".entry"));
  entries.forEach(function (entry) {
    var list = entry.querySelector(".dlist");
    if (!list) return;
    var more = document.createElement("button");
    more.type = "button";
    more.className = "entry__more";
    more.hidden = true;
    more.setAttribute("aria-expanded", "false");
    list.parentNode.insertBefore(more, list.nextSibling);
    more.addEventListener("click", function () {
      var open = more.getAttribute("aria-expanded") !== "true";
      entry.querySelectorAll(".dlist li.is-off").forEach(function (li) { li.hidden = !open; });
      entry.classList.toggle("is-folded", !open && entry._shown === 0);
      more.setAttribute("aria-expanded", open ? "true" : "false");
      label(more, entry._off, open);
    });
  });

  function label(btn, n, open) {
    btn.textContent = open ? "Show less" : "+ " + n + (n === 1 ? " more point" : " more points");
  }

  function order(container, items, keyOf, wanted) {
    items.slice().sort(function (a, b) {
      var ia = wanted.indexOf(keyOf(a)), ib = wanted.indexOf(keyOf(b));
      if (ia < 0) ia = 99;
      if (ib < 0) ib = 99;
      return ia - ib;
    }).forEach(function (el) { container.appendChild(el); });
  }

  function apply(key, animate) {
    var lens = LENSES[key] || LENSES.all;
    if (!LENSES[key]) key = "all";
    current = key;
    document.documentElement.dataset.lens = key;
    document.documentElement.dataset.paper = lens.paper || "letter";
    var all = key === "all";
    var total = 0, shown = 0;

    /* summary */
    var hasOwn = summaries.some(function (p) { return p.dataset.lens === key; });
    summaries.forEach(function (p) {
      p.hidden = p.dataset.lens !== (hasOwn ? key : "all");
    });

    /* per-version details outside the bullets: a location, a section title */
    document.querySelectorAll("[data-show-for]").forEach(function (el) {
      el.hidden = el.getAttribute("data-show-for").split(/\s+/).indexOf(key) < 0;
    });
    document.querySelectorAll("[data-hide-for]").forEach(function (el) {
      el.hidden = el.getAttribute("data-hide-for").split(/\s+/).indexOf(key) >= 0;
    });

    /* bullets, and which entries fold */
    entries.forEach(function (entry) {
      var lis = [].slice.call(entry.querySelectorAll(".dlist li"));
      var on = 0;
      lis.forEach(function (li) {
        var keep = all || tags(li).indexOf(key) >= 0;
        li.hidden = !keep;
        li.classList.toggle("is-off", !keep);
        if (keep) on++;
      });
      total += lis.length;
      shown += on;
      entry._shown = on;
      entry._off = lis.length - on;
      entry.classList.toggle("is-folded", on === 0);
      var more = entry.querySelector(".entry__more");
      if (more) {
        more.hidden = entry._off === 0;
        more.setAttribute("aria-expanded", "false");
        label(more, entry._off, false);
      }
    });

    /* sections, then entries within them (folded ones last), then skills */
    var secs = [].slice.call(main.querySelectorAll(":scope > .cv-sec"));
    order(main, secs, function (s) { return s.dataset.sec; }, lens.sections);
    [].slice.call(main.querySelectorAll(":scope > .cv-sec")).forEach(function (sec, i) {
      var no = sec.querySelector(".shead__no");
      if (no) no.textContent = "0" + (i + 1);
      var list = [].slice.call(sec.querySelectorAll(":scope > .entry"));
      order(sec, list, function (e) {
        return (e.classList.contains("is-folded") ? "~" : "") + e.dataset.id;
      }, lens.entries.concat(lens.entries.map(function (id) { return "~" + id; })));
    });
    if (skillsList) {
      var groups = [].slice.call(skillsList.children);
      order(skillsList, groups, function (g) { return g.dataset.id; }, lens.skills);
      skillsList.querySelectorAll("li[data-for]").forEach(function (li) {
        li.classList.toggle("is-dim", !all && tags(li).indexOf(key) < 0);
      });
    }

    /* picker state */
    opts.forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.lens === key ? "true" : "false");
    });
    if (note) {
      note.textContent = all
        ? "Pick one to put the most relevant work first and hide the points that don't apply."
        : "Showing the " + shown + " of " + total + " points that fit " + lens.name +
          ", most relevant first. Hidden ones are still under each entry.";
    }
    if (reset) reset.hidden = all;
    if (copy) { copy.hidden = all; copy.textContent = "Copy link to this version"; }

    /* the PDF buttons hand over the matching version */
    document.querySelectorAll("[data-pdf]").forEach(function (a) {
      a.setAttribute("href", pdfFor(key));
      a.setAttribute("download", lens.file || "Jonathan_Earp_Resume.pdf");
    });

    /* keep the address bar shareable without adding history entries */
    try {
      var url = new URL(location.href);
      if (all) url.searchParams.delete("for");
      else url.searchParams.set("for", key);
      if (url.href !== location.href) history.replaceState(null, "", url.href);
    } catch (e) {}

    if (animate && !reduced && Element.prototype.animate) {
      var moved = [document.querySelector(".cv-summary")]
        .concat([].slice.call(main.querySelectorAll(".entry")))
        .concat(skillsList ? [skillsList] : []);
      moved.forEach(function (el, i) {
        if (!el) return;
        el.animate(
          [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
          { duration: 260, delay: Math.min(i, 8) * 25, easing: "ease-out", fill: "backwards" }
        );
      });
    }
  }

  opts.forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.lens !== current) apply(b.dataset.lens, true);
    });
  });
  if (reset) reset.addEventListener("click", function () {
    apply("all", true);
    var first = opts[0];
    if (first) first.focus();
  });
  if (copy) copy.addEventListener("click", function () {
    var done = function (msg) {
      copy.textContent = msg;
      setTimeout(function () { copy.textContent = "Copy link to this version"; }, 2200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(location.href).then(
        function () { done("Link copied"); },
        function () { done("Couldn't copy, use the address bar"); }
      );
    } else {
      done("Couldn't copy, use the address bar");
    }
  });

  var start = "all";
  try { start = new URL(location.href).searchParams.get("for") || "all"; } catch (e) {}
  apply(start.toLowerCase(), false);
})();

/* ---- mobile nav drawer ---- */
(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("topnav");
  if (!toggle || !nav) return;

  function set(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  toggle.addEventListener("click", function () {
    set(!nav.classList.contains("is-open"));
  });
  /* a drawer that stays open after you pick something, or that you cannot
     dismiss without finding the button again, is worse than no drawer */
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) set(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { set(false); toggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (!nav.classList.contains("is-open")) return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) set(false);
  });
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
