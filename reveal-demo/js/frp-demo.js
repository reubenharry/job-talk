(function () {
  const STAGES = new Set(["prior", "obs", "hidden", "particles"]);
  const EMBED_SRC = "media/frp/embed.html";
  const AR = 4 / 3; // width / height

  let host = null;
  let iframe = null;
  let ready = false;
  let pendingStage = null;
  let lastStage = null;
  let started = false;

  function ensureHost() {
    if (host) return host;
    host = document.createElement("div");
    host.id = "frp-demo-host";
    host.setAttribute("aria-hidden", "true");
    iframe = document.createElement("iframe");
    iframe.title = "Stochastic process tracker demo";
    iframe.allow = "autoplay";
    iframe.src = EMBED_SRC + "?stage=obs&v=live5";
    host.appendChild(iframe);
    document.body.appendChild(host);

    window.addEventListener("message", (ev) => {
      if (ev.source !== iframe.contentWindow) return;
      if (ev.data && ev.data.type === "frp-demo-ready") {
        ready = true;
        if (pendingStage) {
          sendStage(pendingStage, true);
          pendingStage = null;
        }
      }
    });
    return host;
  }

  function sendStage(stage, force) {
    if (!STAGES.has(stage) || !iframe) return;
    if (!force && stage === lastStage) return;
    lastStage = stage;
    if (!ready) {
      pendingStage = stage;
      return;
    }
    iframe.contentWindow.postMessage(
      { type: "frp-demo-restart", stage },
      "*"
    );
  }

  function hide() {
    if (!host) return;
    host.classList.remove("is-active");
    host.setAttribute("aria-hidden", "true");
  }

  /** Fit a 4:3 box inside the slot — never nonuniform stretch. */
  function placeOver(slot) {
    ensureHost();
    const r = slot.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) {
      hide();
      return;
    }
    let w = r.width;
    let h = w / AR;
    if (h > r.height) {
      h = r.height;
      w = h * AR;
    }
    const left = r.left + (r.width - w) / 2;
    const top = r.top + (r.height - h) / 2;
    host.style.top = `${Math.round(top)}px`;
    host.style.left = `${Math.round(left)}px`;
    host.style.width = `${Math.round(w)}px`;
    host.style.height = `${Math.round(h)}px`;
    host.classList.add("is-active");
    host.setAttribute("aria-hidden", "false");
  }

  function sync(slide, opts) {
    const forceStage = !!(opts && opts.forceStage);
    const current =
      slide ||
      (typeof Reveal !== "undefined" ? Reveal.getCurrentSlide() : null);
    const slot = current && current.querySelector(".frp-demo-slot");
    if (!slot) {
      hide();
      return;
    }
    const stage = slot.getAttribute("data-frp-stage") || "prior";
    placeOver(slot);
    sendStage(stage, forceStage);
  }

  function boot() {
    if (started) return;
    started = true;
    ensureHost();
    hide();
    sync(Reveal.getCurrentSlide(), { forceStage: true });
    Reveal.on("slidechanged", (event) =>
      sync(event.currentSlide, { forceStage: true })
    );
    Reveal.on("resize", () => sync());
    window.addEventListener("resize", () => sync());
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
