(function () {
  const STAGES = new Set(["prior", "obs", "hidden", "particles"]);
  const EMBED_SRC = "media/frp/embed.html";

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
    iframe.src = EMBED_SRC + "?stage=prior";
    host.appendChild(iframe);
    document.body.appendChild(host);

    window.addEventListener("message", (ev) => {
      if (ev.source !== iframe.contentWindow) return;
      if (ev.data && ev.data.type === "frp-demo-ready") {
        ready = true;
        if (pendingStage) {
          sendStage(pendingStage);
          pendingStage = null;
        }
      }
    });
    return host;
  }

  function sendStage(stage) {
    if (!STAGES.has(stage) || !iframe) return;
    lastStage = stage;
    if (!ready) {
      pendingStage = stage;
      return;
    }
    iframe.contentWindow.postMessage({ type: "frp-demo-stage", stage }, "*");
  }

  function hide() {
    if (!host) return;
    host.classList.remove("is-active");
    host.setAttribute("aria-hidden", "true");
  }

  function placeOver(slot) {
    ensureHost();
    const r = slot.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) {
      hide();
      return;
    }
    host.style.top = `${Math.round(r.top)}px`;
    host.style.left = `${Math.round(r.left)}px`;
    host.style.width = `${Math.round(r.width)}px`;
    host.style.height = `${Math.round(r.height)}px`;
    host.classList.add("is-active");
    host.setAttribute("aria-hidden", "false");
  }

  function sync(slide) {
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
    if (stage !== lastStage) sendStage(stage);
  }

  function boot() {
    if (started) return;
    started = true;
    ensureHost();
    hide();
    sync(Reveal.getCurrentSlide());
    Reveal.on("slidechanged", (event) => sync(event.currentSlide));
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
