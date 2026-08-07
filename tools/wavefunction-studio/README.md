# Wavefunction studio

An authoring tool for the looping wavefunction video in the quantum mechanics post. It
simulates a Gaussian wave packet crossing a double-slit barrier, renders it as a 3-D height
field (height = |ψ| or |ψ|², hue = phase, brightness = magnitude), lets you tune the whole
thing by eye, and exports a seamless mp4.

Lives outside `src/`, so Eleventy never sees it — `.eleventy.js` sets `dir.input: "src"`.
Nothing here ships to readers; the deliverable is the mp4.

## Running it

```bash
node tools/wavefunction-studio/serve.mjs      # → http://127.0.0.1:8123
```

Then tune, hit **Export master**, and encode:

```bash
tools/wavefunction-studio/encode.sh
```

That writes a ladder of mp4s into `out/`. Pick one, copy it to
`src/assets/img/qm/wavefunction-in-3d.mp4`.

`encode.sh` takes `[width] [height] [frames] [gop]`. The last two are coupled to how the
video is used:

- **`frames`** trims the clip. ⚠️ It also breaks the seamless loop — the loop only closes
  at a full injection period, so cutting early leaves a jump. Usually the right trade
  anyway: a viewer notices three dead seconds long before a one-frame discontinuity. To
  shorten it *without* the jump, raise `packetsInFlight` in step with `frames` instead.
- **`gop`** must be short if the video is embedded with `controls: true`. The default
  single-GOP encode makes every backwards seek decode from frame 0. Measured at
  1400×900 / 150 frames / CRF 18: `-g 150` → 2.59 MB, `-g 30` → 2.72 MB, `-g 15` →
  2.85 MB, `-g 5` → 3.30 MB. 15 is the sweet spot; seeks then land in 3–17 ms.

The shipped clip is `encode.sh 1400 900 150 15`.

`out/` is gitignored. `params.json` is not — it records every slider, the camera, and the
export size, and the simulation is deterministic, so it is the difference between "widen
the slits a little and re-export" being a 30-second job and an afternoon.

## Checking it

```bash
node tools/wavefunction-studio/test-sim.mjs   # physics, against closed-form solutions
```

Fourteen checks: FFT against a naive DFT, unitarity, the free packet against the exact
spreading-Gaussian solution, absorber behaviour, wall opacity, and loop periodicity — each
with a negative control, because every one of these fails *plausibly* rather than loudly.

The render path is checked separately, in a browser, since it is all shader code:

```bash
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" --headless=new \
  --use-gl=angle --use-angle=swiftshader --virtual-time-budget=240000 \
  --window-size=1220,560 --screenshot=/tmp/sheet.png --dump-dom \
  http://127.0.0.1:8123/check.html
```

That asserts the colour law matches `paintDoubleSlitField()` in `src/assets/js/quantum.js`
exactly, and dumps a six-frame contact sheet so you can see the loop at a glance.

⚠️ **The Browser pane cannot do either job.** Its tab is hidden, which suspends
`requestAnimationFrame` and throttles worker round-trips to seconds per frame, and it lays
the page out at zero width so every geometric reading silently comes back 0.

## How the pieces fit

| File | What |
|---|---|
| `sim.js` | Split-step Fourier TDSE + a Stockham FFT. Plain ES module, no DOM — which is what lets `test-sim.mjs` run it under bare node. |
| `sim.worker.js` | Runs `sim.js` off the main thread. Pull model: the page asks for frame *n*. |
| `shaders.js` | GLSL for the surface and the ground frame. |
| `scene.js` | three.js setup. `RawShaderMaterial` + GLSL3 throughout. |
| `app.js` | Controls, transport, export loop. |
| `serve.mjs` | Static server + the export sink (raw RGBA → ffmpeg stdin). |
| `encode.sh` | Lossless master → deliverable mp4s. |

## Things that cost time, so they are worth knowing

**Every length is a fraction of the domain, never a cell count.** `grid` is purely a
resolution dial. Parameters in cells were tried first and are a trap: the preview at 256²
and the export at 512² then show different physics, so what you tune is not what you ship.

**The simulated box is bigger than the visible one.** The absorbing layer sits entirely off
camera, so widening it never re-frames the shot.

**Three things are derived, not authored,** because each fails silently and plausibly:

- `dt`, from the barrier height — too large and the phase `e^{-iV dt}` wraps.
- `V₀`, from the wall thickness and the particle speed, targeting `κw = 6`. Transmission
  goes as `e^{-2κw}`, so a *slower* particle silently gets a leakier wall.
- The absorbing layer's width, at 2.5 wavelengths. A thinner ramp is not adiabatic and
  reflects — and the reflection looks exactly like real backscatter.

**The loop works by injecting a packet train and burning in.** Schrödinger is linear, so a
train is exactly the sum of one packet's solutions staggered in time; after a burn-in of
`ceil(packetsInFlight)` periods the field is genuinely periodic. `packetsInFlight` is the
main compositional control — at 1 you get one complete journey per loop ending on a dark
beat, at 2+ a new hill enters while the last is still spreading.

**Packets are born 5σ above the absorbing layer.** At 3σ the absorber clips the Gaussian's
tail, and a truncated Gaussian has broad spectral content — which showed up as a faint haze
over the whole window and a visible step at the loop seam. Fixing this moved the seam from
5.8% to 0.2% brightness.

**Exposure applies to colour but not to height.** The transmitted field is well under 1% of
the incident packet's amplitude, so without exposure the entire payoff of the video renders
black — but a gain big enough to lift it clamps the packet across ~3σ and turns the hill
into a flat-topped mesa. Height gets its dynamic range from the `knee` instead, which
compresses logarithmically and leaves the peak a dome. That is why the knee is a log slider
reaching down to 1e-5, and why probability mode wants a much smaller knee than amplitude
mode.

**Normalisation is fixed across the whole clip, never per frame.** The packet dims by orders
of magnitude as it spreads, and that dimming *is* the content.

**The master is lossless RGB (ffv1), not YUV.** A yuv444p master carries no colour tags, so
`zscale` later fails with "no path between colorspaces", and it would put two RGB→YUV
conversions in one pipeline. It has to be ffv1 rather than x264 because this ffmpeg's
libx264 has no RGB output colourspace — asking it for `gbrp` silently gives back `yuv444p`.

**Frame lines float slightly above the ground, not below it.** The surface is an opaque quad
that is merely *black* where |ψ| is zero, so lines underneath it are hidden everywhere.

**`uPixelScale` is why line weights survive the export.** Preview renders into a fixed
1400×900 buffer, so a `fwidth`-based line authored at 1.3 px is 1.3 px; the 2× export scales
it so the *final* downscaled width matches. Measuring line visibility in a smaller buffer
will report the lines as missing when they are only being measured at the wrong scale.
