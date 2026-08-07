// Split-step Fourier solution of the 2-D time-dependent Schrodinger equation, hbar = m = 1.
//
//     i dpsi/dt = -1/2 laplacian(psi) + V(x,y) psi
//
// Deliberately a plain ES module with no DOM references: it runs unchanged in a Web Worker
// and under bare node, which is what makes the closed-form checks in test-sim.mjs possible.
// Those checks are the reason to trust anything downstream, so keep this file importable.
//
// ⚠️ Every length is a fraction of the domain, never a cell count. The visible domain is
// fixed at x in [-0.5, 0.5], y in [0, 1], and `grid` is *purely* a resolution dial —
// halving it gives the same physics, more coarsely sampled. Parameters in cells were tried
// first and are a trap: the preview at 256 and the export at 512 then show different
// pictures, so what you tune is not what you ship.
//
// The simulated box is larger than the visible one by `absorbWidth` on every side, so the
// absorbing layer lives entirely off camera and widening it never re-frames the shot.

/* ============================================================================
   CONSTANTS & CONFIG
   ============================================================================ */

// Strang splitting is *exact* wherever V = 0, so dt is bounded only by the barrier:
// the phase e^{-iV dt} must not wrap, and the packet must not step across the wall in
// one go. Both are enforced in deriveTiming(); these are the budgets they enforce.
// MAX_BARRIER_PHASE is the dominant cost driver — it sets the step count almost alone.
const MAX_BARRIER_PHASE = 1.0;  // radians of V0*dt, comfortably under pi
const MIN_WALL_STEPS = 4;       // steps taken while traversing the barrier thickness

// Below ~8 cells per de Broglie wavelength the fringes moire into patterns that look
// exactly like real physics. 12+ is where it stops being visible at all.
export const MIN_CELLS_PER_WAVELENGTH = 8;

// The absorbing layer must be at least this many wavelengths deep. A thinner ramp is not
// adiabatic and reflects — and the reflection is a plausible-looking counter-propagating
// ripple, not an obvious artefact, so it gets believed. This is derived, never authored.
const ABSORB_WAVELENGTHS = 2.5;

// The wall must actually be a wall. Transmission through a barrier goes as e^{-2 kappa w}
// with kappa = k0 sqrt(V0/E - 1), so opacity depends on the particle's *speed* — a slower
// packet silently gets a leakier wall unless V0 is derived rather than authored. Target
// kappa*w = 6, i.e. about 6e-6 of the amplitude tunnels through.
const TARGET_OPACITY = 6;

// How much of the packet's spreading tail has to clear the far edge before the loop can
// close. 4 sigma was tried and leaves a visible remnant, because the packet keeps
// spreading while it drifts — the tail has to be measured at the journey's end, not at
// the crossing time, which is why solveJourneyTime() iterates.
const TAIL_SIGMAS = 5;

// How far above the absorbing layer a packet is born. ⚠️ Not cosmetic: at 3 sigma the
// absorber clips the Gaussian's tail, and a truncated Gaussian has broad spectral content
// — which shows up as a faint high-k haze over the whole window that decays only slowly
// and puts a visible step at the loop seam. At 5 sigma the clipped amplitude is e^-12.5
// and the haze goes away.
const INJECT_SIGMAS = 5;

// ⚠️ The entry corridor, in sigmas, upstream of the visible square. Without it the packet
// is born *on camera* at full amplitude, and the loop plays as "... empty ... empty ... POP
// a hill exists". That is not a periodicity failure — frame N really does equal frame 0,
// because the injection happens exactly at the boundary — so no seam metric catches it;
// you only see it by watching the loop. The corridor has to clear INJECT_SIGMAS for the
// absorber plus ~4.5 sigma for the packet's own visible tail.
const ENTRY_SIGMAS = 10;

