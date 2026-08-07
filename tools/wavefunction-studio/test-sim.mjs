// Closed-form checks on sim.js. Run with:  node tools/wavefunction-studio/test-sim.mjs
//
// A wave simulation is unusually easy to get plausibly wrong — a broken FFT sign, a
// mis-indexed k grid or an over-eager absorber all produce something that still looks
// like physics. These are the checks that distinguish "looks right" from "is right",
// so run them before trusting anything the renderer shows.

import { WaveSim, defaultParams } from './sim.js';

let failures = 0;

function check(name, ok, detail) {
    const mark = ok ? '  ok  ' : ' FAIL ';
    console.log(`${mark} ${name}${detail ? `  —  ${detail}` : ''}`);
    if (!ok) failures++;
}

/* ============================================================================
   The analytic free-packet solution
   ============================================================================
   For psi0 = exp(-((x-xc)^2 + (y-yc)^2) / 2 sigma^2) * exp(i k0 y), free evolution gives

       psi(t) = (sigma^2 / alpha) * exp(-((x-xc)^2 + v^2) / 2 alpha) * exp(i(k0 y - k0^2 t / 2))
       alpha  = sigma^2 + i t,   v = y - yc - k0 t

   which is exactly the initial condition injectPacket() writes. Derived rather than
   copied, so testAnalyticSatisfiesSchrodinger below verifies the formula itself before
   it is used to judge the simulation. */

function analytic(x, y, t, { sigma, k0, xc, yc }) {
    const s2 = sigma * sigma;
    const den = s2 * s2 + t * t;          // |alpha|^2
    const v = y - yc - k0 * t;
    const z = (x - xc) * (x - xc) + v * v;

    // -z / (2 alpha) = -z (s2 - i t) / (2 |alpha|^2)
    const expRe = -z * s2 / (2 * den);
    const expIm = z * t / (2 * den);

    // sigma^2 / alpha = sigma^2 (s2 - i t) / |alpha|^2
    const preRe = s2 * s2 / den;
    const preIm = -s2 * t / den;

    const phase = k0 * y - 0.5 * k0 * k0 * t;
    const m = Math.exp(expRe);
    const totalRe = m * Math.cos(expIm + phase);
    const totalIm = m * Math.sin(expIm + phase);

    return {
        re: preRe * totalRe - preIm * totalIm,
        im: preRe * totalIm + preIm * totalRe,
    };
}

/* ============================================================================
   1. The FFT itself
   ============================================================================ */

function testFFT() {
    const n = 16;
    const sim = new WaveSim({ grid: n, frames: 8 });
    const fft = sim.fft;

    const srcRe = [];
    const srcIm = [];
    for (let i = 0; i < n; i++) {
        srcRe.push(Math.cos(i * 1.7) + 0.3 * i);
        srcIm.push(Math.sin(i * 0.4) - 0.2 * i);
    }

    // Naive DFT, sign = -1
    const wantRe = new Float64Array(n);
    const wantIm = new Float64Array(n);
    for (let k = 0; k < n; k++) {
        for (let j = 0; j < n; j++) {
            const th = -2 * Math.PI * k * j / n;
            wantRe[k] += srcRe[j] * Math.cos(th) - srcIm[j] * Math.sin(th);
            wantIm[k] += srcRe[j] * Math.sin(th) + srcIm[j] * Math.cos(th);
        }
    }

    fft.ar.set(srcRe);
    fft.ai.set(srcIm);
    fft.run(-1);

    let worst = 0;
    for (let k = 0; k < n; k++) {
        worst = Math.max(worst, Math.abs(fft.ar[k] - wantRe[k]), Math.abs(fft.ai[k] - wantIm[k]));
    }
    check('FFT matches a naive DFT', worst < 1e-9, `max |diff| = ${worst.toExponential(2)}`);

    // Round trip
    fft.run(1);
    let rt = 0;
    for (let k = 0; k < n; k++) {
        rt = Math.max(rt, Math.abs(fft.ar[k] / n - srcRe[k]), Math.abs(fft.ai[k] / n - srcIm[k]));
    }
    check('FFT forward then inverse is the identity', rt < 1e-12, `max |diff| = ${rt.toExponential(2)}`);
}

