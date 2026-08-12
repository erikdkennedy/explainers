(() => {
    /*****************************************
                CONSTANTS & CONFIG
    *****************************************/

    const SVG_NS = 'http://www.w3.org/2000/svg';

    const MARK_RADIUS = 1.5; // px — a 3px isometric imprint
    const MARK_MARGIN = 5; // face units — keep imprints clear of the face edges
    const MARK_SPREAD = 0.146; // 1 standard deviation, as a fraction of each face dimension

    const SENSOR_NAMES = { l: 'Sensor L', r: 'Sensor R' };

    const GRABBER_RADIUS = 12.5; // px — magnitude 1 sits the knob flush inside the dial
    const MIN_MAGNITUDE = 0.15; // below this the arrow is all head and nothing to aim with
    const ANGLE_STEP = 5; // degrees per arrow key
    const ANGLE_STEP_FINE = 1; // degrees per arrow key with Shift held
    const MAGNITUDE_STEP = 0.05;

    // Slider values are in the units of the 600-wide reference frame the widget is drawn
    // in, so the pattern looks the same however wide the canvas ends up.
    const DS_REFERENCE_WIDTH = 600;
    // The maths treats each slit as a single point; this is only how wide to draw the gap
    // so that it reads as a slit. Turn the separation right down and the two gaps merge.
    const DS_DRAWN_SLIT = 10;
    // 1/√r makes the raw field enormously brighter at the slits than out in the fringes,
    // so a linear brightness map renders everything but the slits black.
    const DS_GAMMA = 0.6;
    const DS_CURVE_HEADROOM = 4; // viewBox units left above a full-height peak, for the stroke

    // The double-slit *paths* widget, one section earlier: the same physics, but sampled at
    // a single spot the reader picks rather than everywhere at once. Every length below is
    // in the units of its 200 x 217 setup drawing — see qm/double-slit-paths.html.
    const DSP_WIDTH = 200; // the detection wall spans the drawing exactly
    const DSP_SOURCE_X = 100;
    const DSP_SOURCE_Y = 171; // the top face of the source box
    const DSP_SLIT_Y = 142; // centre line of the barrier
    const DSP_WALL_Y = 4; // inner face of the detection wall
    const DSP_DRAWN_SLIT = 4; // drawn gap width; the maths still treats a slit as a point
    const DSP_CURVE_HEADROOM = 6; // viewBox units left above a full-height peak
    // Straight up the axis, slit to wall. Amplitudes are scaled against this one distance
    // so that the two arrows in phase at the centre of the wall exactly fill a dial — see
    // doubleSlitPathAmplitude(). It is a property of the geometry, not of the sliders, so
    // nothing here is ever renormalised per frame.
    const DSP_REFERENCE_LEG = DSP_SLIT_Y - DSP_WALL_Y;
    const DSP_LEGS = ['near', 'far'];

    // Every length below is in units of the stage's own width, and every time in units of
    // one sweep, so the widget is resolution-independent. A free particle's position
    // spread grows as sqrt(TE_SIGMA_START^2 + (TE_SIGMA_MOMENTUM * t)^2) — barely at first,
    // then linearly — which is the whole point of the picture.
    const TE_DOT_COUNT = 70;
    // Zero: the position is exactly known at t = 0, so all 70 dots sit on one point and the
    // whole cloud is the spread that grows out of it.
    const TE_SIGMA_START = 0;
    const TE_START_X = 0; // that point is the left edge of the stage
    const TE_DRIFT = 1.08; // stage widths travelled — the centre ends just past the right edge
    const TE_SIGMA_MOMENTUM = 0.12; // spread added per sweep
    const TE_SWEEP_DURATION = 9000; // ms for t to run 0 -> 1
    const TE_MAX_FRAME = 0.05; // seconds — clamp dt so a backgrounded tab does not jump
    const TE_REDUCED_MOTION_T = 0.35; // a paused widget should still show a cloud, not a speck

    // An excited atom emitting a photon. Lengths are in stage widths and times in units of
    // the whole timeline, as above. Two distributions carry the physics, and between them
    // they are what makes the article's claim — "the bulk of these phantom photons leave
    // early, and horizontally" — something the reader watches rather than reads:
    //
    //   when  the emission time is exponential, so most copies leave in the first moments
    //   where the 2p orbital's dipole is vertical, so intensity goes as sin^2 off that
    //         axis: brightest along the horizontal, dark along the lobes themselves
    // Sized for the *first* step rather than the last: at t = 0.05 the copies have barely
    // cleared the nucleus, and the ones still behind it are hidden, so a count that looks
    // generous at full spread leaves a bare handful in the halo the reader meets first.
    const EM_PHOTON_COUNT = 150;
    // Per unit t. exp(-3) leaves ~5% of the atom still excited at the end of the timeline,
    // which is the most decay that can be shown without the last stretch looking static.
    const EM_DECAY_RATE = 3;
    const EM_PHOTON_SPEED = 0.55; // stage widths per unit t — the earliest copies clear the frame
    const EM_SURVIVOR_POOL = 6; // how many of the outermost in-frame copies the survivor is drawn from
    const EM_SURVIVOR_CLEARANCE = 0.02; // stage widths of air between the survivor and the last caption
    // Figma's five dial positions, except the fourth: the atom's own phantom copies are worth
    // meeting while copies are still visibly leaving, not once the spray has all but finished,
    // so that keyframe sits at 0.40 rather than Figma's 0.90.
    const EM_STEPS = [0, 0.05, 0.10, 0.40, 1];
    const EM_TWEEN_MIN = 450; // ms for the shortest hop, 0 -> 0.05
    const EM_TWEEN_MAX = 1400; // ms for the long haul, 0.40 -> 1
    const EM_MAX_FRAME = 0.05; // seconds — clamp dt so a backgrounded tab does not jump
    const EM_EPSILON = 1e-6; // "strictly past the current t", in the face of float error

    // The Ramsey experiment: two microwave pulses with a wait between them. Every length here
    // is in the units of the stage's own 469 x 220 drawing, which is the Figma frame's stage
    // column with the 58px header cropped off the top — so coordinates paste straight across
    // from the design file. See qm/ramsey-stage.svg.
    //
    // The widget runs on TWO clocks, and the split is what makes it work:
    //
    //   s    the story position, a continuous float in [0, 4]. Positions, radii, opacities,
    //        connectors, the pulse and the Bloch trail are all pure functions of it, which is
    //        the whole of "clicking an earlier breadcrumb runs the animation backwards".
    //   tau  physical time in ms, which only ever drives how far the arrows have turned. It
    //        free-runs while the widget is on screen, because the arrows are meant to keep
    //        spinning while the reader reads — and it is parked at rest on steps 1 and 2,
    //        because those are the two steps that make a claim about where the state *is* on
    //        the Bloch sphere's equator, and a turning relative angle would be the state
    //        sliding around that equator rather than sitting at the point being described.
    //
    // One clock cannot do both: a pure function of s cannot idle, and a pure function of tau
    // cannot be rewound. What keeps them from disagreeing is that every claim the widget makes
    // is a claim about a *relative* angle between two arrows of the same energy — and those are
    // fixed by the phase column of RM_CAST, not by tau.
    const RM_STEPS = 5; // START, blast #1, WAIT, blast #2, RESULT
    const RM_UNIT_RADIUS = 31; // px at amplitude 1; every disc is this times |amplitude|
    const RM_HALF_RADIUS = RM_UNIT_RADIUS / Math.SQRT2; // 21.92 — Figma rounds it to 22
    const RM_SMALL_RADIUS = RM_UNIT_RADIUS / 2; // 15.5 — Figma rounds it to 15
    const RM_HALO = { ground: 4, excited: 16 }; // added to the radius; see the note in the SCSS
    const RM_ARROW_LONG = 41; // Figma's arrow on the full and half-sized atoms
    const RM_ARROW_SHORT = 33; // and on the quarter-sized ones
    const RM_ARROW_FADE = 12; // an arrow shorter than this fades, so a newborn copy has none

    // One turn of the ground-state arrow. The excited one turns faster in proportion to its
    // energy, which is the claim the WAIT step's caption makes.
    const RM_PERIOD_GROUND = 1800; // ms
    const RM_ENERGY_RATIO = 1.5; // excited turns per ground turn
    // Picking 3/2 for the ratio is what makes the two poses this widget has to land in exactly
    // fall on the *same* grid: after any whole number of ground turns both arrows are back to
    // upright, and their relative angle is a half turn different each time. So the even turns
    // are "parallel" — the equal superposition the first blast leaves the atom in, drawn at the
    // left of the equator — and the odd turns are "opposed", where the wait ends. Any other
    // ratio would have parked the pair at some arbitrary rotation instead of on Figma's frames.
    const RM_POSE_PARALLEL = 0; // an even number of ground turns
    const RM_POSE_OPPOSED = 1; // an odd one
    const RM_POSE_STEP = [null, RM_POSE_PARALLEL, RM_POSE_OPPOSED, null, null]; // per keyframe
    const RM_POSE_MIN = 250; // ms — never aim at a pose so close it reads as a jump rather than a turn
    // Under reduced motion tau never runs, so it is placed by keyframe instead. These are the
    // values at which each step's Figma frame is reproduced exactly: nought turns for the two
    // steps whose arrows are parallel, one for the three whose excited arrows are inverted.
    const RM_REDUCED_TAU = [0, 0, RM_PERIOD_GROUND, RM_PERIOD_GROUND, RM_PERIOD_GROUND];

    const RM_TWEEN = 1400; // ms for a single hop — long enough to watch a pulse cross the frame
    const RM_TWEEN_MAX = 2600; // ms — a four-step rewind should not plod
    const RM_TWEEN_SPAN = 0.7; // duration grows as span^this, so long hops are not four times as long
    const RM_MAX_FRAME = 50; // ms — clamp dt so a backgrounded tab does not jump

    const RM_PHOTON_COUNT = 166; // the count in the Figma frame, which is also about right
    const RM_PACKET_LENGTH = 188; // measured: the pulse spans x 280..468 at the keyframe
    const RM_PACKET_SIGMA = 10; // measured spread about the atom row
    const RM_PACKET_HALF_BAND = 19.5; // measured: y runs 149..188
    const RM_PACKET_ROW = 168.5; // measured centre, which is the atom row
    const RM_PACKET_CLEAR = 8; // and this much past each edge, so no dot is caught half-clipped
    const RM_PACKET_START = -(RM_PACKET_LENGTH + RM_PACKET_CLEAR);
    const RM_PACKET_TRAVEL = 469 + RM_PACKET_LENGTH + RM_PACKET_CLEAR * 2; // off one edge to off the other
    // Sampled over s, and over s - 2 for the second blast. The whole crossing happens inside the
    // blast's own hop: the pulse is off to the left at the step it starts from and clear of the
    // right-hand edge by the step it lands on, so a keyframe never shows it hanging in mid-air.
    // (The Figma frames do draw it mid-exit, but that was to check the visuals, not a resting
    // state.) Both ends being off-stage is also why the pulse needs no opacity of its own — the
    // SVG's viewport clips it away, and the seam at s = 2, where it jumps from off the right
    // back to off the left, happens where there is nothing to see.
    const RM_PACKET_TRACK = [0, 1, 1];
    // The copies have to look *caused* by the pulse, so the split is held back until the pulse's
    // leading edge has reached the atoms and finishes while its tail is still on its way out.
    // Measured against the crossing: the leading edge is level with the atoms at 0.37 of the hop
    // and the trailing edge has cleared them by 0.65.
    const RM_SPLIT_DELAY = 0.34; // where the copies start to separate, as a fraction of the hop
    const RM_SPLIT_SPAN = 0.46; // and how much of the hop they take to finish

    const RM_LINK_TAIL_GAP = 2; // a connector starts this far outside its parent's rim
    const RM_LINK_HEAD_GAP = 16; // and stops this far short of its child's
    const RM_LINK_HEAD = 10; // the arrowhead's own length, in qm/ramsey-stage.svg

    // Pending render per widget, so a drag never queues up more than one.
    const _doubleSlitFrames = new WeakMap();
    const _doubleSlitPathFrames = new WeakMap();

    // Per-widget simulation state: the frozen dot seeds, the clock, and the rAF handle.
    const _electronClouds = new WeakMap();
    const _emissionFields = new WeakMap();
    const _ramseyStates = new WeakMap();


    /*****************************************
                UTILITY FUNCTIONS
    *****************************************/

    function clampNumber(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // Box-Muller. Photons cluster at the middle of the detector rather than
    // spreading evenly across it.
    function randomNormal() {
        const u = 1 - Math.random(); // (0, 1], so log() is finite
        const v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // Restart a CSS animation that may already be mid-flight.
    function retriggerAnimation($element, className) {
        $element.classList.remove(className);
        void $element.getBoundingClientRect(); // force reflow
        $element.classList.add(className);
    }

    function normalizeAngle(degrees) {
        return ((degrees % 360) + 360) % 360;
    }

    function easeInOutCubic(u) {
        return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    }

    // Inverse-CDF sample of an exponential. This is the whole of "most phantom copies
    // leave early": the density is largest at zero and decays from there.
    function randomExponential(rate) {
        return -Math.log(1 - Math.random()) / rate; // 1 - random() is (0, 1], so log is finite
    }

    // Dipole radiation: intensity goes as sin^2 of the angle off the dipole axis. The 2p
    // orbital's axis is vertical and theta is measured from the horizontal, so that angle
    // is (90deg - theta) and the envelope becomes cos^2 — brightest straight out to the
    // sides, dark along the lobes. Rejection sampling, two iterations on average, drawn
    // once per photon at init and never again.
    function randomDipoleAngle() {
        for (let i = 0; i < 64; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const cos = Math.cos(theta);
            if (Math.random() < cos * cos) return theta;
        }
        return Math.random() * 2 * Math.PI; // unreachable in practice; never loop forever
    }


    /*****************************************
                    CORE LOGIC
    *****************************************/

    // The detector face is a plain rect sheared into the isometric plane. Reading its
    // own matrix and size back out of the SVG keeps the projection defined in exactly
    // one place — see src/_includes/qm/hong-ou-mandel.svg.
    function readSensorFace($sensor) {
        const $face = $sensor.querySelector('.hom-face');
        if (!$face) return null;

        const transform = $face.transform.baseVal.consolidate();
        if (!transform) return null;

        return {
            matrix: transform.matrix,
            width: $face.width.baseVal.value,
            height: $face.height.baseVal.value,
        };
    }

    function placePhotonMark($sensor) {
        const $marks = $sensor.querySelector('.hom-marks');
        const face = readSensorFace($sensor);
        if (!$marks || !face) return;

        const u = clampNumber(
            face.width / 2 + randomNormal() * face.width * MARK_SPREAD,
            MARK_MARGIN,
            face.width - MARK_MARGIN
        );
        const v = clampNumber(
            face.height / 2 + randomNormal() * face.height * MARK_SPREAD,
            MARK_MARGIN,
            face.height - MARK_MARGIN
        );

        const m = face.matrix;
        const x = m.a * u + m.c * v + m.e;
        const y = m.b * u + m.d * v + m.f;

        // Reusing the face's own linear part shears the circle into the same isometric
        // plane, so the imprint sits flat on the detector.
        const $mark = document.createElementNS(SVG_NS, 'circle');
        $mark.setAttribute('class', 'hom-mark');
        $mark.setAttribute('r', String(MARK_RADIUS));
        $mark.setAttribute('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${x} ${y})`);
        $mark.addEventListener('animationend', () => $mark.remove(), { once: true });

        $marks.appendChild($mark);
    }

    function lightSensor($sensor) {
        const $lit = $sensor.querySelector('.hom-bulb-lit');
        if (!$lit) return;

        retriggerAnimation($sensor, 'is-lit');

        // The class comes off when the flash finishes, so how long the lamp stays lit
        // is a CSS concern and isn't duplicated here.
        $lit.addEventListener('animationend', () => {
            $sensor.classList.remove('is-lit');
        }, { once: true });
    }

    function firePhoton($widget, $source) {
        // The marching ants are an invitation; once a source has been used, it
        // has made its point.
        $source.classList.add('is-used');

        const sensorKey = Math.random() < 0.5 ? 'l' : 'r';
        const $sensor = $widget.querySelector(`.hom-sensor[data-sensor="${sensorKey}"]`);
        if (!$sensor) return;

        placePhotonMark($sensor);
        lightSensor($sensor);

        const $status = $widget.querySelector('.hom-status');
        if ($status) $status.textContent = `Photon detected at ${SENSOR_NAMES[sensorKey]}.`;
    }


    // Magnitude 1 puts the tip one grabber-radius short of the rim, so the knob never pokes
    // out of its own dial. The disc radius is read back off the SVG — see
    // src/_includes/qm/amplitude-multiplication.svg — so it is written down in one place only.
    function readDialScale($dial) {
        const $face = $dial.querySelector('.qam-dial-face');
        if (!$face) return 0;

        return $face.r.baseVal.value - GRABBER_RADIUS;
    }

    // Client coordinates into the dial's own space, whose origin is the dial centre.
    // getScreenCTM() already folds in however far the SVG has been scaled down, so nothing
    // here needs to know the rendered size.
    function pointToDial($dial, clientX, clientY) {
        const ctm = $dial.getScreenCTM();
        if (!ctm) return null;

        return new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    }

    // The rendered arrow is the state. Nothing is mirrored in a JS variable, so the two
    // can never drift apart.
    function readArrow($dial) {
        const $shaft = $dial.querySelector('.qam-arrow-shaft');
        const scale = readDialScale($dial);
        if (!$shaft || !scale) return { angle: 0, magnitude: 0 };

        const rendered = parseFloat($dial.style.getPropertyValue('--qam-angle'));

        return {
            angle: Number.isNaN(rendered) ? 0 : -rendered,
            magnitude: $shaft.width.baseVal.value / scale,
        };
    }

    function readSeed($dial) {
        return {
            angle: parseFloat($dial.dataset.angle) || 0,
            magnitude: parseFloat($dial.dataset.magnitude) || 0,
        };
    }


    function readDoubleSlitParams($widget) {
        const value = param => {
            const $slider = $widget.querySelector(`.ds-slider[data-param="${param}"]`);
            return $slider ? Number($slider.value) : 0;
        };

        return {
            wavelength: value('wavelength'),
            separation: value('separation'),
        };
    }

    // Each slit is a single point, so the amplitude anywhere is just two arrows added: the
    // one that came via the left slit and the one that came via the right. That is the whole
    // idea the section is teaching, and it is literally the inner loop.
    //
    // A slit of real width would be many points, and they would interfere with each other —
    // true, and the origin of the envelope in a photograph of the real experiment, but a
    // second phenomenon on top of the one being explained here. Deliberately left out.
    //
    // An arrow shrinks as 1/√r, the falloff of a cylindrical wave in 2D, and turns through a
    // full circle every wavelength travelled.
    function computeDoubleSlitField($canvas, params) {
        const width = $canvas.width;
        const height = $canvas.height;
        const scale = width / DS_REFERENCE_WIDTH; // reference units -> buffer pixels

        const waveNumber = 2 * Math.PI / (params.wavelength * scale);
        const halfSeparation = params.separation * scale / 2;

        const real = new Float32Array(width * height);
        const imaginary = new Float32Array(width * height);
        let peak = 0;

        for (let row = 0; row < height; row++) {
            // Row 0 is the far edge and the slit plane sits just past the last row, so the
            // distance to a slit is never 0 and 1/√r never blows up.
            const y = height - row;
            const ySquared = y * y;

            for (let column = 0; column < width; column++) {
                const x = column + 0.5 - width / 2;

                const dLeft = x + halfSeparation;
                const dRight = x - halfSeparation;
                const rLeft = Math.sqrt(dLeft * dLeft + ySquared);
                const rRight = Math.sqrt(dRight * dRight + ySquared);

                const fallLeft = 1 / Math.sqrt(rLeft);
                const fallRight = 1 / Math.sqrt(rRight);
                const phaseLeft = waveNumber * rLeft;
                const phaseRight = waveNumber * rRight;

                const sumReal = fallLeft * Math.cos(phaseLeft) + fallRight * Math.cos(phaseRight);
                const sumImaginary = fallLeft * Math.sin(phaseLeft) + fallRight * Math.sin(phaseRight);

                const index = row * width + column;
                real[index] = sumReal;
                imaginary[index] = sumImaginary;

                const squared = sumReal * sumReal + sumImaginary * sumImaginary;
                if (squared > peak) peak = squared;
            }
        }

        return { real, imaginary, peak: Math.sqrt(peak) };
    }


    // Four fixed normals per dot: where it starts, and how fast it is going. Drawing them
    // once — rather than jittering the cloud every frame — is what makes the render below a
    // pure function of t, so the scrubber can run time backwards and land on exactly the
    // arrangement it left.
    function seedElectronCloud($widget) {
        const $stage = $widget.querySelector('.te-stage');
        if (!$stage) return null;

        const $dots = [];
        const seeds = [];
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < TE_DOT_COUNT; i++) {
            const $dot = document.createElement('div');
            $dot.className = 'te-dot';

            seeds.push({
                qx: randomNormal(),
                qy: randomNormal(),
                px: randomNormal(),
                py: randomNormal(),
            });

            $dots.push($dot);
            fragment.appendChild($dot);
        }

        $stage.appendChild(fragment);

        return { $stage, $dots, seeds, t: 0, playing: false, frame: 0, last: 0, visible: true };
    }

    // The textbook free-particle result: the packet's centre drifts at a constant rate while
    // its width grows as sqrt(sigma0^2 + (sigma_p * t)^2).
    function electronDotPosition(seed, t) {
        return {
            x: TE_START_X + TE_DRIFT * t + TE_SIGMA_START * seed.qx + TE_SIGMA_MOMENTUM * seed.px * t,
            dy: TE_SIGMA_START * seed.qy + TE_SIGMA_MOMENTUM * seed.py * t,
        };
    }


    // The one curve the whole widget rides. Photon count, the red nucleus, and the excited
    // orbital all read this, so they cannot drift apart and quietly make the physics wrong:
    // when four fifths of the phantom copies have left, the atom is four fifths grounded
    // because it is the same number, not because two curves were tuned to agree.
    function emissionEmittedFraction(t) {
        return 1 - Math.exp(-EM_DECAY_RATE * t);
    }

    // Two frozen draws per photon — when it leaves, and which way. Drawing them once is what
    // makes the render below a pure function of t, so scrubbing backwards lands on exactly
    // the arrangement it left rather than reshuffling the spray.
    function seedEmissionField($widget) {
        const $stage = $widget.querySelector('.em-stage');
        if (!$stage) return null;

        const $photons = [];
        const seeds = [];
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < EM_PHOTON_COUNT; i++) {
            const $photon = document.createElement('div');
            $photon.className = 'em-photon';
            $photon.style.display = 'none'; // nothing has been emitted at t = 0

            const theta = randomDipoleAngle();

            seeds.push({
                tau: randomExponential(EM_DECAY_RATE), // the moment this copy leaves
                cos: Math.cos(theta),
                sin: Math.sin(theta),
                shown: false, // last rendered visibility, so display is only written on a change
            });

            $photons.push($photon);
            fragment.appendChild($photon);
        }

        $stage.appendChild(fragment);

        // atomY and heightInWidths are placeholders until measureEmissionStage() runs — the
        // atom is placed by CSS and the maths has to orbit the same point, so both are read
        // off the layout rather than restated here. See --em-atom-y in quantum.scss.
        return {
            $stage,
            $photons,
            seeds,
            t: 0,
            atomY: 0.5125,
            heightInWidths: 400 / 700,
            tween: null,
            frame: 0,
            last: 0,
            visible: true,
            survivor: 0,
        };
    }

    // A label's box in the same frame the copies live in: stage widths, measured from the atom.
    // Returns null when the label is not over the drawing at all (the stacked layout below
    // w600), which is the honest answer — there is nothing there to collide with.
    function emissionLabelBox($widget, state, step) {
        const $label = $widget.querySelector(`.em-label[data-step="${step}"]`);
        if (!$label) return null;

        const stage = state.$stage.getBoundingClientRect();
        const label = $label.getBoundingClientRect();
        if (!stage.width || !stage.height) return null;
        if (label.top >= stage.bottom || label.bottom <= stage.top) return null;

        const atomX = stage.left + stage.width * 0.5;
        const atomY = stage.top + stage.height * state.atomY;
        const pad = EM_SURVIVOR_CLEARANCE * stage.width;

        return {
            x0: (label.left - pad - atomX) / stage.width,
            x1: (label.right + pad - atomX) / stage.width,
            y0: (label.top - pad - atomY) / stage.width,
            y1: (label.bottom + pad - atomY) / stage.width,
        };
    }

    // A copy's radius grows from the moment it left, so at time t it sits at
    // speed * (t - tau) along its own direction — and does not exist at all before that.
    function emissionPhotonPosition(seed, t) {
        const age = t - seed.tau;

        if (age < 0) return { x: 0, dy: 0, emitted: false };

        const radius = EM_PHOTON_SPEED * age;

        return { x: radius * seed.cos, dy: radius * seed.sin, emitted: true };
    }

    // Collapse leaves exactly one phantom copy behind, and it has to be one the reader can
    // actually see — a survivor that flew off the frame ten steps ago reads as a bug. Chosen
    // once, after the stage has been measured, so the choice is as frozen as the seeds are.
    //
    // Of the copies still in frame, the survivor is one of the *furthest out*. A photon that has
    // nearly crossed the frame has visibly travelled, which is the claim the last caption makes;
    // one still hanging beside the atom looks like it never left. Since a copy's distance is
    // set by how early it was emitted, this also means the survivor is one of the first copies
    // to have gone — which is the honest reading of a decay that has already happened.
    function pickEmissionSurvivor($widget, state) {
        const candidates = [];

        // Stage widths, measured from the atom: the frame runs half a width either side, and
        // the atom sits atomY of the way down a stage heightInWidths tall. The 0.9 keeps the
        // survivor clear of the edge rather than half-clipped by it.
        const left = 0.5 * 0.9;
        const up = state.atomY * state.heightInWidths * 0.9;
        const down = (1 - state.atomY) * state.heightInWidths * 0.9;

        // Pushing the survivor out to the frame's edge walks it straight into the last caption,
        // which is also out at an edge — measured at roughly one page load in fourteen before
        // this. Read the caption's own box off the layout rather than restating its position
        // here, so moving it in the stylesheet cannot silently re-open the collision. Empty
        // below w600, where the labels leave the drawing altogether: nothing to avoid then.
        const keepOut = emissionLabelBox($widget, state, 4);

        state.seeds.forEach((seed, i) => {
            const { x, dy, emitted } = emissionPhotonPosition(seed, 1);

            if (!emitted || Math.abs(x) >= left || dy <= -up || dy >= down) return;
            if (keepOut && x > keepOut.x0 && x < keepOut.x1 && dy > keepOut.y0 && dy < keepOut.y1) return;

            // How near the frame's edge this copy is, as a fraction of the distance available in
            // its own direction: 0 at the atom, 1 against the clearance line. Per-axis rather
            // than a plain radius, because the frame is much wider than it is tall — a radius
            // would rank every sideways copy above every vertical one whatever its position.
            const reach = Math.max(
                Math.abs(x) / left,
                dy < 0 ? -dy / up : dy / down,
            );

            candidates.push({ i, reach });
        });

        if (!candidates.length) return 0;

        // "One of the furthest", not "the furthest": picking the maximum would make the choice
        // deterministic given the seeds, and the pool is reseeded every page load precisely so
        // the picture is not the same twice. A shortlist keeps both.
        candidates.sort((a, b) => b.reach - a.reach);

        const shortlist = candidates.slice(0, Math.min(EM_SURVIVOR_POOL, candidates.length));

        return shortlist[Math.floor(Math.random() * shortlist.length)].i;
    }

    // The Ramsey experiment, as a table. Eight copies, five keyframes, and every row says where
    // the copy sits, how big its amplitude is, the structural phase of its arrow, and whether it
    // is live (1), retired to a ghost (0.1) or gone (0). Coordinates are the Figma frame's,
    // unchanged, because the stage's viewBox is that frame's stage column.
    //
    // `mag` is the one curve everything else reads: the disc's radius is RM_UNIT_RADIUS times
    // it, and so is the arrow's length. The physics behind the numbers is one pulse matrix
    // applied twice — G goes to (G + E)/sqrt(2) and E to (-G + E)/sqrt(2) — which turns the
    // opposed pair of step 2 into four quarter-amplitude copies whose two excited members are
    // exactly opposed and whose two ground members are exactly in step. That is why the excited
    // pair cancels and the ground pair adds, and it is the point of the whole widget.
    //
    // `phase` is deliberately NOT folded into a signed amplitude. Lerping a signed number
    // through zero would collapse a disc to nothing halfway through a split and then flip its
    // arrow in a single frame; kept apart, the size and the direction each move sensibly.
    //
    // A `null` row means the copy does not exist yet. It is filled in at init from its parent's
    // row at that step with mag 0, so a second-generation copy visibly *buds* out of the copy it
    // came from instead of fading in on top of it. That matters here more than usual: CLAUDE.md's
    // "two cross-fading discs are not a cross-fade" would bite twice over, since e1 is red and
    // the parent it grows out of is blue. Rows past the last given one carry it forward at
    // opacity 0, so a copy that has served its purpose fades where it stands rather than
    // shrinking away to a point.
    //
    // Exactly one phase in the table ever moves: g2b turns 180 -> 360 during the second pulse.
    // That half turn *is* the minus sign in the pulse's ground-from-excited term, and it is why
    // the two ground copies end up adding rather than cancelling — the caption calls it out. It
    // is written as 360 rather than 0 so that the lerp turns through the half circle instead of
    // snapping, and `birthPhase` is what it turns *from*: the direction its parent was pointing.
    const RM_CAST = [
        {
            key: 'orig', state: 'ground', parent: null,
            rows: [
                { x: 234, y: 168, mag: 1, phase: 0, op: 1 },
                { x: 146, y: 168, mag: 1, phase: 0, op: 0.1 },
            ],
        },
        {
            key: 'e1', state: 'excited', parent: 'orig',
            rows: [
                null,
                { x: 240, y: 125, mag: Math.SQRT1_2, phase: 0, op: 1 },
                { x: 240, y: 125, mag: Math.SQRT1_2, phase: 0, op: 1 },
                { x: 140, y: 125, mag: Math.SQRT1_2, phase: 0, op: 0.1 },
            ],
        },
        {
            key: 'g1', state: 'ground', parent: 'orig',
            rows: [
                null,
                { x: 240, y: 214, mag: Math.SQRT1_2, phase: 0, op: 1 },
                { x: 240, y: 214, mag: Math.SQRT1_2, phase: 0, op: 1 },
                { x: 140, y: 214, mag: Math.SQRT1_2, phase: 0, op: 0.1 },
            ],
        },
        {
            key: 'e2a', state: 'excited', parent: 'e1',
            rows: [
                null, null, null,
                { x: 261, y: 125, mag: 0.5, phase: 0, op: 1 },
                { x: 107, y: 125, mag: 0.5, phase: 0, op: 0.1 },
            ],
        },
        {
            key: 'e2b', state: 'excited', parent: 'g1',
            rows: [
                null, null, null,
                { x: 328, y: 125, mag: 0.5, phase: 180, op: 1 },
                { x: 174, y: 125, mag: 0.5, phase: 180, op: 0.1 },
            ],
        },
        {
            key: 'g2a', state: 'ground', parent: 'g1',
            rows: [
                null, null, null,
                { x: 261, y: 214, mag: 0.5, phase: 0, op: 1 },
                { x: 107, y: 214, mag: 0.5, phase: 0, op: 0.1 },
            ],
        },
        {
            key: 'g2b', state: 'ground', parent: 'e1', birthPhase: 180,
            rows: [
                null, null, null,
                { x: 328, y: 214, mag: 0.5, phase: 360, op: 1 },
                { x: 174, y: 214, mag: 0.5, phase: 360, op: 0.1 },
            ],
        },
        {
            key: 'result', state: 'ground', parent: 'g2b',
            rows: [
                null, null, null, null,
                { x: 340, y: 168, mag: 1, phase: 0, op: 1 },
            ],
        },
    ];

    // A connector is drawn from its parent's rim to its child's, so its geometry is derived
    // rather than tabled — it stretches correctly all the way through a split with nothing to
    // keep in sync. All it carries of its own is when it is on screen: each pulse shows only
    // its own connectors, so a linear sample of this is the fade in and out for free.
    const RM_LINKS = [
        { from: 'orig', to: 'e1', track: [0, 1, 0, 0, 0] },
        { from: 'orig', to: 'g1', track: [0, 1, 0, 0, 0] },
        { from: 'e1', to: 'e2a', track: [0, 0, 0, 1, 0] },
        { from: 'e1', to: 'g2b', track: [0, 0, 0, 1, 0] },
        { from: 'g1', to: 'e2b', track: [0, 0, 0, 1, 0] },
        { from: 'g1', to: 'g2a', track: [0, 0, 0, 1, 0] },
        { from: 'g2b', to: 'result', track: [0, 0, 0, 0, 1] },
    ];

    // Fill in the nulls once, at module scope: births from the parent's row at that step with no
    // amplitude, deaths by carrying the last row forward at opacity 0. RM_CAST lists parents
    // before children, so one forward pass is enough. Render then never has to branch, and the
    // expanded table is directly assertable.
    function expandRamseyCast() {
        const byKey = {};

        RM_CAST.forEach(copy => {
            byKey[copy.key] = copy;

            const parent = copy.parent ? byKey[copy.parent] : null;
            let last = null;

            for (let i = 0; i < RM_STEPS; i++) {
                const row = copy.rows[i] || null;

                if (row) {
                    last = row;
                    continue;
                }

                if (last) {
                    // Gone: hold the last pose and fade it out where it stands.
                    copy.rows[i] = { x: last.x, y: last.y, mag: last.mag, phase: last.phase, op: 0 };
                    continue;
                }

                // Not born yet: sit inside whatever the copy will grow out of, at no size. The
                // first copy has no parent, so it simply starts where it starts.
                const seat = parent ? parent.rows[i] : copy.rows.find(Boolean);
                const phase = copy.birthPhase === undefined ? copy.rows.find(Boolean).phase : copy.birthPhase;

                copy.rows[i] = { x: seat.x, y: seat.y, mag: 0, phase, op: 1 };
            }
        });
    }

    expandRamseyCast();

    // Linear between the two keyframes s falls between. The tween is what eases; the table is
    // read straight, so `s` stays a story position rather than a curve.
    function sampleRamseyTrack(track, s) {
        const i = clampNumber(Math.floor(s), 0, track.length - 2);
        const u = clampNumber(s - i, 0, 1);

        return track[i] + (track[i + 1] - track[i]) * u;
    }

    function sampleRamseyRow(rows, s) {
        const i = clampNumber(Math.floor(s), 0, rows.length - 2);
        const u = clampNumber(s - i, 0, 1);
        const a = rows[i];
        const b = rows[i + 1];
        const mix = key => a[key] + (b[key] - a[key]) * u;

        return { x: mix('x'), y: mix('y'), mag: mix('mag'), phase: mix('phase'), op: mix('op') };
    }

    // Degrees per millisecond. The excited arrow turns faster in proportion to its energy, which
    // is the one piece of physics the reader is asked to take on trust.
    function ramseyOmega(state) {
        return (360 / RM_PERIOD_GROUND) * (state === 'excited' ? RM_ENERGY_RATIO : 1);
    }

    // Figma draws two arrow lengths — 41 on the full and half atoms, 33 on the quarter ones —
    // and they are not proportional to the disc. This is the one continuous rule through both,
    // which matters because a newborn copy has to grow its arrow out of nothing rather than
    // spring a full-length one out of a disc that is not there yet.
    function ramseyArrowLength(radius) {
        if (radius <= RM_SMALL_RADIUS) return RM_ARROW_SHORT * (radius / RM_SMALL_RADIUS);

        const u = clampNumber((radius - RM_SMALL_RADIUS) / (RM_HALF_RADIUS - RM_SMALL_RADIUS), 0, 1);

        return RM_ARROW_SHORT + (RM_ARROW_LONG - RM_ARROW_SHORT) * u;
    }

    // How far the excited arrow has drawn ahead of the ground one, in degrees. This is the only
    // angle in the widget that means anything on its own: 0 is the equal superposition the first
    // blast leaves behind, 180 is the opposition the wait ends on, and everything between is a
    // position along the equator.
    function ramseyRelativeAngle(tau) {
        return (RM_ENERGY_RATIO - 1) * 360 * tau / RM_PERIOD_GROUND;
    }

    // The nearest moment in the direction of travel at which the arrows strike a given pose — an
    // even number of ground turns for parallel, an odd number for opposed. Tweening tau to one of
    // these is what makes a step land on its Figma frame exactly rather than nearly.
    function ramseyPoseTau(from, parity, forward) {
        const turns = from / RM_PERIOD_GROUND;
        let n = forward ? Math.ceil(turns) : Math.floor(turns);

        if ((((n % 2) + 2) % 2) !== parity) n += forward ? 1 : -1;

        return n * RM_PERIOD_GROUND;
    }

    // Two blasts, one track: the second is the first replayed over s - 2.
    function ramseyPacketX(s) {
        const phase = sampleRamseyTrack(RM_PACKET_TRACK, s < 2 ? s : s - 2);

        return RM_PACKET_START + phase * RM_PACKET_TRAVEL;
    }

    // Where the *cast* stands, which on a blast hop is behind where the story stands. Holding the
    // copies still until the pulse has reached them, and finishing before it has left, is the
    // whole of making the blast look like the cause rather than a coincidence. Outside a blast
    // hop this is the identity, so nothing else in the widget has to know it exists — and it
    // agrees with `s` exactly at every keyframe, so no keyframe is affected either.
    function ramseyCastPosition(s) {
        const step = Math.floor(s);

        if (step !== 0 && step !== 2) return s;

        return step + easeInOutCubic(clampNumber((s - step - RM_SPLIT_DELAY) / RM_SPLIT_SPAN, 0, 1));
    }

    // Frozen at init, exactly as the emission widget freezes its spray: the pulse then moves as
    // one rigid group, so a frame's work is a single transform rather than 166 positions.
    function seedRamseyPhotons($widget) {
        const $photons = $widget.querySelector('.rm-photons');
        if (!$photons) return null;

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < RM_PHOTON_COUNT; i++) {
            const $dot = document.createElementNS(SVG_NS, 'circle');
            const offset = clampNumber(randomNormal() * RM_PACKET_SIGMA, -RM_PACKET_HALF_BAND, RM_PACKET_HALF_BAND);

            $dot.setAttribute('class', 'rm-photon');
            $dot.setAttribute('cx', (Math.random() * RM_PACKET_LENGTH).toFixed(2));
            $dot.setAttribute('cy', (RM_PACKET_ROW + offset).toFixed(2));
            fragment.appendChild($dot);
        }

        $photons.appendChild(fragment);

        return $photons;
    }


    function readDoubleSlitPathsParams($widget) {
        const $slider = param => $widget.querySelector(`.dsp-slider[data-param="${param}"]`);
        const value = param => {
            const $found = $slider(param);
            return $found ? Number($found.value) : 0;
        };

        const $position = $slider('position');

        return {
            // 0 is the left-hand end of the wall and 1 the right-hand end, whatever range
            // the slider is given — the slider and the drawing have to agree, and this is
            // the one place that conversion happens.
            position: $position ? Number($position.value) / Number($position.max) : 0.5,
            wavelength: value('wavelength'),
            separation: value('separation'),
        };
    }

    // The amplitude arriving at `x` on the wall through one slit. Two of these added
    // together is the entire widget — and the entire idea of the section.
    //
    // The arrow shrinks as 1/√r, the falloff of a cylindrical wave in 2D (the same rule
    // computeDoubleSlitField() uses, so the two widgets agree), and turns through a full
    // circle every wavelength travelled. `near` is the source-to-slit leg: equal for both
    // slits, since the source is centred, so it rotates both arrows together and cancels
    // out of the interference — but leaving it in is what makes the pair sweep round
    // together when the wavelength changes, which is true and worth seeing.
    function doubleSlitPathAmplitude(slitX, x, wavelength, near) {
        const distance = Math.hypot(x - slitX, DSP_SLIT_Y - DSP_WALL_Y);
        const phase = 2 * Math.PI * (near + distance) / wavelength;
        const magnitude = 0.5 * Math.sqrt(DSP_REFERENCE_LEG / distance);

        return {
            distance,
            phase,
            magnitude,
            real: magnitude * Math.cos(phase),
            imaginary: magnitude * Math.sin(phase),
        };
    }

    // Everything downstream — the two path drawings, the three arrows, the chart — is a
    // read of this one object, so there is only ever one description of the geometry.
    function computeDoubleSlitPaths(params) {
        const detectorX = params.position * DSP_WIDTH;
        const halfSeparation = params.separation / 2;
        const near = Math.hypot(halfSeparation, DSP_SOURCE_Y - DSP_SLIT_Y);

        const paths = ['left', 'right'].map(side => {
            const slitX = DSP_SOURCE_X + (side === 'left' ? -halfSeparation : halfSeparation);
            const amplitude = doubleSlitPathAmplitude(slitX, detectorX, params.wavelength, near);

            return {
                side,
                phase: amplitude.phase,
                magnitude: amplitude.magnitude,
                real: amplitude.real,
                imaginary: amplitude.imaginary,
                // Each leg carries the arc length already travelled when it starts, which
                // is what lets its hue ramp pick up where the previous one left off.
                near: { x1: DSP_SOURCE_X, y1: DSP_SOURCE_Y, x2: slitX, y2: DSP_SLIT_Y, length: near, start: 0 },
                far: { x1: slitX, y1: DSP_SLIT_Y, x2: detectorX, y2: DSP_WALL_Y, length: amplitude.distance, start: near },
            };
        });

        const real = paths.reduce((sum, path) => sum + path.real, 0);
        const imaginary = paths.reduce((sum, path) => sum + path.imaginary, 0);

        return {
            detectorX,
            paths,
            total: {
                magnitude: Math.hypot(real, imaginary),
                phase: Math.atan2(imaginary, real),
            },
        };
    }


    /*****************************************
                    UI UPDATES
    *****************************************/

    function renderElectronCloud($widget) {
        const state = _electronClouds.get($widget);
        if (!state) return;

        // Both axes are measured in stage widths, so the vertical offset has to be divided
        // by the stage's aspect ratio on the way into a percentage of its height. Without
        // this the cloud stretches into an ellipse as the stage gets wider.
        const width = state.$stage.offsetWidth;
        const height = state.$stage.offsetHeight;
        const heightInWidths = width ? height / width : 1;

        state.seeds.forEach((seed, i) => {
            const { x, dy } = electronDotPosition(seed, state.t);
            const $dot = state.$dots[i];

            $dot.style.left = `${x * 100}%`;
            $dot.style.top = `${50 + dy / heightInWidths * 100}%`;
        });
    }

    function syncElectronControls($widget) {
        const state = _electronClouds.get($widget);
        if (!state) return;

        const $scrubber = $widget.querySelector('.te-scrubber');
        const $toggle = $widget.querySelector('.te-toggle');

        if ($scrubber && document.activeElement !== $scrubber) {
            $scrubber.value = String(Math.round(state.t * Number($scrubber.max)));
        }

        $widget.classList.toggle('is-playing', state.playing);
        if ($toggle) $toggle.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
    }


    // Both the aspect correction and the atom's own height are layout facts, so they are read
    // from the layout — once here, rather than per frame inside the render loop.
    function measureEmissionStage($widget) {
        const state = _emissionFields.get($widget);
        if (!state) return;

        const width = state.$stage.offsetWidth;
        const height = state.$stage.offsetHeight;

        // A zero-width stage means the widget has not been laid out yet (or is in a pane that
        // never lays it out); keep the last good numbers rather than dividing by nothing.
        if (!width || !height) return;

        state.heightInWidths = height / width;

        const declared = parseFloat(getComputedStyle($widget).getPropertyValue('--em-atom-y'));
        if (!Number.isNaN(declared)) state.atomY = declared / 100;
    }

    function renderEmissionField($widget) {
        const state = _emissionFields.get($widget);
        if (!state) return;

        const t = state.t;
        // Collapse is the last instant of the timeline, and it is instant: every phantom copy
        // but one stops existing. Being keyed off t alone keeps the render pure, so scrubbing
        // back off the end brings the whole spray straight back.
        const collapsed = t >= 1;

        state.seeds.forEach((seed, i) => {
            const { x, dy, emitted } = emissionPhotonPosition(seed, t);
            const $photon = state.$photons[i];
            const shown = collapsed ? i === state.survivor : emitted;

            // Writing display on every dot every frame would be 110 needless style
            // invalidations; only the ones that actually changed are worth the write.
            if (shown !== seed.shown) {
                $photon.style.display = shown ? '' : 'none';
                seed.shown = shown;
            }

            if (!shown) return;

            // Both axes are in stage widths, so the vertical offset is divided by the stage's
            // aspect ratio on the way into a percentage of its height. Without this the spray
            // flattens into an ellipse as the stage gets wider.
            $photon.style.left = `${(0.5 + x) * 100}%`;
            $photon.style.top = `${(state.atomY + dy / state.heightInWidths) * 100}%`;
        });

        // The atom and its orbital ride the same curve as the photon count, by construction.
        // Only the excited pair is written: the ground disc underneath is always opaque, so
        // the blue on show is 1 - excited without anything having to say so. See the note in
        // emission.html for why cross-fading both would leave the atom see-through.
        const stillExcited = 1 - emissionEmittedFraction(t);

        $widget.style.setProperty('--em-excited-opacity', String(stillExcited));
        $widget.style.setProperty('--em-cloud-opacity', String(stillExcited));
    }

    // Labels belong to keyframes, but not *only* to keyframes: a reader who takes hold of the
    // scrubber rather than pressing the buttons would otherwise never meet a caption at all,
    // which is the one failure this widget cannot afford. So between keyframes the caption of
    // the last one passed stays up, dimmed (`approximate`) — near enough to keep the reader
    // oriented, visibly not claiming that the picture in front of them *is* that keyframe.
    // While a tween is running there is still no caption: the clock is nobody's choice then.
    function setEmissionLabel($widget, step, approximate) {
        $widget.querySelectorAll('.em-label').forEach($label => {
            const current = Number($label.dataset.step) === step;
            $label.classList.toggle('is-visible', current);
            $label.classList.toggle('is-approximate', current && !!approximate);
        });

        const $status = $widget.querySelector('.em-status');
        if (!$status) return;

        // Only exact arrivals are announced. Reading a caption out on every frame of a drag
        // would flood the live region with the same four sentences.
        const $current = step === null || approximate
            ? null
            : $widget.querySelector(`.em-label[data-step="${step}"]`);
        $status.textContent = $current ? $current.textContent : '';
    }

    function syncEmissionControls($widget) {
        const state = _emissionFields.get($widget);
        if (!state) return;

        const $scrubber = $widget.querySelector('.em-scrubber');
        const $prev = $widget.querySelector('.em-step--prev');
        const $next = $widget.querySelector('.em-step--next');

        // Don't fight the reader's grip on the thumb.
        if ($scrubber && document.activeElement !== $scrubber) {
            $scrubber.value = String(Math.round(state.t * Number($scrubber.max)));
        }

        if ($prev) $prev.disabled = state.t <= EM_STEPS[0] + EM_EPSILON;
        if ($next) $next.disabled = state.t >= EM_STEPS[EM_STEPS.length - 1] - EM_EPSILON;
    }

    // Everything the Ramsey stage shows, from the two clocks and nothing else. Called from the
    // rAF loop, from every settle, and from init — there is no other way anything gets drawn.
    //
    // Deliberately whole rather than split into an s-part and a tau-part: while the widget is only
    // idling, the connectors, the pulse and the trail are rewritten with the values they already
    // had. That is about a hundred property writes a frame, in the same range as the traveling
    // electron's seventy dots, and buying them back would mean a dirty flag that has to be right
    // every time — the kind of cache that is correct for one review. If this ever needs to go, the
    // honest fix is to measure first, in a real browser: performance.now() is clamped under
    // --virtual-time-budget and will report the timer floor for any version of this.
    function renderRamsey($widget) {
        const state = _ramseyStates.get($widget);
        if (!state) return;

        // The cast runs behind the story through a blast, so that the copies separate in the
        // pulse's wake rather than alongside it. The pulse itself reads the story position.
        const castS = ramseyCastPosition(state.s);
        const poses = {};

        state.copies.forEach(copy => {
            const row = sampleRamseyRow(copy.rows, castS);
            const radius = RM_UNIT_RADIUS * row.mag;
            const length = ramseyArrowLength(radius);

            poses[copy.key] = { x: row.x, y: row.y, radius, op: row.op };

            // Position is JS's, because it is recomputed every frame anyway; everything else
            // goes through a custom property so the look stays in the stylesheet. Units are
            // written here rather than added in a calc(), which is the silent-failure trap.
            copy.$g.setAttribute('transform', `translate(${row.x.toFixed(2)} ${row.y.toFixed(2)})`);
            copy.$g.style.setProperty('--rm-radius', `${radius.toFixed(2)}px`);
            // The halo's width is a constant in Figma, added to whatever the disc's radius is.
            // It cannot stay constant all the way down, though: a copy waiting to be born has no
            // disc, and a bare 16-unit red wash sitting where the atom will appear reads as a
            // bruise on the picture. Fading it in with the disc it belongs to costs one clamp.
            const halo = radius + RM_HALO[copy.state] * clampNumber(radius / RM_SMALL_RADIUS, 0, 1);

            copy.$g.style.setProperty('--rm-halo', `${halo.toFixed(2)}px`);
            copy.$g.style.setProperty('--rm-opacity', row.op.toFixed(3));
            copy.$g.style.setProperty('--rm-arrow-length', `${length.toFixed(2)}px`);
            // A stub of an arrow on a disc that is barely there reads as a speck of dirt, so it
            // fades in over the first few units of its own length rather than being clipped.
            copy.$g.style.setProperty('--rm-arrow-opacity', clampNumber(length / RM_ARROW_FADE, 0, 1).toFixed(3));
            // The structural phase from the table, plus however far this copy's arrow has turned.
            // Two copies of the same energy therefore always differ by exactly what the table
            // says they differ by, whatever tau happens to be — which is what lets the arrows
            // keep spinning without ever making the captions untrue.
            copy.$g.style.setProperty('--rm-angle', `${(row.phase + ramseyOmega(copy.state) * state.tau).toFixed(2)}deg`);
            copy.$tip.setAttribute('transform', `translate(0 ${(-length).toFixed(2)})`);
        });

        state.links.forEach(link => {
            const from = poses[link.from];
            const to = poses[link.to];
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const span = Math.hypot(dx, dy);
            const opacity = sampleRamseyTrack(link.track, castS);
            // Rim to rim, so the connector stretches as the split opens. While the child is
            // still inside its parent there is no room for an arrowhead, and drawing one would
            // leave a stray wedge at the parent's edge — so it simply is not there yet.
            const length = span - from.radius - to.radius - RM_LINK_TAIL_GAP - RM_LINK_HEAD_GAP;

            if (opacity <= 0 || span <= 0 || length <= RM_LINK_HEAD) {
                link.$g.style.setProperty('--rm-opacity', '0');
                return;
            }

            const unitX = dx / span;
            const unitY = dy / span;
            const tailX = from.x + (from.radius + RM_LINK_TAIL_GAP) * unitX;
            const tailY = from.y + (from.radius + RM_LINK_TAIL_GAP) * unitY;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            link.$g.setAttribute('transform', `translate(${tailX.toFixed(2)} ${tailY.toFixed(2)}) rotate(${angle.toFixed(2)})`);
            link.$g.style.setProperty('--rm-opacity', opacity.toFixed(3));
            link.$g.style.setProperty('--rm-link-length', `${length.toFixed(2)}px`);
            link.$g.style.setProperty('--rm-link-shaft', `${(length - RM_LINK_HEAD).toFixed(2)}px`);
        });

        if (state.$photons) {
            state.$photons.setAttribute('transform', `translate(${ramseyPacketX(state.s).toFixed(2)} 0)`);
        }

        renderRamseyBloch(state, castS);
    }

    // The trail is three arcs, one per hop that moves the state, and each is revealed by pulling
    // its own dash back. pathLength="1" in the markup is what makes the progress writable
    // directly, with nothing measured; the px unit is mandatory, since stroke-dashoffset takes a
    // length and a bare number is dropped on the floor.
    //
    // The two meridian arcs are the blasts, so they follow the cast rather than the story and the
    // trail leaves the pole in the pulse's wake. The equator arc is the wait, and it is the one
    // thing here driven by tau instead: the state's position along the equator *is* the angle
    // between the two arrows, so reading it off anything else would have the sphere arriving at
    // "minus" while the two arrows on the left are still visibly short of opposition.
    // How far round the equator the state has travelled — the angle between the two arrows,
    // measured against the half turn that separates “plus” from “minus”. Only asked while the
    // widget is on the wait itself: a hop that spans several steps has no relative rotation to
    // keep pace with, and there the story position is the honest answer.
    function ramseyEquatorProgress(state) {
        if (state.s <= 1) return 0;
        if (state.s >= 2) return 1;
        if (!state.tween || !state.tween.wait) return state.s - 1;

        return clampNumber(normalizeAngle(ramseyRelativeAngle(state.tau)) / 180, 0, 1);
    }

    function renderRamseyBloch(state, castS) {
        const progress = [
            clampNumber(castS, 0, 1),
            ramseyEquatorProgress(state),
            clampNumber(castS - 2, 0, 1),
        ];

        state.trails.forEach(($trail, i) => {
            $trail.style.setProperty('--rm-trail', `${(1 - progress[i]).toFixed(4)}px`);
        });

        // A marker lights as the trail passes over it, a node when the arc arriving at it lands.
        // Ground starts lit because that is where the atom begins, and the trail returns to it;
        // excited is never lit, which is the picture's whole point.
        state.markers.forEach(($marker, i) => {
            $marker.classList.toggle('is-lit', progress[i] >= 0.5);
        });

        const lit = { ground: true, plus: progress[0] >= 1, minus: progress[1] >= 1, excited: false };


        state.nodes.forEach($node => {
            $node.classList.toggle('is-lit', !!lit[$node.dataset.node]);
        });
    }

    // Captions belong to keyframes, not to moments: while the clock is moving there is no step
    // to caption, so none of them show and the live region is emptied.
    function setRamseyCaption($widget, step) {
        $widget.querySelectorAll('.rm-caption').forEach($caption => {
            $caption.classList.toggle('is-visible', Number($caption.dataset.step) === step);
        });

        const $status = $widget.querySelector('.rm-status');
        if (!$status) return;

        const $current = step === null ? null : $widget.querySelector(`.rm-caption[data-step="${step}"]`);
        $status.textContent = $current ? $current.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    // The trail only shows where the reader has already been, so steps still ahead are not in
    // the rail at all — it grows as they advance, which is how the Figma frames draw it.
    function syncRamseyChrome($widget) {
        const state = _ramseyStates.get($widget);
        if (!state) return;

        const reached = state.tween ? Math.max(state.step, state.tween.step) : state.step;

        $widget.querySelectorAll('.rm-crumb').forEach($crumb => {
            const step = Number($crumb.dataset.step);
            const $item = $crumb.closest('.rm-crumb-item');

            if ($item) $item.hidden = step > reached;

            $crumb.classList.toggle('is-current', step === reached);
            // Deliberately never disabled. Steps ahead are hidden outright, so the only crumb
            // that is not somewhere to go is the current one — and disabling it would throw a
            // keyboard reader's focus onto the body the instant they pressed Enter on it, since
            // the crumb they just used becomes the current step. goToRamseyStep() already
            // ignores a request to go where it already is.
            if (step === reached) {
                $crumb.setAttribute('aria-current', 'step');
            } else {
                $crumb.removeAttribute('aria-current');
            }
        });

        const $back = $widget.querySelector('.rm-button--back');
        const $next = $widget.querySelector('.rm-button--next');

        if ($back) $back.disabled = reached <= 0;
        if ($next) $next.disabled = reached >= RM_STEPS - 1;

        scrollRamseyCrumbIntoView($widget, reached);
    }

    // Not scrollIntoView(): this page scrolls in a container of its own, and asking an element
    // to bring itself into view there moves the article instead of the rail. Setting scrollLeft
    // from the crumb's own offset does only what it says.
    function scrollRamseyCrumbIntoView($widget, step) {
        const $rail = $widget.querySelector('.rm-rail');
        const $crumb = $widget.querySelector(`.rm-crumb[data-step="${step}"]`);
        if (!$rail || !$crumb) return;

        const $item = $crumb.closest('.rm-crumb-item') || $crumb;
        const overflow = $item.offsetLeft + $item.offsetWidth - $rail.clientWidth;

        if (overflow > $rail.scrollLeft) $rail.scrollLeft = overflow;
        else if ($item.offsetLeft < $rail.scrollLeft) $rail.scrollLeft = $item.offsetLeft;

        $rail.classList.toggle('is-scrolled', $rail.scrollLeft > 0);
    }

    function describeArrow(angle, magnitude) {
        return `${Math.round(normalizeAngle(angle))} degrees, length ${magnitude.toFixed(2)}`;
    }

    function setArrow($dial, angle, magnitude) {
        const scale = readDialScale($dial);
        const $shaft = $dial.querySelector('.qam-arrow-shaft');
        const $head = $dial.querySelector('.qam-arrow-head');
        if (!scale || !$shaft || !$head) return;

        const length = magnitude * scale;

        // SVG's y axis points down and rotate() turns clockwise, so the angle the screen
        // wants is the negative of the one the maths wants. Negate here, once.
        $dial.style.setProperty('--qam-angle', `${-angle}deg`);

        // x1/x2 on a <line> and width on a <rect> are not reachable from CSS the way
        // transforms are, so the length is set here rather than through a custom property.
        $shaft.setAttribute('width', String(length));
        $head.setAttribute('x', String(length));

        // Absent on the result dial, which is a read-only output.
        const $grabber = $dial.querySelector('.qam-grabber-group');
        if (!$grabber) return;

        $grabber.setAttribute('transform', `translate(${length} 0)`);
        $grabber.setAttribute('aria-valuenow', String(Math.round(normalizeAngle(angle))));
        $grabber.setAttribute('aria-valuetext', describeArrow(angle, magnitude));
    }

    function renderProduct($widget) {
        const $factors = $widget.querySelectorAll('.qam-dial--factor');
        const $result = $widget.querySelector('.qam-dial--result');
        if ($factors.length !== 2 || !$result) return;

        const a = readArrow($factors[0]);
        const b = readArrow($factors[1]);

        // The whole point of the widget: multiplying two amplitudes adds their angles
        // and multiplies their lengths.
        const angle = a.angle + b.angle;
        const magnitude = a.magnitude * b.magnitude;

        setArrow($result, angle, magnitude);

        const $status = $widget.querySelector('.qam-status');
        if ($status) $status.textContent = `Product: ${describeArrow(angle, magnitude)}.`;
    }


    // Hue is the amplitude's phase, brightness its length. Saturation is always full, which
    // reduces HSV -> RGB to the six-way ramp below.
    function paintDoubleSlitField($canvas, field) {
        const context = $canvas.getContext('2d');
        if (!context) return;

        const image = context.createImageData($canvas.width, $canvas.height);
        const data = image.data;

        // Normalised against the true peak, so exactly one point reaches full brightness.
        const inversePeak = field.peak > 0 ? 1 / field.peak : 0;

        for (let index = 0; index < field.real.length; index++) {
            const re = field.real[index];
            const im = field.imaginary[index];

            const value = Math.pow(Math.sqrt(re * re + im * im) * inversePeak, DS_GAMMA);
            const hue = (Math.atan2(im, re) / (2 * Math.PI) + 0.5) * 6;

            const sector = Math.floor(hue) % 6;
            const fraction = hue - Math.floor(hue);
            const falling = value * (1 - fraction);
            const rising = value * fraction;

            let r = 0;
            let g = 0;
            let b = 0;
            switch (sector) {
                case 0: r = value; g = rising; break;
                case 1: r = falling; g = value; break;
                case 2: g = value; b = rising; break;
                case 3: g = falling; b = value; break;
                case 4: r = rising; b = value; break;
                default: r = value; b = falling; break;
            }

            const pixel = index * 4;
            data[pixel] = r * 255;
            data[pixel + 1] = g * 255;
            data[pixel + 2] = b * 255;
            data[pixel + 3] = 255;
        }

        context.putImageData(image, 0, 0);
    }

    // The sensor is the top edge of the pattern, so the curve reads row 0 of the field and
    // sits directly above it. One point per field column, which is already a fine enough
    // sampling of a smooth function that straight segments between them read as a curve —
    // no spline needed, and no peak can slip between two samples.
    //
    // Deliberately NOT renormalised per frame. Two arrows in phase are twice one arrow, so a
    // bright fringe is 4/r whatever the wavelength and separation are — that is the fixed
    // scale used here. The centre, where the two paths are always equal, therefore always
    // reaches full height, and everything else is honestly relative to it: fringes further
    // out sit lower because they are further from the slits, and a null reads as zero.
    // Rescaling to the tallest point each frame would flatten exactly those differences.
    function updateDoubleSlitDistribution($widget, field, patternWidth, patternHeight) {
        const $svg = $widget.querySelector('.ds-distribution');
        if (!$svg) return;

        const $line = $svg.querySelector('.ds-distribution-line');
        const $area = $svg.querySelector('.ds-distribution-area');
        if (!$line || !$area) return;

        // Read the plot's geometry back off the SVG rather than keeping a second copy here.
        const width = $svg.viewBox.baseVal.width;
        const height = $svg.viewBox.baseVal.height;

        const fullScale = 4 / patternHeight; // two unit arrows in phase, at the sensor
        const span = height - DS_CURVE_HEADROOM;

        const points = [];
        for (let column = 0; column < patternWidth; column++) {
            const re = field.real[column];
            const im = field.imaginary[column];
            const probability = clampNumber((re * re + im * im) / fullScale, 0, 1);

            const x = (column + 0.5) * width / patternWidth;
            const y = height - probability * span;
            points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
        }

        const line = `M${points.join('L')}`;

        $line.setAttribute('d', line);
        // The same curve, closed along the bottom edge of the panel.
        $area.setAttribute('d', `${line}L${width} ${height}L0 ${height}Z`);
    }

    // The wall is symmetric about the centre, so the two edges of the left slit describe
    // all three bars. Percentages, so the wall tracks the canvas at any rendered size.
    function updateDoubleSlitWall($widget, params) {
        const centre = DS_REFERENCE_WIDTH / 2;
        const outer = centre - (params.separation + DS_DRAWN_SLIT) / 2;
        // Below one drawn slit's worth of separation the gaps overlap, and the bar between
        // them pinches to nothing rather than turning inside out — two slits become one.
        const inner = centre - Math.max(0, (params.separation - DS_DRAWN_SLIT) / 2);

        $widget.style.setProperty('--ds-slit-outer', `${outer / DS_REFERENCE_WIDTH * 100}%`);
        $widget.style.setProperty('--ds-slit-inner', `${inner / DS_REFERENCE_WIDTH * 100}%`);
    }

    // Unitless numbers, purely so the values are legible while the ranges are being tuned.
    function updateDoubleSlitReadouts($widget, params) {
        Object.keys(params).forEach(key => {
            const $value = $widget.querySelector(`.ds-value[data-value-for="${key}"]`);
            if ($value) $value.textContent = String(Math.round(params[key]));
        });

        const $status = $widget.querySelector('.ds-status');
        if (!$status) return;

        $status.textContent = `Wavelength ${Math.round(params.wavelength)}, `
            + `slit separation ${Math.round(params.separation)}.`;
    }


    // A leg is a straight run, so its hue ramp is a plain linear gradient — and because
    // the ramp repeats every wavelength, spreadMethod="repeat" over a one-wavelength
    // vector says the whole thing in four attributes. Rebuilding a stop per 60° instead
    // would mean hundreds of nodes per frame at a short wavelength.
    //
    // The vector starts back down the leg by however much phase has already accumulated
    // at the leg's own start, which is what makes the far leg pick up exactly where the
    // near one left off.
    function setPhaseGradient($svg, id, leg, wavelength) {
        const $gradient = $svg.querySelector(`#${id}`);
        if (!$gradient || !leg.length || !wavelength) return;

        const unitX = (leg.x2 - leg.x1) / leg.length;
        const unitY = (leg.y2 - leg.y1) / leg.length;
        const back = leg.start % wavelength;

        const x1 = leg.x1 - unitX * back;
        const y1 = leg.y1 - unitY * back;

        $gradient.setAttribute('x1', x1.toFixed(3));
        $gradient.setAttribute('y1', y1.toFixed(3));
        $gradient.setAttribute('x2', (x1 + unitX * wavelength).toFixed(3));
        $gradient.setAttribute('y2', (y1 + unitY * wavelength).toFixed(3));
    }

    function updateDoubleSlitPathsDrawing($widget, geometry, params) {
        const $svg = $widget.querySelector('.dsp-setup');
        if (!$svg) return;

        geometry.paths.forEach(path => {
            DSP_LEGS.forEach(name => {
                const leg = path[name];
                const $line = $svg.querySelector(`.dsp-path-leg[data-leg="${path.side}-${name}"]`);
                if (!$line) return;

                $line.setAttribute('x1', leg.x1.toFixed(2));
                $line.setAttribute('y1', leg.y1.toFixed(2));
                $line.setAttribute('x2', leg.x2.toFixed(2));
                $line.setAttribute('y2', leg.y2.toFixed(2));

                setPhaseGradient($svg, `dsp-hue-${path.side}-${name}`, leg, params.wavelength);
            });
        });
    }

    // The barrier is symmetric about the centre, so the two edges of the left slit
    // describe all three bars. Below one drawn slit's worth of separation the gaps
    // overlap, and the bar between them pinches to nothing rather than turning inside
    // out — two slits become one.
    function updateDoubleSlitPathsWall($widget, params) {
        const $svg = $widget.querySelector('.dsp-setup');
        if (!$svg) return;

        const centre = DSP_WIDTH / 2;
        const outer = centre - (params.separation + DSP_DRAWN_SLIT) / 2;
        const inner = centre - Math.max(0, (params.separation - DSP_DRAWN_SLIT) / 2);

        const bars = {
            left: [0, outer],
            middle: [inner, DSP_WIDTH - 2 * inner],
            right: [DSP_WIDTH - outer, outer],
        };

        Object.keys(bars).forEach(name => {
            const $bar = $svg.querySelector(`.dsp-wall--near[data-bar="${name}"]`);
            if (!$bar) return;

            $bar.setAttribute('x', String(bars[name][0]));
            $bar.setAttribute('width', String(Math.max(0, bars[name][1])));
        });
    }

    // One sample per unit of wall, which is already a fine enough sampling of a smooth
    // function that straight segments between them read as a curve, and fine enough that
    // no fringe can slip between two samples.
    //
    // Deliberately NOT renormalised per frame — see doubleSlitPathAmplitude(). Full height
    // is always "both paths in phase at the centre", so a wide fringe pattern and a narrow
    // one are drawn on the same scale, outer fringes sit honestly lower because they are
    // further from the slits, and a null reads as zero.
    function updateDoubleSlitPathsChart($widget, params) {
        const $svg = $widget.querySelector('.dsp-chart');
        if (!$svg) return;

        const $line = $svg.querySelector('.dsp-chart-line');
        const $area = $svg.querySelector('.dsp-chart-area');
        if (!$line || !$area) return;

        // Read the plot's geometry back off the SVG rather than keeping a second copy here.
        const width = $svg.viewBox.baseVal.width;
        const height = $svg.viewBox.baseVal.height;
        const span = height - DSP_CURVE_HEADROOM;

        const halfSeparation = params.separation / 2;
        const near = Math.hypot(halfSeparation, DSP_SOURCE_Y - DSP_SLIT_Y);

        const points = [];
        for (let column = 0; column <= DSP_WIDTH; column++) {
            const left = doubleSlitPathAmplitude(DSP_SOURCE_X - halfSeparation, column, params.wavelength, near);
            const right = doubleSlitPathAmplitude(DSP_SOURCE_X + halfSeparation, column, params.wavelength, near);

            const real = left.real + right.real;
            const imaginary = left.imaginary + right.imaginary;
            const probability = clampNumber(real * real + imaginary * imaginary, 0, 1);

            const x = column * width / DSP_WIDTH;
            const y = height - probability * span;
            points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
        }

        const line = `M${points.join('L')}`;

        $line.setAttribute('d', line);
        // The same curve, closed along the bottom edge of the panel.
        $area.setAttribute('d', `${line}L${width} ${height}L0 ${height}Z`);
    }

    // Angle to CSS, length to the SVG — the same split setArrow() makes in the
    // amplitude-multiplication widget, and for the same reason: a <rect>'s width is not
    // reachable from CSS the way a transform is.
    function setDoubleSlitPathArrow($dial, phase, magnitude) {
        const $face = $dial.querySelector('.dsp-dial-face');
        const $shaft = $dial.querySelector('.dsp-arrow-shaft');
        const $head = $dial.querySelector('.dsp-arrow-head');
        if (!$face || !$shaft || !$head) return;

        // The dial's own radius, read back off the SVG so the size lives in one place.
        const scale = $face.r.baseVal.value;
        const length = magnitude * scale;
        const degrees = phase * 180 / Math.PI;

        // SVG's y axis points down and rotate() turns clockwise, so the angle the screen
        // wants is the negative of the one the maths wants. Negate here, once.
        $dial.style.setProperty('--dsp-angle', `${-normalizeAngle(degrees)}deg`);

        $shaft.setAttribute('width', String(length.toFixed(2)));
        $head.setAttribute('x', String(length.toFixed(2)));
    }

    function updateDoubleSlitPathsArrows($widget, geometry) {
        const $svg = $widget.querySelector('.dsp-equation');
        if (!$svg) return;

        geometry.paths.forEach(path => {
            const $dial = $svg.querySelector(`.dsp-dial[data-role="${path.side}"]`);
            if ($dial) setDoubleSlitPathArrow($dial, path.phase, path.magnitude);
        });

        const $total = $svg.querySelector('.dsp-dial[data-role="total"]');
        if ($total) setDoubleSlitPathArrow($total, geometry.total.phase, geometry.total.magnitude);
    }

    // Unitless numbers, purely so the values are legible while the ranges are being tuned.
    function updateDoubleSlitPathsReadouts($widget, params, geometry) {
        Object.keys(params).forEach(key => {
            const $value = $widget.querySelector(`.dsp-value[data-value-for="${key}"]`);
            if ($value) $value.textContent = String(Math.round(params[key]));
        });

        const $status = $widget.querySelector('.dsp-status');
        if (!$status) return;

        $status.textContent = `${Math.round(params.position * 100)}% of the way across the wall. `
            + `Wavelength ${Math.round(params.wavelength)}, slit separation ${Math.round(params.separation)}. `
            + `Total amplitude length ${geometry.total.magnitude.toFixed(2)} of a possible 1.`;
    }


    /*****************************************
                     HANDLERS
    *****************************************/

    function dragTo($widget, $dial, clientX, clientY) {
        const point = pointToDial($dial, clientX, clientY);
        const scale = readDialScale($dial);
        if (!point || !scale) return;

        const angle = Math.atan2(-point.y, point.x) * 180 / Math.PI;
        const magnitude = clampNumber(Math.hypot(point.x, point.y) / scale, MIN_MAGNITUDE, 1);

        setArrow($dial, angle, magnitude);
        renderProduct($widget);
    }

    function nudge($widget, $dial, angleDelta, magnitudeDelta) {
        const { angle, magnitude } = readArrow($dial);

        setArrow(
            $dial,
            angle + angleDelta,
            clampNumber(magnitude + magnitudeDelta, MIN_MAGNITUDE, 1)
        );
        renderProduct($widget);
    }

    function resetDial($widget, $dial) {
        const seed = readSeed($dial);

        setArrow($dial, seed.angle, seed.magnitude);
        renderProduct($widget);
    }

    // <g> is not natively a slider, so spell out the key handling. Right and Up increase,
    // per the slider role, which puts Right on the counter-clockwise side.
    function handleDialKey(e, $widget, $dial) {
        const step = e.shiftKey ? ANGLE_STEP_FINE : ANGLE_STEP;

        switch (e.key) {
            case 'ArrowRight': nudge($widget, $dial, step, 0); break;
            case 'ArrowLeft': nudge($widget, $dial, -step, 0); break;
            case 'ArrowUp': nudge($widget, $dial, 0, MAGNITUDE_STEP); break;
            case 'ArrowDown': nudge($widget, $dial, 0, -MAGNITUDE_STEP); break;
            case 'Home': resetDial($widget, $dial); break;
            default: return;
        }

        e.preventDefault(); // stop the arrows and Home from scrolling the page
        $dial.classList.add('is-used');
    }


    function renderDoubleSlit($widget) {
        const $canvas = $widget.querySelector('.ds-canvas');
        if (!$canvas) return;

        const params = readDoubleSlitParams($widget);
        const field = computeDoubleSlitField($canvas, params);

        paintDoubleSlitField($canvas, field);

        updateDoubleSlitDistribution($widget, field, $canvas.width, $canvas.height);
        updateDoubleSlitWall($widget, params);
        updateDoubleSlitReadouts($widget, params);
    }

    // A drag fires 'input' faster than the field can be recomputed, so collapse a burst of
    // them into one render per frame.
    function scheduleDoubleSlitRender($widget) {
        if (_doubleSlitFrames.has($widget)) return;

        _doubleSlitFrames.set($widget, requestAnimationFrame(() => {
            _doubleSlitFrames.delete($widget);
            renderDoubleSlit($widget);
        }));
    }


    function renderDoubleSlitPaths($widget) {
        const params = readDoubleSlitPathsParams($widget);
        const geometry = computeDoubleSlitPaths(params);

        updateDoubleSlitPathsDrawing($widget, geometry, params);
        updateDoubleSlitPathsWall($widget, params);
        updateDoubleSlitPathsChart($widget, params);
        updateDoubleSlitPathsArrows($widget, geometry);
        updateDoubleSlitPathsReadouts($widget, params, geometry);
    }

    // The chart is 201 samples of two square roots and four trig calls, which a drag can
    // outrun; collapse a burst of 'input' events into one render per frame.
    function scheduleDoubleSlitPathsRender($widget) {
        if (_doubleSlitPathFrames.has($widget)) return;

        _doubleSlitPathFrames.set($widget, requestAnimationFrame(() => {
            _doubleSlitPathFrames.delete($widget);
            renderDoubleSlitPaths($widget);
        }));
    }


    function stepElectronCloud($widget, timestamp) {
        const state = _electronClouds.get($widget);
        if (!state) return;

        // A fresh start after a pause, a scrub, or a scroll back into view has no previous
        // timestamp to measure against; skip one frame rather than jumping the clock.
        if (!state.last) state.last = timestamp;

        const elapsed = Math.min(TE_MAX_FRAME, (timestamp - state.last) / 1000) * 1000;
        state.last = timestamp;

        // Wrap rather than stop: the cloud leaves on the right and the next electron
        // arrives on the left.
        state.t = (state.t + elapsed / TE_SWEEP_DURATION) % 1;

        renderElectronCloud($widget);
        syncElectronControls($widget);

        state.frame = requestAnimationFrame(ts => stepElectronCloud($widget, ts));
    }

    // The loop runs only while the widget is both playing and on screen, so a post carrying
    // four widgets is not paying for the ones the reader has scrolled past.
    function updateElectronPlayback($widget) {
        const state = _electronClouds.get($widget);
        if (!state) return;

        const shouldRun = state.playing && state.visible;

        if (shouldRun && !state.frame) {
            state.last = 0;
            state.frame = requestAnimationFrame(ts => stepElectronCloud($widget, ts));
        } else if (!shouldRun && state.frame) {
            cancelAnimationFrame(state.frame);
            state.frame = 0;
            state.last = 0;
        }
    }

    function setElectronPlaying($widget, playing) {
        const state = _electronClouds.get($widget);
        if (!state) return;

        state.playing = playing;

        syncElectronControls($widget);
        updateElectronPlayback($widget);

        const $status = $widget.querySelector('.te-status');
        if ($status) $status.textContent = playing ? 'Playing.' : 'Paused.';
    }

    // Taking hold of the scrubber is a request to look at one moment, so it stops the clock
    // rather than fighting it.
    function scrubElectronCloud($widget, $scrubber) {
        const state = _electronClouds.get($widget);
        if (!state) return;

        state.t = clampNumber(Number($scrubber.value) / Number($scrubber.max), 0, 1);

        if (state.playing) setElectronPlaying($widget, false);
        renderElectronCloud($widget);
    }


    function stepEmissionTween($widget, timestamp) {
        const state = _emissionFields.get($widget);
        if (!state || !state.tween) return;

        // A fresh start after a scroll back into view has no previous timestamp to measure
        // against; skip one frame rather than jumping the clock.
        if (!state.last) state.last = timestamp;

        const elapsed = Math.min(EM_MAX_FRAME, (timestamp - state.last) / 1000) * 1000;
        state.last = timestamp;

        const tween = state.tween;
        tween.elapsed += elapsed;

        const u = clampNumber(tween.elapsed / tween.duration, 0, 1);

        state.t = tween.from + (tween.to - tween.from) * easeInOutCubic(u);

        renderEmissionField($widget);
        syncEmissionControls($widget);

        if (u >= 1) {
            settleEmissionStep($widget, tween.step);
            return;
        }

        state.frame = requestAnimationFrame(ts => stepEmissionTween($widget, ts));
    }

    // Arriving at a keyframe: land exactly on it, stop the clock, and caption it.
    function settleEmissionStep($widget, step) {
        const state = _emissionFields.get($widget);
        if (!state) return;

        if (state.frame) cancelAnimationFrame(state.frame);

        state.frame = 0;
        state.last = 0;
        state.tween = null;
        state.t = EM_STEPS[step];

        renderEmissionField($widget);
        syncEmissionControls($widget);
        setEmissionLabel($widget, step);
    }

    // The step buttons search for the nearest keyframe *strictly past* where the clock stands,
    // which is what lets them work identically whether the reader arrived here by pressing a
    // button or by dragging the scrubber to some moment in between.
    function goToEmissionStep($widget, direction) {
        const state = _emissionFields.get($widget);
        if (!state) return;

        // Search from where the clock is *heading*, not from where it happens to be. A reader
        // pressing the button twice in quick succession means two steps; searching from the
        // current t would find the keyframe already being tweened to and start it over.
        const target = state.tween ? state.tween.to : state.t;
        const from = state.t;
        const step = direction > 0
            ? EM_STEPS.findIndex(value => value > target + EM_EPSILON)
            : findLastEmissionStep(target);

        if (step === -1) return; // already at whichever end was asked for

        setEmissionLabel($widget, null);

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            settleEmissionStep($widget, step);
            return;
        }

        // The timeline is deliberately lopsided — three keyframes inside the first tenth, then
        // one long haul to 0.9 — so a fixed duration would either crawl through the short hops
        // or blur straight past the spread. Scale it with the distance instead.
        const span = Math.abs(EM_STEPS[step] - from);

        state.tween = {
            from,
            to: EM_STEPS[step],
            step,
            elapsed: 0,
            duration: EM_TWEEN_MIN + (EM_TWEEN_MAX - EM_TWEEN_MIN) * span,
        };

        state.last = 0;
        updateEmissionPlayback($widget);
    }

    function findLastEmissionStep(from) {
        for (let i = EM_STEPS.length - 1; i >= 0; i--) {
            if (EM_STEPS[i] < from - EM_EPSILON) return i;
        }

        return -1;
    }

    // The tween runs only while the widget is on screen, so a post carrying six widgets is not
    // paying for the ones the reader has scrolled past. A tween interrupted by scrolling away
    // is finished rather than abandoned — coming back to a half-arrived keyframe with no label
    // would look broken.
    function updateEmissionPlayback($widget) {
        const state = _emissionFields.get($widget);
        if (!state) return;

        if (state.tween && state.visible && !state.frame) {
            state.last = 0;
            state.frame = requestAnimationFrame(ts => stepEmissionTween($widget, ts));
        } else if (state.tween && !state.visible) {
            settleEmissionStep($widget, state.tween.step);
        }
    }

    // Taking hold of the scrubber is a request to look at one moment of your own choosing, so it
    // abandons any tween. The thumb goes exactly where it was put — and the caption comes to it,
    // dimmed between keyframes. See setEmissionLabel().
    function scrubEmissionField($widget, $scrubber) {
        const state = _emissionFields.get($widget);
        if (!state) return;

        if (state.frame) cancelAnimationFrame(state.frame);

        state.frame = 0;
        state.last = 0;
        state.tween = null;
        state.t = clampNumber(Number($scrubber.value) / Number($scrubber.max), 0, 1);

        const step = emissionStepAtOrBefore(state.t);

        setEmissionLabel($widget, step, Math.abs(EM_STEPS[step] - state.t) > EM_EPSILON);
        renderEmissionField($widget);
        syncEmissionControls($widget);
    }

    // The last keyframe at or before t. Unlike findLastEmissionStep() this includes the keyframe
    // the clock is standing exactly on, because the question here is "what is the reader looking
    // at", not "where would Back go". Never -1: EM_STEPS starts at 0 and t is clamped to [0, 1].
    function emissionStepAtOrBefore(t) {
        for (let i = EM_STEPS.length - 1; i >= 0; i--) {
            if (EM_STEPS[i] <= t + EM_EPSILON) return i;
        }

        return 0;
    }

    // One MediaQueryList rather than a fresh matchMedia() per frame, since the spin loop asks
    // every time — and asking every time is the point: a reader who turns the setting on
    // mid-article should have the arrows stop, not wait for a reload.
    const _ramseyReduced = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : { matches: false };

    // The arrows turn while the reader is reading, except on the two steps that pin the state to
    // a named point on the equator. There they hold: a relative angle that kept growing would be
    // the state sliding on past the point the caption is describing. Under reduced motion they
    // never turn at all, and settleRamseyStep places tau by keyframe instead.
    function ramseySpinning(state) {
        if (_ramseyReduced.matches) return false;

        return RM_POSE_STEP[state.step] === null;
    }

    // One loop, both clocks. Through a hop tau is interpolated to the pose the hop is aiming at
    // rather than merely advanced, so a dropped frame cannot leave the arrows a fraction of a
    // turn short of where the step says they are.
    function stepRamseyClock($widget, timestamp) {
        const state = _ramseyStates.get($widget);
        if (!state) return;

        state.frame = 0;

        // A loop restarted after scrolling back into view has no previous timestamp to measure
        // against; skip one frame rather than jumping either clock.
        if (!state.last) state.last = timestamp;

        const elapsed = Math.min(RM_MAX_FRAME, timestamp - state.last);
        state.last = timestamp;

        if (state.tween) {
            const tween = state.tween;

            tween.elapsed += elapsed;

            const u = clampNumber(tween.elapsed / tween.duration, 0, 1);

            state.s = tween.from + (tween.to - tween.from) * easeInOutCubic(u);
            // Linear on the wait, because there the duration was measured out in turns and a
            // steady rate is real time exactly — which is what lets the sphere's equator arc be
            // read straight off the arrows. Eased everywhere else, so that a hop which has to
            // cover an awkward amount of turning does not start and stop with a jolt.
            state.tau = tween.tauFrom + (tween.tauTo - tween.tauFrom) * (tween.wait ? u : easeInOutCubic(u));

            if (u >= 1) {
                settleRamseyStep($widget, tween.step);
                return;
            }
        } else if (ramseySpinning(state)) {
            state.tau += elapsed;
        }

        renderRamsey($widget);

        if (state.visible && (state.tween || ramseySpinning(state))) {
            state.frame = requestAnimationFrame(ts => stepRamseyClock($widget, ts));
        }
    }

    // Arriving at a keyframe: land exactly on it, caption it, and let the spin pick up again
    // unless this is the step that holds still.
    function settleRamseyStep($widget, step) {
        const state = _ramseyStates.get($widget);
        if (!state) return;

        if (state.frame) cancelAnimationFrame(state.frame);

        state.frame = 0;
        state.last = 0;

        // Put tau exactly where the hop was aiming rather than wherever the last partial frame
        // left it — otherwise the arrows strike their pose to within a frame instead of exactly.
        if (state.tween) state.tau = state.tween.tauTo;

        state.tween = null;
        state.step = step;
        state.s = step;

        if (_ramseyReduced.matches) state.tau = RM_REDUCED_TAU[step];

        renderRamsey($widget);
        syncRamseyChrome($widget);
        setRamseyCaption($widget, step);
        updateRamseyPlayback($widget);
    }

    // Both the buttons and the breadcrumbs come through here, so going back four steps and
    // going forward one are the same operation with a different destination — and because every
    // drawn value is a function of s, going backwards runs the whole picture in reverse: the
    // pulse flies right to left and the copies fold back into the atom they came from.
    function goToRamseyStep($widget, step) {
        const state = _ramseyStates.get($widget);
        if (!state) return;

        const target = clampNumber(Math.round(step), 0, RM_STEPS - 1);
        // Aim from where the clock is heading rather than where it happens to be, so a reader
        // pressing next twice in quick succession gets two steps instead of restarting one.
        const heading = state.tween ? state.tween.step : state.step;

        if (target === heading) return;

        setRamseyCaption($widget, null);

        if (_ramseyReduced.matches) {
            settleRamseyStep($widget, target);
            return;
        }

        // A step that pins the state to a point on the equator has to land on the exact moment
        // the arrows strike that pose; the other three leave tau free and simply let it run on
        // through the hop. Rewinding aims at the pose *behind* where the clock stands, so the
        // arrows unwind — which is what makes the equator arc retrace itself rather than lurch.
        const forward = target > state.s;
        const parity = RM_POSE_STEP[target];
        const pose = parity === null
            ? null
            : ramseyPoseTau(state.tau + (forward ? RM_POSE_MIN : -RM_POSE_MIN), parity, forward);

        // Walking forward into the wait is the one hop whose length is not a design decision: it
        // is however long the arrows really take to come into opposition, because watching that
        // happen is the whole of the step. Since step 1 parks them parallel, that is always
        // exactly one turn of the slow arrow. Every other hop takes a fixed time, grown
        // sub-linearly so a four-step rewind does not plod.
        const wait = (heading === 1 && target === 2) || (heading === 2 && target === 1);
        const duration = wait && forward
            ? Math.abs(pose - state.tau)
            : Math.min(RM_TWEEN_MAX, RM_TWEEN * Math.pow(Math.abs(target - state.s), RM_TWEEN_SPAN));

        state.tween = {
            from: state.s,
            to: target,
            step: target,
            tauFrom: state.tau,
            tauTo: pose === null ? state.tau + duration : pose,
            wait,
            elapsed: 0,
            duration,
        };
        state.last = 0;

        syncRamseyChrome($widget);
        updateRamseyPlayback($widget);
    }

    // The loop runs only while the widget is on screen, so a post carrying seven widgets is not
    // paying for the ones the reader has scrolled past. A hop interrupted by scrolling away is
    // finished rather than abandoned — coming back to a half-arrived keyframe with no caption
    // would look broken.
    function updateRamseyPlayback($widget) {
        const state = _ramseyStates.get($widget);
        if (!state) return;

        if (state.tween && !state.visible) {
            settleRamseyStep($widget, state.tween.step);
            return;
        }

        if (state.frame || !state.visible) return;
        if (!state.tween && !ramseySpinning(state)) return;

        state.last = 0;
        state.frame = requestAnimationFrame(ts => stepRamseyClock($widget, ts));
    }


    /*****************************************
                  LISTENER WIRING
    *****************************************/

    function initHongOuMandel() {
        const $widgets = document.querySelectorAll('.hong-ou-mandel-widget');

        $widgets.forEach($widget => {
            const $sources = $widget.querySelectorAll('.hom-source');

            $sources.forEach($source => {
                $source.addEventListener('click', () => firePhoton($widget, $source));

                // <g> is not natively a button, so spell out the key handling.
                $source.addEventListener('keydown', e => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault(); // stop Space from scrolling the page
                    firePhoton($widget, $source);
                });
            });
        });
    }


    function initAmplitudeMultiplication() {
        const $widgets = document.querySelectorAll('.amplitude-multiplication-widget');

        $widgets.forEach($widget => {
            const $factors = $widget.querySelectorAll('.qam-dial--factor');
            if ($factors.length !== 2) return;

            $factors.forEach($dial => {
                const seed = readSeed($dial);
                setArrow($dial, seed.angle, seed.magnitude);

                // The whole disc is the target, not the knob: scaled down to phone width
                // the knob is about 6px across, which is not something you can grab.
                $dial.addEventListener('pointerdown', e => {
                    e.preventDefault(); // stop the browser starting a drag of its own
                    $dial.setPointerCapture(e.pointerId);
                    $dial.classList.add('is-dragging', 'is-used');

                    // Deliberately no focus() here. preventDefault() above stops the
                    // compatibility mousedown, so Chrome never records a pointer as the
                    // input modality and treats a programmatic focus as keyboard-driven —
                    // which paints the :focus-visible ring during an ordinary mouse drag.
                    dragTo($widget, $dial, e.clientX, e.clientY);
                });

                // Pointer capture retargets move and up to $dial, so there is nothing to
                // attach to the document and nothing to tear down.
                $dial.addEventListener('pointermove', e => {
                    if (!$dial.hasPointerCapture(e.pointerId)) return;
                    dragTo($widget, $dial, e.clientX, e.clientY);
                });

                ['pointerup', 'pointercancel'].forEach(type => {
                    $dial.addEventListener(type, () => $dial.classList.remove('is-dragging'));
                });

                const $grabber = $dial.querySelector('.qam-grabber-group');
                if ($grabber) {
                    $grabber.addEventListener('keydown', e => handleDialKey(e, $widget, $dial));
                }
            });

            renderProduct($widget);
        });
    }


    function initDoubleSlitPattern() {
        const $widgets = document.querySelectorAll('.double-slit-widget');

        $widgets.forEach($widget => {
            const $sliders = $widget.querySelectorAll('.ds-slider');
            if (!$sliders.length) return;

            $sliders.forEach($slider => {
                $slider.addEventListener('input', () => scheduleDoubleSlitRender($widget), { passive: true });
            });

            renderDoubleSlit($widget);
        });
    }


    function initDoubleSlitPaths() {
        const $widgets = document.querySelectorAll('.double-slit-paths-widget');

        $widgets.forEach($widget => {
            const $sliders = $widget.querySelectorAll('.dsp-slider');
            if (!$sliders.length) return;

            $sliders.forEach($slider => {
                $slider.addEventListener('input', () => scheduleDoubleSlitPathsRender($widget), { passive: true });
            });

            renderDoubleSlitPaths($widget);
        });
    }


    function initTravelingElectron() {
        const $widgets = document.querySelectorAll('.traveling-electron-widget');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        $widgets.forEach($widget => {
            const state = seedElectronCloud($widget);
            if (!state) return;

            _electronClouds.set($widget, state);

            // Reduced motion gets the widget parked mid-sweep: a single dot at t = 0 says
            // nothing, and the point of the picture is the cloud. Play still works — it is
            // the default that is being honoured, not the feature that is being removed.
            state.t = prefersReducedMotion ? TE_REDUCED_MOTION_T : 0;

            const $scrubber = $widget.querySelector('.te-scrubber');
            if ($scrubber) {
                $scrubber.addEventListener('input', () => scrubElectronCloud($widget, $scrubber), { passive: true });
            }

            const $toggle = $widget.querySelector('.te-toggle');
            if ($toggle) {
                $toggle.addEventListener('click', () => setElectronPlaying($widget, !state.playing));
            }

            // Percentages survive a resize on their own, but the aspect correction baked
            // into each dot's `top` does not — so recompute when the stage changes shape.
            if (window.ResizeObserver) {
                new ResizeObserver(() => renderElectronCloud($widget)).observe(state.$stage);
            }

            if (window.IntersectionObserver) {
                new IntersectionObserver(entries => {
                    state.visible = entries[entries.length - 1].isIntersecting;
                    updateElectronPlayback($widget);
                }).observe($widget);
            }

            renderElectronCloud($widget);
            setElectronPlaying($widget, !prefersReducedMotion);
        });
    }

    function initEmission() {
        const $widgets = document.querySelectorAll('.emission-widget');

        $widgets.forEach($widget => {
            const state = seedEmissionField($widget);
            if (!state) return;

            _emissionFields.set($widget, state);

            // Measure before choosing the survivor: which copies are still in frame at t = 1
            // depends on the stage's shape, which differs between the wide layout and the
            // taller one a phone gets.
            measureEmissionStage($widget);
            state.survivor = pickEmissionSurvivor($widget, state);

            const $scrubber = $widget.querySelector('.em-scrubber');
            if ($scrubber) {
                $scrubber.addEventListener('input', () => scrubEmissionField($widget, $scrubber), { passive: true });
            }

            const $prev = $widget.querySelector('.em-step--prev');
            if ($prev) $prev.addEventListener('click', () => goToEmissionStep($widget, -1));

            const $next = $widget.querySelector('.em-step--next');
            if ($next) $next.addEventListener('click', () => goToEmissionStep($widget, 1));

            // Percentages survive a resize on their own, but the aspect correction and the
            // atom's own height do not — so remeasure when the stage changes shape.
            if (window.ResizeObserver) {
                new ResizeObserver(() => {
                    measureEmissionStage($widget);
                    renderEmissionField($widget);
                }).observe(state.$stage);
            }

            if (window.IntersectionObserver) {
                new IntersectionObserver(entries => {
                    state.visible = entries[entries.length - 1].isIntersecting;
                    updateEmissionPlayback($widget);
                }).observe($widget);
            }

            // Nothing to guard for reduced motion here: the widget starts stopped at its first
            // keyframe either way, and goToEmissionStep() is where the tween is skipped.
            settleEmissionStep($widget, 0);
        });
    }

    function initRamsey() {
        const $widgets = document.querySelectorAll('.ramsey-widget');

        $widgets.forEach($widget => {
            // The cast is in the markup; this only pairs each entry with the group that draws
            // it, so a missing one is a missing widget rather than a thrown error mid-render.
            const copies = RM_CAST.map(copy => {
                const $g = $widget.querySelector(`.rm-atom[data-copy="${copy.key}"]`);

                return $g && {
                    key: copy.key,
                    state: copy.state,
                    rows: copy.rows,
                    $g,
                    $tip: $g.querySelector('.rm-arrow-tip'),
                };
            });

            const links = RM_LINKS.map(link => {
                const $g = $widget.querySelector(`.rm-connector[data-connector="${link.from}:${link.to}"]`);

                return $g && { from: link.from, to: link.to, track: link.track, $g };
            });

            if (copies.some(copy => !copy) || links.some(link => !link)) return;

            const state = {
                copies,
                links,
                $photons: seedRamseyPhotons($widget),
                trails: [...$widget.querySelectorAll('.rm-bloch-trail')],
                markers: [...$widget.querySelectorAll('.rm-bloch-marker[data-segment]')],
                nodes: [...$widget.querySelectorAll('.rm-bloch-node')],
                s: 0,
                step: 0,
                tau: 0,
                tween: null,
                frame: 0,
                last: 0,
                visible: true,
            };

            _ramseyStates.set($widget, state);

            $widget.querySelectorAll('.rm-crumb').forEach($crumb => {
                $crumb.addEventListener('click', () => goToRamseyStep($widget, Number($crumb.dataset.step)));
            });

            const $back = $widget.querySelector('.rm-button--back');
            const $next = $widget.querySelector('.rm-button--next');
            const heading = () => (state.tween ? state.tween.step : state.step);

            if ($back) $back.addEventListener('click', () => goToRamseyStep($widget, heading() - 1));
            if ($next) $next.addEventListener('click', () => goToRamseyStep($widget, heading() + 1));

            if (window.IntersectionObserver) {
                new IntersectionObserver(entries => {
                    state.visible = entries[entries.length - 1].isIntersecting;
                    updateRamseyPlayback($widget);
                }).observe($widget);
            }

            // The rail's overflow is measured in layout pixels, so the one thing that does not
            // survive a resize on its own is which crumb is scrolled into view.
            if (window.ResizeObserver) {
                new ResizeObserver(() => syncRamseyChrome($widget)).observe($widget);
            }

            // settleRamseyStep starts the spin loop if there is spinning to do, and places tau
            // by keyframe if there is not — so reduced motion needs no separate branch here.
            settleRamseyStep($widget, 0);
        });
    }


    /*****************************************
                   INITIALIZATION
    *****************************************/

    function init() {
        initHongOuMandel();
        initAmplitudeMultiplication();
        initDoubleSlitPaths();
        initDoubleSlitPattern();
        initTravelingElectron();
        initEmission();
        initRamsey();
    }

    document.addEventListener('DOMContentLoaded', init, { once: true });
})();