export const defaultParams = {
    // These four are a coherent operating point, not independent taste. The simulated box
    // is the visible square plus the absorbing layer (2.5 lambda) plus the entry corridor
    // (10 sigma), so a wider packet or a slower particle costs resolution over the part
    // you can actually see. At these values a 512 grid gives ~15 cells per wavelength
    // (comfortably above the moire floor of 8) and about five fringes across the wall.
    grid: 256,              // cells per side, power of two. Resolution only.
    waves: 18,              // de Broglie wavelengths across the domain — this is "speed"
    spread: 0.055,          // sigma of the initial Gaussian, in domain widths
    slitWidth: 0.022,
    slitSeparation: 0.13,   // centre to centre
    wallDistance: 0.50,     // barrier position down the domain
    wallThickness: 0.03,
    barrierFactor: null,    // V0 / E. null = derived for opacity; 0 removes the wall
    absorbStrength: 6,      // alpha in exp(-alpha * (depth/L)^3)
    frames: 240,            // frames in one loop period
    // The main compositional control. At 1 a packet completes its whole journey inside the
    // loop — but a packet spends most of its life as a dim, slowly-fading tail, so roughly
    // 60% of the clip ends up near black. At 2 the loop covers half a journey and a fresh
    // hill enters as the previous pattern is still spreading, which fills the frame and is
    // arguably truer to the experiment, since the real double slit fires many particles.
    //
    // Note: time per frame is journeyTime / (packetsInFlight * frames), so raising this in
    // step with `frames` shortens the loop at a constant pace. That is the way to get a
    // seamless short clip; encode.sh's trim argument is the way to get a punchy one.
    packetsInFlight: 2,
    burnInPeriods: null,    // null = auto, ceil(packetsInFlight)
};

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