/* ============================================================================
   2. The analytic formula is itself a solution
   ============================================================================
   Checked by numerical differentiation, so the free-packet comparison below is not
   circular: if this passes, the formula really does solve i psi_t = -1/2 laplacian psi. */

function testAnalyticSatisfiesSchrodinger() {
    const p = { sigma: 8, k0: 0.5, xc: 3, yc: 20 };
    const h = 1e-3;
    let worst = 0;

    for (const [x, y, t] of [[1, 25, 4], [-6, 14, 11], [5, 30, 0.5]]) {
        const c = analytic(x, y, t, p);
        const dt = {
            re: (analytic(x, y, t + h, p).re - analytic(x, y, t - h, p).re) / (2 * h),
            im: (analytic(x, y, t + h, p).im - analytic(x, y, t - h, p).im) / (2 * h),
        };
        const lap = {
            re: (analytic(x + h, y, t, p).re + analytic(x - h, y, t, p).re
                + analytic(x, y + h, t, p).re + analytic(x, y - h, t, p).re - 4 * c.re) / (h * h),
            im: (analytic(x + h, y, t, p).im + analytic(x - h, y, t, p).im
                + analytic(x, y + h, t, p).im + analytic(x, y - h, t, p).im - 4 * c.im) / (h * h),
        };
        // i psi_t + 1/2 laplacian = 0
        const resRe = -dt.im + 0.5 * lap.re;
        const resIm = dt.re + 0.5 * lap.im;
        const mag = Math.hypot(c.re, c.im) || 1;
        worst = Math.max(worst, Math.hypot(resRe, resIm) / mag);
    }
    check('analytic solution satisfies the Schrodinger equation',
        worst < 1e-4, `max relative residual = ${worst.toExponential(2)}`);
}

/* ============================================================================
   3. Unitarity — no barrier, no absorber
   ============================================================================
   Every factor in the split step is a pure phase, so the norm must be conserved to
   round-off. This single check catches almost any FFT or k-grid indexing bug. */

function testUnitarity() {
    const sim = new WaveSim({
        grid: 256, waves: 12, spread: 0.05, absorbStrength: 0, barrierFactor: 0, frames: 240,
    });
    const start = sim.norm();
    const steps = Math.min(150, sim.periodSteps - 1); // stop short of the next injection
    for (let i = 0; i < steps; i++) sim.step();
    const drift = Math.abs(sim.norm() - start) / start;
    check('norm is conserved with V = 0 and no absorber',
        drift < 1e-12, `relative drift over ${steps} steps = ${drift.toExponential(2)}`);
}

/* ============================================================================
   4. Free packet against the closed form
   ============================================================================ */

function testFreeSpreading() {
    const sigma = 0.03; // narrow, so it spreads appreciably within the test window
    const sim = new WaveSim({
        grid: 256, waves: 12, spread: sigma,
        absorbStrength: 0, barrierFactor: 0, frames: 240,
    });

    const target = 0.30 / sim.velocity;                  // travel about a third of the domain
    const steps = Math.min(Math.round(target / sim.dt), sim.periodSteps - 1);
    for (let i = 0; i < steps; i++) sim.step();
    const t = steps * sim.dt;

    const p = { sigma, k0: sim.wavenumber, xc: 0, yc: sim.injectY };
    let worst = 0;
    let peak = 0;

    for (let iy = 0; iy < sim.ny; iy++) {
        for (let ix = 0; ix < sim.nx; ix++) {
            const want = analytic(sim.xAt(ix), sim.yAt(iy), t, p);
            const i = iy * sim.nx + ix;
            peak = Math.max(peak, Math.hypot(want.re, want.im));
            worst = Math.max(worst, Math.hypot(sim.re[i] - want.re, sim.im[i] - want.im));
        }
    }

    const rel = worst / peak;
    check('free packet matches the analytic spreading Gaussian',
        rel < 5e-3, `max |diff| / peak = ${rel.toExponential(2)} after t = ${t.toExponential(2)}`);

    // The width really did grow — otherwise the check above passes on a packet that
    // never did anything interesting.
    const growth = Math.sqrt(1 + (t / (sigma * sigma)) ** 2);
    check('packet actually spread during the test',
        growth > 1.5, `sigma(t)/sigma = ${growth.toFixed(2)}`);
}

