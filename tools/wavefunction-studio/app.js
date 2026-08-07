// Wavefunction studio — the authoring UI.
//
// Preview renders into a fixed 1400x900 buffer that CSS scales down, so uPixelScale is
// exactly 1 here and exactly 2 on the 2x export. That is what makes line weights authored
// on screen survive the export downscale instead of coming out half as thick.

import { SurfaceScene, defaultLook } from './scene.js';
import { defaultParams, MIN_CELLS_PER_WAVELENGTH } from './sim.js';

/* ============================================================================
   CONSTANTS & CONFIG
   ============================================================================ */

const PREVIEW_W = 1400;
const PREVIEW_H = 900;
const FPS = 30;

// [key, label, min, max, step, group, log?]. `sim` controls force a recompute on release;
// `look` controls are uniforms and apply instantly. `log` sliders carry log10 of the
// value — the knee spans five decades, which a linear slider cannot usefully address.
const CONTROLS = [
    ['waves', 'Particle speed', 8, 48, 1, 'sim'],
    ['spread', 'Initial spread', 0.02, 0.16, 0.005, 'sim'],
    ['slitWidth', 'Slit width', 0.004, 0.09, 0.002, 'sim'],
    ['slitSeparation', 'Slit separation', 0.02, 0.45, 0.005, 'sim'],
    ['wallDistance', 'Distance to wall', 0.2, 0.8, 0.01, 'sim'],
    ['wallThickness', 'Wall thickness', 0.008, 0.06, 0.002, 'sim'],
    ['packetsInFlight', 'Packets in flight', 1, 4, 0.25, 'sim'],
    ['frames', 'Frames in loop', 60, 480, 30, 'sim'],

    ['exposure', 'Exposure', 1, 300, 1, 'look'],
    ['heightScale', 'Height', 0.05, 0.8, 0.01, 'look'],
    ['knee', 'Height knee (log)', -5, -0.3, 0.05, 'look', true],
    ['gamma', 'Brightness gamma', 0.25, 1.2, 0.05, 'look'],
    ['ambient', 'Ambient', 0, 1, 0.01, 'look'],
    ['diffuse', 'Diffuse', 0, 1, 0.01, 'look'],
    ['specular', 'Specular', 0, 1.5, 0.01, 'look'],
    ['shininess', 'Shininess', 2, 200, 1, 'look'],
    ['lightAzimuth', 'Light azimuth', -180, 180, 1, 'look'],
    ['lightElevation', 'Light elevation', 2, 88, 1, 'look'],
    ['fade', 'Far fade', 0, 0.5, 0.01, 'look'],
    ['gridCount', 'Grid lines', 4, 64, 1, 'look'],
    ['gridWidth', 'Grid weight', 0.3, 4, 0.1, 'look'],
    ['frameOpacity', 'Frame opacity', 0, 1, 0.01, 'look'],
    ['wallOpacity', 'Wall opacity', 0, 1, 0.01, 'look'],
    ['frameWidth', 'Frame weight', 0.3, 4, 0.1, 'look'],
    ['frameHeight', 'Frame float', 0, 0.05, 0.001, 'look'],
    ['fov', 'Field of view', 12, 70, 1, 'look'],
];

/* ============================================================================
   MODULE STATE
   ============================================================================ */

const $ = (selector) => document.querySelector(selector);

const state = {
    params: { ...defaultParams, grid: 256 },
    look: { ...defaultLook },
    exportGrid: 512,
    exportScale: 2,      // supersample factor; ffmpeg downscales back to PREVIEW_W
    frames: [],          // cached half-float fields, one per frame
    peak: 1,
    playhead: 0,
    playing: false,
    busy: false,
    dirty: true,
};

let scene = null;
let worker = null;
let pending = null;      // resolve fn for the in-flight worker request

/* ============================================================================
   WORKER PLUMBING
   ============================================================================ */

function startWorker() {
    if (worker) worker.terminate();
    worker = new Worker('./sim.worker.js', { type: 'module' });
    worker.onmessage = (event) => {
        const msg = event.data;
        if (msg.type === 'progress') {
            setStatus(`${msg.phase}  ${Math.round(100 * msg.done / msg.total)}%`);
            return;
        }
        if (msg.type === 'error') {
            setStatus(`error: ${msg.message}`, true);
            console.error(msg.stack);
            state.busy = false;
            return;
        }
        if (pending) { const resolve = pending; pending = null; resolve(msg); }
    };
}

function ask(message, transfer = []) {
    return new Promise((resolve) => { pending = resolve; worker.postMessage(message, transfer); });
}

/* ============================================================================
   CORE LOGIC
   ============================================================================ */

