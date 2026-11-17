(function () {
  // Vertices: Statistics, Functional Programming, Physics
  // Edges: stats-fp | stats-physics | fp-physics
  const EDGE_MAP = {
    none: [],
    all: ["stats-fp", "stats-physics", "fp-physics"],
    "stats-fp": ["stats-fp"],
    "stats-physics": ["stats-physics"],
    "fp-physics": ["fp-physics"],
    // backwards-compatible aliases
    "bayes-fp": ["stats-fp"],
    "bayes-physics": ["stats-physics"],
  };

  const FULL = {
    viewBox: "0 0 520 420",
    S: { x: 260, y: 70 },
    F: { x: 90, y: 340 },
    P: { x: 430, y: 340 },
  };

  const CORNER = {
    viewBox: "0 0 110 100",
    S: { x: 55, y: 18 },
    F: { x: 18, y: 82 },
    P: { x: 92, y: 82 },
  };

  function edgeClass(mode, id) {
    const active = new Set(EDGE_MAP[mode] || []);
    return active.has(id) ? "edge is-active" : "edge";
  }

  function fullSvg(mode) {
    const { viewBox, S, F, P } = FULL;
    return `
<svg class="triangle" data-triangle="${mode}" viewBox="${viewBox}" role="img" aria-label="Research strands triangle">
  <line class="${edgeClass(mode, "stats-fp")}" data-edge="stats-fp" x1="${S.x}" y1="${S.y}" x2="${F.x}" y2="${F.y}" />
  <line class="${edgeClass(mode, "stats-physics")}" data-edge="stats-physics" x1="${S.x}" y1="${S.y}" x2="${P.x}" y2="${P.y}" />
  <line class="${edgeClass(mode, "fp-physics")}" data-edge="fp-physics" x1="${F.x}" y1="${F.y}" x2="${P.x}" y2="${P.y}" />
  <circle class="vtx-dot strand-s" cx="${S.x}" cy="${S.y}" r="7" />
  <circle class="vtx-dot strand-f" cx="${F.x}" cy="${F.y}" r="7" />
  <circle class="vtx-dot strand-p" cx="${P.x}" cy="${P.y}" r="7" />
  <g class="vtx-label strand-s" transform="translate(${S.x}, ${S.y - 28})">
    <text text-anchor="middle">Stats/ML</text>
  </g>
  <g class="vtx-label strand-f" transform="translate(${F.x}, ${F.y + 32})">
    <text text-anchor="middle">Functional</text>
    <text text-anchor="middle" dy="1.15em">Programming</text>
  </g>
  <g class="vtx-label strand-p" transform="translate(${P.x}, ${P.y + 32})">
    <text text-anchor="middle">Physics</text>
  </g>
</svg>`;
  }

  function cornerSvg() {
    const { viewBox, S, F, P } = CORNER;
    return `
<svg id="corner-triangle" viewBox="${viewBox}" aria-hidden="true">
  <line class="edge" data-edge="stats-fp" x1="${S.x}" y1="${S.y}" x2="${F.x}" y2="${F.y}" />
  <line class="edge" data-edge="stats-physics" x1="${S.x}" y1="${S.y}" x2="${P.x}" y2="${P.y}" />
  <line class="edge" data-edge="fp-physics" x1="${F.x}" y1="${F.y}" x2="${P.x}" y2="${P.y}" />
  <circle class="vtx-dot strand-s" cx="${S.x}" cy="${S.y}" r="5.5" />
  <circle class="vtx-dot strand-f" cx="${F.x}" cy="${F.y}" r="5.5" />
  <circle class="vtx-dot strand-p" cx="${P.x}" cy="${P.y}" r="5.5" />
  <text class="vtx-label strand-s" x="${S.x}" y="${S.y - 12}">S</text>
  <text class="vtx-label strand-f" x="${F.x}" y="${F.y + 16}">F</text>
  <text class="vtx-label strand-p" x="${P.x}" y="${P.y + 16}">P</text>
</svg>`;
  }

  function applyMode(root, mode) {
    if (!root) return;
    const active = new Set(EDGE_MAP[mode] || []);
    root.querySelectorAll(".edge").forEach((el) => {
      el.classList.toggle("is-active", active.has(el.dataset.edge));
    });
  }

  function mountFullTriangles() {
    document.querySelectorAll(".research-triangle").forEach((el) => {
      const mode = el.dataset.triangle || "none";
      el.innerHTML = fullSvg(mode);
    });
  }

  function ensureCorner() {
    if (!document.getElementById("corner-triangle")) {
      document.body.insertAdjacentHTML("beforeend", cornerSvg());
    }
  }

  function syncFromSlide(slide) {
    const corner = document.getElementById("corner-triangle");
    const mode = (slide && slide.dataset.edge) || "off";

    document.documentElement.dataset.edge = mode;

    document.querySelectorAll(".triangle[data-triangle]").forEach((el) => {
      applyMode(el, el.dataset.triangle);
    });

    if (!corner) return;
    if (mode === "off") {
      corner.classList.remove("is-on");
      return;
    }
    corner.classList.add("is-on");
    applyMode(corner, mode);
  }

  let started = false;

  function boot() {
    if (!window.Reveal || started) return;
    started = true;
    mountFullTriangles();
    ensureCorner();
    syncFromSlide(Reveal.getCurrentSlide());
    Reveal.on("slidechanged", (event) => syncFromSlide(event.currentSlide));
  }

  function tryBoot() {
    if (!window.Reveal) return false;
    if (typeof Reveal.isReady === "function" && Reveal.isReady()) {
      boot();
      return true;
    }
    Reveal.on("ready", boot);
    setTimeout(boot, 0);
    setTimeout(boot, 250);
    return true;
  }

  if (!tryBoot()) {
    document.addEventListener("DOMContentLoaded", () => {
      const timer = setInterval(() => {
        if (tryBoot()) clearInterval(timer);
      }, 50);
    });
  }
})();