/* ============================================================================
   5. The absorbing layer
   ============================================================================ */

function testAbsorber() {
    const sim = new WaveSim({ grid: 256, waves: 12, barrierFactor: 0, frames: 120 });

    const start = sim.norm();
    const history = [];
    // Exactly one period, stopping short of the next injection. This doubles as a check
    // that deriveTiming()'s journey estimate really is long enough for a packet to die
    // within one loop — which is what makes packetsInFlight = 1 loop cleanly.
    for (let i = 0; i < sim.periodSteps - 1; i++) {
        sim.step();
        if (i % 20 === 0) history.push(sim.norm() / start);
    }

    const monotonic = history.every((v, i) => i === 0 || v <= history[i - 1] + 1e-9);
    check('norm decays monotonically as the packet is absorbed',
        monotonic, `${history[0].toFixed(3)} -> ${history[history.length - 1].toExponential(2)}`);

    const retained = sim.norm() / start;
    check('packet is gone by the end of one period',
        retained < 1e-3, `retained = ${retained.toExponential(2)}`);

    // A too-abrupt ramp reflects, and the reflection re-enters the interior after the
    // packet has left. Nothing should be sitting in the middle of the box.
    const w = sim.window;
    let interior = 0;
    for (let iy = w.y0; iy < w.y1; iy++) {
        for (let ix = w.x0; ix < w.x1; ix++) {
            const i = iy * sim.nx + ix;
            interior += sim.re[i] * sim.re[i] + sim.im[i] * sim.im[i];
        }
    }
    check('absorbing layer does not reflect back into the interior',
        interior / start < 1e-4, `interior fraction = ${(interior / start).toExponential(2)}`);
}

/* ============================================================================
   6. The barrier actually blocks
   ============================================================================ */

function testBarrierOpacity() {
    const run = (slitWidth) => {
        const sim = new WaveSim({ grid: 256, waves: 12, slitWidth, frames: 120 });
        // Stop a little after the packet would have reached the wall, before the
        // reflected half has had time to be absorbed and distort the ratio.
        const t = (sim.wallY + 0.2 - sim.injectY) / sim.velocity;
        const steps = Math.min(Math.round(t / sim.dt), sim.periodSteps - 1);
        for (let i = 0; i < steps; i++) sim.step();

        const cut = sim.indexOfY(sim.wallY + sim.params.wallThickness / 2 + 0.02);
        let past = 0;
        let total = 0;
        for (let iy = 0; iy < sim.ny; iy++) {
            for (let ix = 0; ix < sim.nx; ix++) {
                const i = iy * sim.nx + ix;
                const d = sim.re[i] * sim.re[i] + sim.im[i] * sim.im[i];
                total += d;
                if (iy > cut) past += d;
            }
        }
        return total > 0 ? past / total : 0;
    };

    const closed = run(0);
    check('a closed wall transmits essentially nothing',
        closed < 0.01, `fraction past the wall = ${closed.toExponential(2)}`);

    // And the slits are what lets anything through — otherwise "opaque" could just mean
    // the packet never arrived.
    const open = run(0.02);
    check('opening the slits lets a real fraction through',
        open > 20 * Math.max(closed, 1e-12), `open = ${open.toExponential(2)} vs closed = ${closed.toExponential(2)}`);
}

/* ============================================================================
   7. Loop periodicity
   ============================================================================ */