async function recompute() {
    if (state.busy) return;
    state.busy = true;
    state.playing = false;
    const started = performance.now();

    const params = { ...state.params };
    const { diagnostics } = await ask({ type: 'configure', params });
    showDiagnostics(diagnostics);

    scene.ensureSize(diagnostics.windowSize.width, diagnostics.windowSize.height);
    scene.setWall(params);

    // Single pass. The cached fields are raw psi and the shader divides by uPeak at draw
    // time, so the clip peak can be accumulated as frames arrive and applied at the end —
    // no separate scan. (The export still needs a scan pass, because it renders as it
    // simulates and cannot cache 240 frames at the export grid.)
    setStatus('simulating…');
    state.frames = new Array(params.frames);
    let peak = 0;
    for (let f = 0; f < params.frames; f++) {
        const msg = await ask({ type: 'seek', frame: f });
        state.frames[f] = msg.field;
        peak = Math.max(peak, msg.peak);
        if (f % 8 === 0) setStatus(`simulating  ${Math.round(100 * f / params.frames)}%`);
    }
    state.peak = peak;
    scene.setPeak(peak);

    state.dirty = false;
    state.busy = false;
    state.playhead = Math.min(state.playhead, params.frames - 1);
    $('#scrub').max = String(params.frames - 1);
    showFrame(state.playhead);
    setStatus(`ready — ${((performance.now() - started) / 1000).toFixed(1)}s`);
}

function showFrame(index) {
    if (!state.frames.length) return;
    const clamped = Math.max(0, Math.min(state.frames.length - 1, Math.round(index)));
    state.playhead = clamped;
    scene.uploadField(state.frames[clamped]);
    $('#scrub').value = String(clamped);
    $('#frame-label').textContent = `${clamped + 1} / ${state.frames.length}`;
}

/* ============================================================================
   EXPORT
   ============================================================================ */

async function runExport() {
    if (state.busy) return;
    state.busy = true;
    state.playing = false;

    const width = PREVIEW_W * state.exportScale;
    const height = PREVIEW_H * state.exportScale;
    const params = { ...state.params, grid: state.exportGrid };

    try {
        setStatus('export: configuring…');
        const { diagnostics } = await ask({ type: 'configure', params });
        showDiagnostics(diagnostics);
        scene.ensureSize(diagnostics.windowSize.width, diagnostics.windowSize.height);
        scene.setWall(params);
        scene.applyLook();

        // The peak must be known before frame 0 is drawn, and caching 240 frames at the
        // export grid would be ~360 MB — so the scan is a separate pass. The sim is
        // deterministic, so the second pass reproduces the first exactly.
        setStatus('export: scanning for the clip peak…');
        const { peak } = await ask({ type: 'scan' });
        scene.setPeak(peak);

        await post('/export/start', { width, height, fps: FPS });
        await post('/params', { params, look: scene.captureCamera(), export: { width, height, fps: FPS } });

        for (let f = 0; f < params.frames; f++) {
            const msg = await ask({ type: 'seek', frame: f });
            scene.uploadField(msg.field);
            const pixels = scene.renderToPixels(width, height);
            // Strictly sequential. Parallelising would reorder frames in ffmpeg's stdin.
            await fetch('/export/frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: pixels,
            });
            setStatus(`export: ${f + 1} / ${params.frames}`);
        }

        const result = await post('/export/end', {});
        setStatus(`master written: ${result.frames} frames, `
            + `${(result.bytes / 1e6).toFixed(0)} MB → out/master.mkv. Run encode.sh next.`);
    } catch (error) {
        setStatus(`export failed: ${error.message}`, true);
        console.error(error);
    } finally {
        state.busy = false;
        state.dirty = true;
    }
}