function smoothstep(edge0, edge1, x) {
    if (edge1 === edge0) return x < edge0 ? 0 : 1;
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

// A box with smoothstep shoulders. A hard step in V has infinite spectral content and
// rings visibly in the transmitted field, so nothing here is ever a bare comparison.
//
// ⚠️ The width <= 0 guard is load-bearing. Without it the two shoulders overlap and the
// product s*(1-s) peaks at 0.25, so a zero-width slit leaves the wall a quarter open —
// which reads as "the barrier is too transparent", not as a degenerate-geometry bug.
function smoothBox(u, centre, width, edge) {
    if (width <= 0) return 0;
    const half = width / 2;
    const e = Math.min(Math.max(edge, 1e-9), half);
    return smoothstep(centre - half - e, centre - half + e, u)
        * (1 - smoothstep(centre + half - e, centre + half + e, u));
}

const _f32 = new Float32Array(1);
const _u32 = new Uint32Array(_f32.buffer);

// float32 -> float16 bits. Half-float is what the field texture uses: WebGL2 gives it
// LINEAR filtering as core, where full float would need OES_texture_float_linear.
export function toHalf(value) {
    _f32[0] = value;
    const x = _u32[0];
    const sign = (x >>> 16) & 0x8000;
    const exponent = (x >>> 23) & 0xff;
    let mantissa = x & 0x7fffff;

    if (exponent === 255) return sign | 0x7c00 | (mantissa ? 0x200 : 0);

    const e = exponent - 127 + 15;
    if (e >= 31) return sign | 0x7c00;
    if (e <= 0) {
        if (e < -10) return sign;
        mantissa = (mantissa | 0x800000) >> (1 - e);
        return sign | (mantissa >> 13);
    }
    return sign | (e << 10) | (mantissa >> 13);
}

/* ============================================================================
   FFT — Stockham autosort, radix 2
   ============================================================================ */

// Stockham rather than Cooley-Tukey because it needs no bit-reversal pass: each stage
// writes to a scratch buffer and the two swap, so the output comes out in natural order.
// Values are loaded into `ar`/`ai` by the caller, transformed in place, and read back.
class FFT {
    constructor(n) {
        if (n < 2 || (n & (n - 1)) !== 0) {
            throw new Error(`FFT size ${n} is not a power of two`);
        }
        this.n = n;
        this.ar = new Float64Array(n);
        this.ai = new Float64Array(n);
        this.tr = new Float64Array(n);
        this.ti = new Float64Array(n);

        // j*m never reaches n/2 across all stages, so a half-turn table is enough.
        this.cos = new Float64Array(n / 2);
        this.sin = new Float64Array(n / 2);
        for (let t = 0; t < n / 2; t++) {
            this.cos[t] = Math.cos(2 * Math.PI * t / n);
            this.sin[t] = Math.sin(2 * Math.PI * t / n);
        }
    }

    // sign = -1 forward, +1 inverse. Unscaled — WaveSim divides by n once per axis.
    run(sign) {
        const n = this.n;
        const cos = this.cos;
        const sin = this.sin;

        let xr = this.ar, xi = this.ai;
        let yr = this.tr, yi = this.ti;
        let stages = 0;

        for (let l = n >> 1, m = 1; l >= 1; l >>= 1, m <<= 1) {
            for (let j = 0; j < l; j++) {
                const t = j * m;
                const wr = cos[t];
                const wi = sign * sin[t];
                const from = j * m;
                const mate = from + l * m;
                const to = 2 * j * m;

                for (let k = 0; k < m; k++) {
                    const a = from + k;
                    const b = mate + k;
                    const par = xr[a], pai = xi[a];
                    const pbr = xr[b], pbi = xi[b];

                    yr[to + k] = par + pbr;
                    yi[to + k] = pai + pbi;

                    const dr = par - pbr;
                    const di = pai - pbi;
                    yr[to + m + k] = wr * dr - wi * di;
                    yi[to + m + k] = wr * di + wi * dr;
                }
            }
            let swap = xr; xr = yr; yr = swap;
            swap = xi; xi = yi; yi = swap;
            stages++;
        }

        // Each stage swaps, so an odd stage count leaves the answer in the scratch pair.
        if (stages & 1) {
            this.ar.set(xr);
            this.ai.set(xi);
        }
    }
}

/* ============================================================================
   CORE LOGIC
   ============================================================================ */

export class WaveSim {
    constructor(params = {}) {
        this.configure(params);
    }

    configure(params) {
        const p = { ...defaultParams, ...params };
        this.params = p;

        const n = p.grid;
        this.nx = n;
        this.ny = n;
        this.size = n * n;

        this.re = new Float64Array(this.size);
        this.im = new Float64Array(this.size);

        this.fft = new FFT(n); // nx === ny, so one instance serves both sweeps

        this.buildPotential();
        this.buildMask();
        this.deriveTiming();
        this.buildKineticFactor();
        this.buildPotentialFactor();
        this.reset();
    }

    // --- geometry (domain units; dx converts to cells) ---------------------
    //
    // Visible square is x in [-0.5, 0.5], y in [0, 1]. The grid covers that plus an
    // absorbing margin on all four sides, so index 0 sits at -absorbWidth, not at 0.

    get absorbWidth() {
        return Math.min(0.35, Math.max(0.04, ABSORB_WAVELENGTHS / this.params.waves));
    }

    get entryMargin() { return ENTRY_SIGMAS * this.params.spread; }

    // Square box, so nx = ny and both stay powers of two for the FFT. The visible square
    // is centred in x and sits at the downstream end in y, with the entry corridor and the
    // absorbing layer taking up the rest.
    get span() { return 1 + 2 * this.absorbWidth + this.entryMargin; }
    get dx() { return this.span / this.nx; }

    xAt(ix) { return (ix + 0.5) * this.dx - this.span / 2; }
    yAt(iy) { return (iy + 0.5) * this.dx - (this.absorbWidth + this.entryMargin); }

    // Inverse of yAt. Use this rather than y * ny — the grid origin is not at y = 0, and
    // assuming it is silently reads the wrong side of the barrier.
    indexOfY(y) { return Math.round((y + this.absorbWidth + this.entryMargin) / this.dx - 0.5); }

    get wallY() { return this.params.wallDistance; }

    // Born far enough downstream of the absorbing layer that it is not damped at birth,
    // and far enough upstream of the wall that it is a clean hill when it arrives.
    // Clamped rather than trusted: the spread slider can otherwise push the packet
    // straight into the barrier, which reads as "the wall is broken".
    // Born INJECT_SIGMAS above the absorber so its tail is not clipped, and at least
    // 3 sigma clear of the wall so it arrives as a hill rather than already touching.
    // Clamped rather than trusted: the spread slider can otherwise push the packet into
    // the barrier, which reads as "the wall is broken".
    // Born INJECT_SIGMAS clear of the absorber, inside the entry corridor, so its tail is
    // neither clipped nor on camera. Clamped rather than trusted: the spread slider can
    // otherwise push the packet into the barrier, which reads as "the wall is broken".
    get injectY() {
        const p = this.params;
        const corridorTop = -this.entryMargin + INJECT_SIGMAS * p.spread;
        const latest = p.wallDistance - p.wallThickness / 2 - 3 * p.spread;
        return Math.min(corridorTop, latest);
    }

    // Rendered window, in grid indices — exactly the visible unit square.
    get window() {
        const inset = Math.round((this.span / 2 - 0.5) / this.dx);
        const y0 = Math.round((this.absorbWidth + this.entryMargin) / this.dx);
        return {
            x0: inset,
            x1: this.nx - inset,
            y0,
            y1: Math.min(this.ny, y0 + Math.round(1 / this.dx)),
        };
    }

    // --- derived quantities exposed to the UI -----------------------------

    get wavenumber() { return 2 * Math.PI * this.params.waves; }
    get velocity() { return this.wavenumber; }              // hbar = m = 1, so v = k
    get wavelength() { return 1 / this.params.waves; }      // domain widths

    // What actually matters for moire: cells per wavelength over the *visible* square,
    // which the absorbing margin reduces.
    get cellsPerWavelength() { return this.wavelength / this.dx; }
    get energy() { return 0.5 * this.wavenumber * this.wavenumber; }

    // Just opaque enough, and no more: V0 is the dominant cost driver through
    // dt <= MAX_BARRIER_PHASE / V0, so overshooting here buys nothing and costs steps.
    get barrierFactor() {
        const override = this.params.barrierFactor;
        if (override !== null && override !== undefined) return override;
        const kw = this.wavenumber * this.params.wallThickness;
        return Math.min(60, Math.max(2, 1 + (TARGET_OPACITY / Math.max(kw, 1e-6)) ** 2));
    }

    get barrierHeight() { return this.barrierFactor * this.energy; }

    // kappa * w — the exponent that decides how much tunnels through. Reported so a
    // thin-wall setting shows up as a number rather than as a mysterious glow.
    get wallOpacity() {
        const f = this.barrierFactor;
        if (f <= 1) return 0;
        return this.wavenumber * Math.sqrt(f - 1) * this.params.wallThickness;
    }

    /* --- setup ---------------------------------------------------------- */

    buildPotential() {
        const { nx, ny, params: p } = this;
        const V = new Float64Array(this.size);
        const v0 = this.barrierHeight;
        const half = p.slitSeparation / 2;
        const edge = 1.5 * this.dx; // shoulders about 1.5 cells wide, at any resolution

        for (let iy = 0; iy < ny; iy++) {
            // The wall spans the full width; leaving the ends open lets the packet run
            // around them through the FFT's periodic wrap.
            const alongY = smoothBox(this.yAt(iy), this.wallY, p.wallThickness, edge);
            if (alongY <= 0) continue;

            for (let ix = 0; ix < nx; ix++) {
                const x = this.xAt(ix);
                const open = Math.min(1,
                    smoothBox(x, -half, p.slitWidth, edge) +
                    smoothBox(x, half, p.slitWidth, edge));
                V[iy * nx + ix] = v0 * alongY * (1 - open);
            }
        }
        this.V = V;
    }

    // The FFT is periodic, so without this the packet wraps around the box and
    // interferes with itself. The ramp has to be adiabatic (wide and smooth) or the
    // ramp itself reflects, which looks exactly like real backscatter.
    buildMask() {
        const { nx, ny, params: p } = this;
        const mask = new Float64Array(this.size);
        const L = Math.max(1, Math.round(this.absorbWidth / this.dx)); // in cells
        const alpha = p.absorbStrength;

        const profile = (d) => {
            if (d >= L) return 1;
            const s = (L - d) / L;
            return Math.exp(-alpha * s * s * s);
        };

        for (let iy = 0; iy < ny; iy++) {
            const dy = Math.min(iy, ny - 1 - iy);
            for (let ix = 0; ix < nx; ix++) {
                const dx = Math.min(ix, nx - 1 - ix);
                mask[iy * nx + ix] = profile(dx) * profile(dy);
            }
        }
        this.mask = mask;
    }

    // dt is derived, never authored. Both bounds below fail silently and plausibly if
    // violated: too large and the barrier phase wraps, or the packet teleports through
    // the wall in a single step while still looking like a wave.
    // A packet is injected exactly once per loop, always. `packetsInFlight` instead sets
    // how much simulated time one loop covers, which is the same control seen from the
    // useful end: at 1 a packet completes its whole journey within the loop (so the loop
    // ends on a dark beat), at 2 it is only half done when the next arrives (a train).
    // t must satisfy  injectY + v*t - TAIL_SIGMAS*sigma(t) >= far edge,  where sigma(t)
    // itself grows with t. Solved by fixed-point iteration rather than evaluating sigma at
    // the crossing time, which under-estimates the tail and leaves a remnant on camera.
    // Diverges when the packet spreads faster than it drifts (very slow, very narrow);
    // the cap turns that into a merely long run instead of an infinite one.
    solveJourneyTime(reach) {
        const sigma = this.params.spread;
        const v = this.velocity;
        const tau = sigma * sigma;
        const cap = 50 * reach / v;

        let t = reach / v;
        for (let i = 0; i < 40; i++) {
            const s = sigma * Math.sqrt(1 + (t / tau) ** 2);
            const next = (reach + TAIL_SIGMAS * s) / v;
            if (!Number.isFinite(next) || next > cap) return cap;
            if (Math.abs(next - t) <= 1e-12 * next) return next;
            t = next;
        }
        return Math.min(t, cap);
    }

    deriveTiming() {
        const p = this.params;
        const v = this.velocity;

        // How long from birth to gone: across the domain, into the far absorber, plus the
        // tail the packet has grown by then. Skipping the tail term leaves a remnant at
        // the loop point that no amount of burn-in removes.
        const reach = (1 + this.absorbWidth) - this.injectY;
        this.journeyTime = this.solveJourneyTime(reach);

        this.totalTime = this.journeyTime / Math.max(p.packetsInFlight, 1e-3);

        const frameTime = this.totalTime / p.frames;
        const dtBarrier = MAX_BARRIER_PHASE / Math.max(this.barrierHeight, 1e-12);
        const dtCrossing = p.wallThickness / (MIN_WALL_STEPS * v);
        const dtMax = Math.min(dtBarrier, dtCrossing);

        this.stepsPerFrame = Math.max(1, Math.ceil(frameTime / dtMax));
        this.dt = frameTime / this.stepsPerFrame;

        this.periodFrames = p.frames;
        this.periodSteps = p.frames * this.stepsPerFrame;

        // A packet lives `packetsInFlight` loops, so that many must already be in the air
        // before the recorded window starts or frame 0 is short of the complement that
        // frame N has.
        const burnIn = p.burnInPeriods ?? Math.ceil(p.packetsInFlight);
        this.burnInPeriods = burnIn;
        this.recordStart = burnIn * this.periodSteps;
        this.totalSteps = this.recordStart + p.frames * this.stepsPerFrame;
    }

    buildKineticFactor() {
        const { nx, ny, dt } = this;
        const cos = new Float64Array(this.size);
        const sin = new Float64Array(this.size);

        // DFT frequencies over the *simulated* box, which is `span` wide — not 1, and not
        // nx. Getting this wrong rescales every wavelength while still looking like waves.
        const span = this.span;
        const kxs = new Float64Array(nx);
        for (let ix = 0; ix < nx; ix++) {
            kxs[ix] = 2 * Math.PI * (ix < nx / 2 ? ix : ix - nx) / span;
        }
        const kys = new Float64Array(ny);
        for (let iy = 0; iy < ny; iy++) {
            kys[iy] = 2 * Math.PI * (iy < ny / 2 ? iy : iy - ny) / span;
        }

        for (let iy = 0; iy < ny; iy++) {
            const ky2 = kys[iy] * kys[iy];
            for (let ix = 0; ix < nx; ix++) {
                // Exact free propagator for this mode. No dt restriction lives here —
                // the phase may wrap many times and still be the true phase.
                const phase = -0.5 * (kxs[ix] * kxs[ix] + ky2) * dt;
                const i = iy * nx + ix;
                cos[i] = Math.cos(phase);
                sin[i] = Math.sin(phase);
            }
        }
        this.kinCos = cos;
        this.kinSin = sin;
    }

    buildPotentialFactor() {
        const halfStep = -0.5 * this.dt;
        const cos = new Float64Array(this.size);
        const sin = new Float64Array(this.size);
        for (let i = 0; i < this.size; i++) {
            const phase = this.V[i] * halfStep;
            cos[i] = Math.cos(phase);
            sin[i] = Math.sin(phase);
        }
        this.potCos = cos;
        this.potSin = sin;
    }

    /* --- evolution ------------------------------------------------------- */

    reset() {
        this.re.fill(0);
        this.im.fill(0);
        this.stepIndex = 0;
        this.injectIfDue();
    }

    // Adding a packet is exact rather than approximate: Schrodinger is linear, so a
    // train of packets is precisely the sum of one packet's solutions staggered in
    // time. That linearity is what makes the loop periodic by construction.
    injectPacket() {
        const { nx, ny, params: p } = this;
        const cy = this.injectY;
        const k0 = this.wavenumber;
        const twoSigmaSq = 2 * p.spread * p.spread;

        // Only touch cells within 4 sigma; beyond that the envelope is below 3e-4.
        const reachCells = Math.ceil(4 * p.spread / this.dx);
        const centreX = nx / 2;
        const centreY = (cy + this.absorbWidth + this.entryMargin) / this.dx - 0.5;
        const iy0 = Math.max(0, Math.floor(centreY - reachCells));
        const iy1 = Math.min(ny - 1, Math.ceil(centreY + reachCells));
        const ix0 = Math.max(0, Math.floor(centreX - reachCells));
        const ix1 = Math.min(nx - 1, Math.ceil(centreX + reachCells));

        for (let iy = iy0; iy <= iy1; iy++) {
            const y = this.yAt(iy);
            const dy = y - cy;
            const phase = k0 * y; // e^{i k0 y} — momentum +y, so it travels downstream
            const cosPhase = Math.cos(phase);
            const sinPhase = Math.sin(phase);

            for (let ix = ix0; ix <= ix1; ix++) {
                const dxu = this.xAt(ix);
                const envelope = Math.exp(-(dxu * dxu + dy * dy) / twoSigmaSq);
                if (envelope < 1e-12) continue;
                const i = iy * nx + ix;
                this.re[i] += envelope * cosPhase;
                this.im[i] += envelope * sinPhase;
            }
        }
    }

    injectIfDue() {
        if (this.stepIndex % this.periodSteps === 0) this.injectPacket();
    }

    step() {
        this.applyPotentialHalfStep();
        this.applyKineticStep();
        this.applyPotentialHalfStep();
        this.applyMask();
        this.stepIndex++;
        this.injectIfDue();
    }

    applyPotentialHalfStep() {
        const { re, im, potCos, potSin, size } = this;
        for (let i = 0; i < size; i++) {
            const r = re[i];
            const m = im[i];
            re[i] = r * potCos[i] - m * potSin[i];
            im[i] = r * potSin[i] + m * potCos[i];
        }
    }

    applyKineticStep() {
        this.fft2(-1);

        const { re, im, kinCos, kinSin, size } = this;
        const scale = 1 / this.size; // the inverse transform's 1/N, folded in here
        for (let i = 0; i < size; i++) {
            const r = re[i];
            const m = im[i];
            re[i] = (r * kinCos[i] - m * kinSin[i]) * scale;
            im[i] = (r * kinSin[i] + m * kinCos[i]) * scale;
        }

        this.fft2(1);
    }

    applyMask() {
        const { re, im, mask, size } = this;
        for (let i = 0; i < size; i++) {
            re[i] *= mask[i];
            im[i] *= mask[i];
        }
    }

    fft2(sign) {
        const { nx, ny, re, im, fft } = this;
        const ar = fft.ar;
        const ai = fft.ai;

        for (let iy = 0; iy < ny; iy++) {
            const o = iy * nx;
            for (let ix = 0; ix < nx; ix++) { ar[ix] = re[o + ix]; ai[ix] = im[o + ix]; }
            fft.run(sign);
            for (let ix = 0; ix < nx; ix++) { re[o + ix] = ar[ix]; im[o + ix] = ai[ix]; }
        }

        for (let ix = 0; ix < nx; ix++) {
            for (let iy = 0; iy < ny; iy++) {
                const i = iy * nx + ix;
                ar[iy] = re[i]; ai[iy] = im[i];
            }
            fft.run(sign);
            for (let iy = 0; iy < ny; iy++) {
                const i = iy * nx + ix;
                re[i] = ar[iy]; im[i] = ai[iy];
            }
        }
    }

    // Advance to an absolute step index. Only ever moves forward — the caller rewinds
    // by calling reset(), which is cheap and keeps every run bit-for-bit reproducible.
    stepTo(target) {
        while (this.stepIndex < target) this.step();
    }

    stepToFrame(frame) {
        this.stepTo(this.recordStart + frame * this.stepsPerFrame);
    }

    /* --- readout --------------------------------------------------------- */

    norm() {
        let total = 0;
        for (let i = 0; i < this.size; i++) {
            total += this.re[i] * this.re[i] + this.im[i] * this.im[i];
        }
        return total;
    }

    // Largest |psi| inside the rendered window. Callers accumulate this across every
    // recorded frame — normalising per frame would erase the packet's dimming as it
    // spreads, which is the one thing the video is actually about.
    peakMagnitude() {
        const { nx, re, im } = this;
        const w = this.window;
        let peak = 0;
        for (let iy = w.y0; iy < w.y1; iy++) {
            for (let ix = w.x0; ix < w.x1; ix++) {
                const i = iy * nx + ix;
                const mag2 = re[i] * re[i] + im[i] * im[i];
                if (mag2 > peak) peak = mag2;
            }
        }
        return Math.sqrt(peak);
    }

    get windowSize() {
        const w = this.window;
        return { width: w.x1 - w.x0, height: w.y1 - w.y0 };
    }

    // Pack the rendered window as half-float RGBA (re, im, 0, 1) for a DataTexture.
    writeField(target) {
        const { nx, re, im } = this;
        const w = this.window;
        let o = 0;
        for (let iy = w.y0; iy < w.y1; iy++) {
            for (let ix = w.x0; ix < w.x1; ix++) {
                const i = iy * nx + ix;
                target[o] = toHalf(re[i]);
                target[o + 1] = toHalf(im[i]);
                target[o + 2] = 0;
                target[o + 3] = toHalf(1);
                o += 4;
            }
        }
        return target;
    }

    allocField() {
        const { width, height } = this.windowSize;
        return new Uint16Array(width * height * 4);
    }

    // Snapshot of the raw complex window, for the periodicity check.
    snapshot() {
        const { nx, re, im } = this;
        const w = this.window;
        const { width, height } = this.windowSize;
        const out = new Float64Array(width * height * 2);
        let o = 0;
        for (let iy = w.y0; iy < w.y1; iy++) {
            for (let ix = w.x0; ix < w.x1; ix++) {
                const i = iy * nx + ix;
                out[o++] = re[i];
                out[o++] = im[i];
            }
        }
        return out;
    }

    // What the UI shows so the author can tell when a setting is lying.
    diagnostics() {
        return {
            dt: this.dt,
            stepsPerFrame: this.stepsPerFrame,
            totalSteps: this.totalSteps,
            burnInPeriods: this.burnInPeriods,
            cellsPerWavelength: this.cellsPerWavelength,
            aliasing: this.cellsPerWavelength < MIN_CELLS_PER_WAVELENGTH,
            absorbWidth: this.absorbWidth,
            absorbWavelengths: this.absorbWidth / this.wavelength,
            entryMargin: this.entryMargin,
            // How much of the packet is visible the instant it is born. Anything much
            // above 1% pops at the loop point.
            birthVisibility: Math.exp(-((0 - this.injectY) ** 2) / (2 * this.params.spread ** 2)),
            barrierHeight: this.barrierHeight,
            barrierFactor: this.barrierFactor,
            wallOpacity: this.wallOpacity,
            energy: this.energy,
            injectY: this.injectY,
            journeyTime: this.journeyTime,
            // >1 means the packet's own spreading, not its travel, sets the loop length.
            // Past ~4 the setting is diffusion-dominated: runs get very long and most of
            // the loop is a dim, slowly-fading tail.
            journeyRatio: this.journeyTime
                / (((1 + this.absorbWidth) - this.injectY) / this.velocity),
            window: this.window,
            windowSize: this.windowSize,
        };
    }
}
