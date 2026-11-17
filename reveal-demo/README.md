# Quarto + Reveal.js talk demo

Same skeleton as the Beamer deck, authored in Quarto Markdown.

## Preview

```bash
quarto preview talk.qmd
```

## Render once

```bash
quarto render talk.qmd
```

Then open `talk.html`.

## Notes

- Corner triangle edge follows each slide’s `{data-edge="..."}` attribute.
- Old hand-written `index.html` (if present) is superseded by Quarto.
- FRP tracker demo: live WASM embed under `media/frp/` (from `real-time-inference` demo1).
  Rebuild + copy with:

  ```bash
  cd ~/Documents/real-time-inference/browser-spike
  source ~/.ghc-wasm/env
  DEMO_SRC=src/Demo.demo1.hs OUT_DIR=web/demos/demo1 DEMO_NAME=demo1 ./build.sh
  cp web/demos/demo1/demo.wasm web/demos/demo1/ghc_wasm_jsffi.js web/run.js \
    ~/Documents/from-Dropbox/Reuben/Work/Applications/Flatiron/ccq-job-talk/reveal-demo/media/frp/
  ```

  Slide slots use `.frp-demo-slot[data-frp-stage=prior|obs|hidden|particles]`; `js/frp-demo.js` overlays one persistent iframe and stages visibility.
