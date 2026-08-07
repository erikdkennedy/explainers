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

    // Pending render per widget, so a drag never queues up more than one.
    const _doubleSlitFrames = new WeakMap();
    const _doubleSlitPathFrames = new WeakMap();

    // Per-widget simulation state: the frozen dot seeds, the clock, and the rAF handle.
    const _electronClouds = new WeakMap();


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


    /*****************************************
                   INITIALIZATION
    *****************************************/

    function init() {
        initHongOuMandel();
        initAmplitudeMultiplication();
        initDoubleSlitPaths();
        initDoubleSlitPattern();
        initTravelingElectron();
    }

    document.addEventListener('DOMContentLoaded', init, { once: true });
})();