async function post(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

/* ============================================================================
   UI
   ============================================================================ */

function setStatus(text, isError = false) {
    const el = $('#status');
    el.textContent = text;
    el.classList.toggle('is-error', isError);
}

function showDiagnostics(d) {
    const rows = [
        ['cells / wavelength', d.cellsPerWavelength.toFixed(1), d.aliasing],
        ['wall opacity (κw)', d.wallOpacity.toFixed(1), d.wallOpacity < 4],
        ['steps / frame', String(d.stepsPerFrame), false],
        ['total steps', String(d.totalSteps), d.totalSteps > 4000],
        ['burn-in periods', String(d.burnInPeriods), false],
        ['journey / crossing', d.journeyRatio.toFixed(2), d.journeyRatio > 4],
        ['window', `${d.windowSize.width}²`, false],
    ];
    $('#diagnostics').innerHTML = rows.map(([k, v, warn]) =>
        `<div class="diag${warn ? ' is-warn' : ''}"><span>${k}</span><b>${v}</b></div>`).join('');
}

function buildControls() {
    const groups = { sim: $('#sim-controls'), look: $('#look-controls') };

    for (const [key, label, min, max, step, group, log] of CONTROLS) {
        const source = group === 'sim' ? state.params : state.look;
        const row = document.createElement('div');
        row.className = 'control';
        row.innerHTML = `<label for="c-${key}">${label} <span class="value"></span></label>`
            + `<input type="range" id="c-${key}" min="${min}" max="${max}" step="${step}">`;
        groups[group].appendChild(row);

        const input = row.querySelector('input');
        const readout = row.querySelector('.value');
        input.value = String(log ? Math.log10(source[key]) : source[key]);
        readout.textContent = formatValue(source[key], log ? 'log' : step);

        input.addEventListener('input', () => {
            const raw = parseFloat(input.value);
            const value = log ? Math.pow(10, raw) : raw;
            source[key] = value;
            readout.textContent = formatValue(value, log ? 'log' : step);
            if (group === 'look') {
                scene.applyLook();
            } else {
                state.dirty = true;
                markDirty();
            }
        }, { passive: true });

        // Sim controls do not recompute mid-drag — one recompute per gesture, on release.
        if (group === 'sim') {
            input.addEventListener('change', () => { if (state.dirty) recompute(); });
        }
    }
}

function formatValue(value, step) {
    if (step === 'log') return value.toExponential(1);
    const decimals = step >= 1 ? 0 : String(step).split('.')[1].length;
    return value.toFixed(decimals);
}

function markDirty() {
    $('#recompute').classList.toggle('is-dirty', state.dirty);
}

function bindUi() {
    $('#scrub').addEventListener('input', (e) => {
        state.playing = false;
        showFrame(parseInt(e.target.value, 10));
    }, { passive: true });

    $('#play').addEventListener('click', () => {
        state.playing = !state.playing;
        $('#play').textContent = state.playing ? 'Pause' : 'Play';
    });

    $('#recompute').addEventListener('click', () => recompute());
    $('#export').addEventListener('click', () => runExport());

    $('#height-mode').addEventListener('change', (e) => {
        state.look.heightMode = parseInt(e.target.value, 10);
        scene.applyLook();
    });
    $('#grid-toggle').addEventListener('change', (e) => {
        state.look.grid = e.target.checked ? 1 : 0;
        scene.applyLook();
    });
    $('#preview-grid').addEventListener('change', (e) => {
        state.params.grid = parseInt(e.target.value, 10);
        state.dirty = true;
        markDirty();
        recompute();
    });
    $('#export-grid').addEventListener('change', (e) => {
        state.exportGrid = parseInt(e.target.value, 10);
    });
    $('#export-scale').addEventListener('change', (e) => {
        state.exportScale = parseInt(e.target.value, 10);
    });

    $('#save').addEventListener('click', async () => {
        await post('/params', { params: state.params, look: scene.captureCamera() });
        setStatus('saved to params.json');
    });

    $('#load').addEventListener('click', async () => {
        const response = await fetch('./params.json');
        if (!response.ok) return setStatus('no params.json yet', true);
        const saved = await response.json();
        Object.assign(state.params, saved.params || {});
        Object.assign(state.look, saved.look || {});
        scene.look = state.look;
        scene.applyLook();
        refreshControls();
        recompute();
    });
}

function refreshControls() {
    for (const [key, , , , step, group, log] of CONTROLS) {
        const source = group === 'sim' ? state.params : state.look;
        const input = $(`#c-${key}`);
        if (!input) continue;
        input.value = String(log ? Math.log10(source[key]) : source[key]);
        input.parentElement.querySelector('.value').textContent =
            formatValue(source[key], log ? 'log' : step);
    }
    $('#height-mode').value = String(state.look.heightMode);
}

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

function frame() {
    requestAnimationFrame(frame);
    scene.controls.update();

    if (state.playing && state.frames.length && !state.busy) {
        const now = performance.now();
        if (now - (frame.last || 0) >= 1000 / FPS) {
            frame.last = now;
            showFrame((state.playhead + 1) % state.frames.length);
        }
    }
    scene.render(PREVIEW_W, PREVIEW_H);
}

function init() {
    const canvas = $('#view');
    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;

    scene = new SurfaceScene(canvas);
    scene.look = state.look;

    startWorker();
    buildControls();
    bindUi();
    requestAnimationFrame(frame);

    // ?export=frames,grid,scale drives an export without a human, for running the whole
    // pipeline under headless Brave. Worth having: the Browser pane keeps its tab hidden,
    // which throttles the worker round-trip to seconds per frame and makes a real export
    // there impossible. Completion is signalled through document.title so --dump-dom can
    // read it back.
    const auto = new URLSearchParams(location.search).get('export');
    if (auto) {
        const [frames, grid, scale] = auto.split(',').map(Number);
        if (frames) state.params.frames = frames;
        if (grid) { state.params.grid = grid; state.exportGrid = grid; }
        if (scale) state.exportScale = scale;
        document.title = 'EXPORT RUNNING';
        runExport()
            .then(() => { document.title = 'EXPORT DONE'; })
            .catch((e) => { document.title = `EXPORT FAILED ${e.message}`; });
    } else {
        recompute();
    }

    // Handle for driving the tool from a console or an automated check. The Browser pane
    // keeps its tab hidden, which suspends requestAnimationFrame entirely — so the render
    // loop above never runs there and rendering has to be invoked directly.
    window.studio = { scene, state, showFrame, recompute, runExport };
}

document.addEventListener('DOMContentLoaded', init, { once: true });
