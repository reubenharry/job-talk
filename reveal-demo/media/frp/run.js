import { WASI, File, OpenFile, ConsoleStdout } from "https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/dist/index.js";

const status = document.getElementById("status");

function setStatus(msg) {
  if (status) status.textContent = msg;
}

/** Resolve assets next to the HTML page (or body[data-demo-base]). */
const assetBase = new URL(
  document.body?.dataset?.demoBase ?? "./",
  document.baseURI
);
const wasmUrl = new URL("demo.wasm", assetBase).href;
const jsffiUrl = new URL("ghc_wasm_jsffi.js", assetBase).href;

try {
  const [{ default: createGhcWasmJsffi }, wasmResponse] = await Promise.all([
    import(jsffiUrl),
    fetch(wasmUrl),
  ]);

  if (!wasmResponse.ok) {
    throw new Error(`Failed to fetch WASM: ${wasmResponse.status} (${wasmUrl})`);
  }
  const wasmBuffer = await wasmResponse.arrayBuffer();

  let exportedFunctions = null;
  const exportsProxy = new Proxy(
    {},
    {
      get(_target, property) {
        if (!exportedFunctions) {
          throw new Error(`WASM exports not ready: ${String(property)}`);
        }
        return exportedFunctions[property];
      },
    }
  );

  const ghcWasmJsffi = createGhcWasmJsffi(exportsProxy);
  const fds = [
    new OpenFile(new File([])),
    ConsoleStdout.lineBuffered((msg) => console.log(msg)),
    ConsoleStdout.lineBuffered((msg) => console.error(msg)),
  ];
  const wasi = new WASI([], [], fds);

  const { instance } = await WebAssembly.instantiate(wasmBuffer, {
    wasi_snapshot_preview1: wasi.wasiImport,
    ghc_wasm_jsffi: ghcWasmJsffi,
  });

  exportedFunctions = instance.exports;
  wasi.inst = instance;

  if (typeof instance.exports._initialize === "function") {
    instance.exports._initialize();
  } else if (typeof instance.exports.hs_init === "function") {
    instance.exports.hs_init();
  }

  instance.exports.hs_startDemo();
  setStatus("Running.");

  const STAGE_BTN = {
    prior: "stage-prior",
    obs: "stage-obs",
    hidden: "stage-hidden",
    particles: "stage-particles",
  };

  // Hold the button across ≥1 RAF so the Rhine rising-edge sees it.
  function pulseButton(name) {
    const el = document.querySelector(`[data-btn="${name}"]`);
    if (!el) return Promise.resolve();
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          resolve();
        });
      });
    });
  }

  function setStage(stage) {
    const btn = STAGE_BTN[stage];
    if (!btn) return Promise.resolve();
    return pulseButton(btn);
  }

  window.setFrpDemoStage = setStage;
  window.addEventListener("message", (ev) => {
    const data = ev.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "frp-demo-stage") setStage(data.stage);
    if (data.type === "frp-demo-restart") {
      instance.exports.hs_restartDemo();
      setStatus("Restarted.");
      if (data.stage) setStage(data.stage);
    }
  });

  const params = new URLSearchParams(location.search);
  const boot = (async () => {
    if (params.has("stage")) await setStage(params.get("stage"));
    if (window.parent !== window) {
      window.parent.postMessage({ type: "frp-demo-ready" }, "*");
    }
  })();

  // Soft restart: reset automaton + clocks in Haskell (no WASM reload).
  for (const el of document.querySelectorAll("[data-restart]")) {
    el.addEventListener("click", async () => {
      instance.exports.hs_restartDemo();
      setStatus("Restarted.");
      if (params.has("stage")) await setStage(params.get("stage"));
    });
  }
  await boot;
} catch (err) {
  console.error(err);
  setStatus(`Error: ${err.message}`);
}
