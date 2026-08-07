// Runs the simulation off the main thread so the preview stays interactive.
//
// Pull model: the page asks for frame n, the worker steps to it and posts the field back
// as a transferable. Requests are sequential by construction, which is exactly the
// backpressure an export loop needs — no queue can build up ahead of the renderer.

import { WaveSim } from './sim.js';

let sim = null;
let field = null;
let nextFrame = 0;

function configure(params) {
    sim = new WaveSim(params);
    field = sim.allocField();
    nextFrame = 0;
    self.postMessage({ type: 'configured', diagnostics: sim.diagnostics() });
}

// Walk the whole recorded range measuring the largest |psi| anywhere on camera. This has
// to happen before a single frame is rendered: the brightness and height laws are both
// normalised against one number for the entire loop, because renormalising per frame
// would erase the packet's dimming as it spreads — which is the thing the video is about.
function scan() {
    sim.reset();
    sim.stepTo(sim.recordStart);

    let peak = 0;
    const total = sim.params.frames;
    for (let f = 0; f <= total; f++) {
        sim.stepToFrame(f);
        peak = Math.max(peak, sim.peakMagnitude());
        if (f % 8 === 0) {
            self.postMessage({ type: 'progress', phase: 'scan', done: f, total });
        }
    }
    nextFrame = Infinity; // force a rewind before the next seek
    self.postMessage({ type: 'scanned', peak });
}

// Monotonic seek. Stepping backwards means replaying from t = 0, which is cheap enough
// and keeps every run bit-for-bit reproducible from the parameters alone.
function seek(frame) {
    if (frame < nextFrame) {
        sim.reset();
        sim.stepTo(sim.recordStart);
        nextFrame = 0;
    }
    sim.stepToFrame(frame);
    nextFrame = frame;

    sim.writeField(field);
    const copy = field.slice();
    self.postMessage(
        { type: 'frame', frame, field: copy, peak: sim.peakMagnitude() },
        [copy.buffer]);
}

self.onmessage = (event) => {
    const msg = event.data;
    try {
        if (msg.type === 'configure') configure(msg.params);
        else if (msg.type === 'scan') scan();
        else if (msg.type === 'seek') seek(msg.frame);
    } catch (error) {
        self.postMessage({ type: 'error', message: error.message, stack: error.stack });
    }
};