// The honest metric is not an L2 norm: it is the largest amplitude mismatch at the seam,
// measured against the peak the whole clip is normalised to, because that is the quantity
// the brightness law turns into something an eye can see. A haze that barely moves the L2
// residual can still be a visible step on black.
function periodicityResidual(params) {
    const sim = new WaveSim(params);
    sim.stepToFrame(0);
    const first = sim.snapshot();

    let clipPeak = sim.peakMagnitude();
    for (let f = 1; f <= params.frames; f++) {
        sim.stepToFrame(f);
        clipPeak = Math.max(clipPeak, sim.peakMagnitude());
    }
    const last = sim.snapshot();

    let worst = 0;
    for (let i = 0; i < first.length; i += 2) {
        worst = Math.max(worst, Math.hypot(last[i] - first[i], last[i + 1] - first[i + 1]));
    }
    return worst / Math.max(clipPeak, 1e-30);
}

// Found by watching the loop, not by any metric: with the packet born on camera, the clip
// plays "... empty ... empty ... POP a hill exists". No seam metric catches it, because
// frame N genuinely does equal frame 0 — the injection happens exactly at the boundary.
// The entry corridor is what fixes it, and this is what stops it coming back.
function testBirthIsOffCamera() {
    for (const spread of [0.03, 0.055, 0.1]) {
        const sim = new WaveSim({ ...defaultParams, grid: 128, spread });
        const d = sim.diagnostics();
        const brightness = Math.pow(14 * d.birthVisibility, 0.6);  // exposure 14, gamma 0.6
        check(`packet is born off camera at sigma = ${spread}`,
            brightness < 0.02,
            `${(d.birthVisibility * 100).toExponential(1)}% amplitude at the near edge `
            + `-> ${(brightness * 100).toFixed(2)}% brightness`);
    }
}

function testPeriodicity() {
    const base = { grid: 256, waves: 24, frames: 60 };

    // 0.002 of the clip peak is about 3% brightness once the gamma-0.6 law is applied —
    // below anything an eye picks out of a black field.
    const seen = (r) => `${(r * 100).toFixed(2)}% of clip peak (~${(Math.pow(r, 0.6) * 100).toFixed(1)}% brightness)`;

    const single = periodicityResidual({ ...base, packetsInFlight: 1 });
    check('loop seam is invisible with one packet per loop',
        single < 2e-3, seen(single));

    // Three packets in the air at once is the "continuous train" setting, and it only
    // loops because the burn-in has already established the full complement.
    const train = periodicityResidual({ ...base, packetsInFlight: 3 });
    check('loop seam is invisible with a three-packet train',
        train < 2e-3, seen(train));

    // Negative control: starving the burn-in must visibly break it. Without this the
    // check above could be passing because nothing overlaps rather than because the
    // burn-in works.
    const starved = periodicityResidual({ ...base, packetsInFlight: 3, burnInPeriods: 0 });
    check('skipping the burn-in visibly breaks the seam',
        starved > 5e-2, seen(starved));
}

/* ============================================================================
   8. Timing — decides the quality tiers the UI offers
   ============================================================================ */

function benchmark() {
    console.log('\n  step cost at the default settings (this machine)');
    for (const grid of [128, 256, 512]) {
        const sim = new WaveSim({ ...defaultParams, grid });
        for (let i = 0; i < 3; i++) sim.step(); // warm up the JIT
        const t0 = process.hrtime.bigint();
        const reps = grid === 512 ? 10 : 30;
        for (let i = 0; i < reps; i++) sim.step();
        const ms = Number(process.hrtime.bigint() - t0) / 1e6 / reps;
        const d = sim.diagnostics();
        console.log(`    ${String(grid).padStart(3)}^2 : ${ms.toFixed(1).padStart(5)} ms/step`
            + `  x ${String(d.totalSteps).padStart(4)} steps`
            + `  = ${(ms * d.totalSteps / 1000).toFixed(1).padStart(5)} s per run`
            + `   (${d.stepsPerFrame} steps/frame, ${d.cellsPerWavelength.toFixed(1)} cells/lambda`
            + `${d.aliasing ? '  ** ALIASED **' : ''})`);
    }
}

/* ============================================================================
   RUN
   ============================================================================ */

testFFT();
testAnalyticSatisfiesSchrodinger();
testUnitarity();
testFreeSpreading();
testAbsorber();
testBarrierOpacity();
testBirthIsOffCamera();
testPeriodicity();
benchmark();

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
