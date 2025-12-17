(() => {
    /*****************************************
                CONSTANTS & CONFIG
    *****************************************/

     const PHOTON_SIZE = 3;
     const PHOTONS_CREATION_RATE = 120;
     const PHOTON_SPEED = 220;
     const PHOTON_CREATION_ZONE_SIZE = 50;

     const MAX_SCATTERED_PERCENTAGE = 30;
     const MAX_ABSORBED_PERCENTAGE = 60;
     const MAX_ELECTRON_CLOUD_FREQ = 15; // Hz
     const MAX_ELECTRON_CLOUD_AMPLITUDE = 20; // px

    let _photonFrequency = 0;
    let _electronCloudAnimation = null;
    let _currentPhotonColor = 'rgb(255, 0, 0)';
    let _absorbedPercentage = 0;
    let _scatteredPercentage = 0;
    
    const $slider = $('#inverse-wavelength-slider');
    const $electronCloud = $('.electron-cloud');
    const $demo = $('.photon-demo');
    const $photonContainer = $('.photon-container');
    const $molecule = $('.o2-molecule');


    /*****************************************
                UTILITY FUNCTIONS
    *****************************************/

    function $(selector) {
        return document.querySelector(selector);
    }
	
	function clampNumber(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}
	
	function interpolateBuckets(values, position, step) {
		//values correspond to positions [0, step, 2*step, ...]
		const lastIndex = values.length - 1;
		const maxPosition = lastIndex * step;
		const clamped = clampNumber(position, 0, maxPosition);
		
		const leftIndex = Math.floor(clamped / step);
		if (leftIndex >= lastIndex) return values[lastIndex];
		
		const rightIndex = leftIndex + 1;
		const leftPos = leftIndex * step;
		const t = (clamped - leftPos) / step;
		
		const leftVal = values[leftIndex];
		const rightVal = values[rightIndex];
		return leftVal + t * (rightVal - leftVal);
	}
	
	function scaleToMax(value, currentMax, targetMax) {
		if (currentMax === 0) return 0;
		return (value / currentMax) * targetMax;
	}

    function createElement(tag, className) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    }
    
    function getLastFrameTimestamp() {
        return performance.now();
    }
    
    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    function hsvToRgb(h, s, v) {
        const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        const r = Math.round(f(5) * 255), g = Math.round(f(3) * 255), b = Math.round(f(1) * 255);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    function computePhotonColor() {
        const min = Number($slider.min || 0), max = Number($slider.max || 1);
        const v = clampNumber((Number($slider.value) - min) / (max - min), 0, 1);
        const segFloat = v * 7, seg = Math.min(6, Math.floor(segFloat)), t = segFloat - seg;
        if (seg < 5) return hsvToRgb((seg + t) * 60, 1, 1);         // red→…→magenta
        if (seg === 5) return hsvToRgb(300, 1, 1 - t);              // magenta→black
        return 'rgb(0, 0, 0)';                                      // black
    }

    /*****************************************
                    CORE LOGIC
    *****************************************/

    function getPhotonFrequency() {
        return _photonFrequency;
    }

    function setPhotonFrequency(frequency) {
        _photonFrequency = frequency;

        updateUIWithPhotonFrequency();
    }
    
    function getScatteredPercentage() {
		const unscaledScattteringValues = [2, 4, 8, 16, 32, 64]; // at 0,100,200,300,400,500
		const unscaled = interpolateBuckets(unscaledScattteringValues, getPhotonFrequency(), 100);
		const maxUnscaled = unscaledScattteringValues[unscaledScattteringValues.length - 1]; // 150
		const scaledScatteredPercentage = scaleToMax(unscaled, maxUnscaled, MAX_SCATTERED_PERCENTAGE);
		return scaledScatteredPercentage;
    }
    
    function getAbsorbedPercentage() {
        const unscaledAbsorbingValues = [0, 0, 0, 0, 5, 500]; // at 0,100,200,300,400,500
        const unscaled = interpolateBuckets(unscaledAbsorbingValues, getPhotonFrequency(), 100);
        const maxUnscaled = unscaledAbsorbingValues[unscaledAbsorbingValues.length - 1]; // 150
        const scaledAbsorbedPercentage = scaleToMax(unscaled, maxUnscaled, MAX_ABSORBED_PERCENTAGE);
        return scaledAbsorbedPercentage;
    }

    function getTransmittedPercentage() {
        return 100 - getScatteredPercentage() - getAbsorbedPercentage();
    }

    function getElectronCloudFrequency() {
        const ELECTRON_CLOUD_FREQ_VALUES = [400, 500, 600, 750, 1000, 1500]; // at 0,100,200,300,400,500
        const unscaled = interpolateBuckets(ELECTRON_CLOUD_FREQ_VALUES, getPhotonFrequency(), 100);
        const maxUnscaled = ELECTRON_CLOUD_FREQ_VALUES[ELECTRON_CLOUD_FREQ_VALUES.length - 1];
        return scaleToMax(unscaled, maxUnscaled, MAX_ELECTRON_CLOUD_FREQ); // Hz
    }

    function getElectronCloudAmplitude() {
        return scaleToMax(getScatteredPercentage(), MAX_SCATTERED_PERCENTAGE, MAX_ELECTRON_CLOUD_AMPLITUDE);
    }

    function getElectronCloudAnimation() {
        if (!_electronCloudAnimation && $electronCloud && $electronCloud.getAnimations) {
            const animations = $electronCloud.getAnimations();
            if (animations && animations.length) {
                const named = animations.find(a => ('animationName' in a) && a.animationName === 'electronCloudVibrate');
                _electronCloudAnimation = named || animations[0];
            }
        }
        return _electronCloudAnimation;
    }

    /*****************************************
                    PHOTON SIM
    *****************************************/
    
    const photonPool = [];
    const activePhotons = [];
    let containerRect = null;
    let moleculeRect = null;
    let spawnCenterY = 0; // relative to container top, center of molecule
    let moleculeCenterX = 0; // relative to container left, center of molecule
    let lastFrameTime = 0;
    let spawnAccumulator = 0; // photons to spawn (fractional)

    function updateRects() {
        if (!$demo || !$molecule) return;
        containerRect = $demo.getBoundingClientRect();
        moleculeRect = $molecule.getBoundingClientRect();
        const moleculeCenterScreenY = moleculeRect.top + (moleculeRect.height / 2);
        spawnCenterY = moleculeCenterScreenY - containerRect.top;
        const moleculeCenterScreenX = moleculeRect.left + (moleculeRect.width / 2);
        moleculeCenterX = moleculeCenterScreenX - containerRect.left;
    }

    function acquirePhotonEl() {
        const el = photonPool.pop() || createElement('div', 'photon');
        el.style.setProperty('--photon-size', `${PHOTON_SIZE}px`);
        if (el.parentNode !== $photonContainer) {
            $photonContainer.appendChild(el);
        }
        return el;
    }

    function releasePhotonEl(el) {
        if (el && el.parentNode === $photonContainer) {
            $photonContainer.removeChild(el);
        }
        photonPool.push(el);
    }

    function spawnPhoton() {
        if (!$photonContainer || !containerRect) return;
        const radius = PHOTON_SIZE / 2;
        const el = acquirePhotonEl();
        const y = spawnCenterY + randomBetween(-PHOTON_CREATION_ZONE_SIZE / 2, PHOTON_CREATION_ZONE_SIZE / 2);
        const x = -radius; // start just off the left edge, center-coords
        const photon = {
            el,
            x,
            y,
            vx: PHOTON_SPEED,
            vy: 0
        };
        activePhotons.push(photon);
        // initial paint
        el.style.transform = `translate3d(${Math.round(x - radius)}px, ${Math.round(y - radius)}px, 0)`;
    }

    function isOffscreen(photon) {
        const radius = PHOTON_SIZE / 2;
        const left = photon.x - radius;
        const right = photon.x + radius;
        const top = photon.y - radius;
        const bottom = photon.y + radius;
        return (
            right < 0 ||
            left > containerRect.width ||
            bottom < 0 ||
            top > containerRect.height
        );
    }

    function animatePhotons(ts) {
        if (!lastFrameTime) lastFrameTime = ts;
        const dt = Math.min(0.05, (ts - lastFrameTime) / 1000); // clamp dt to avoid big jumps
        lastFrameTime = ts;

        if (!containerRect) updateRects();

        // spawn based on rate (photons/sec)
        spawnAccumulator += PHOTONS_CREATION_RATE * dt;
        let toSpawn = spawnAccumulator | 0; // floor
        if (toSpawn > 0) {
            spawnAccumulator -= toSpawn;
            while (toSpawn--) spawnPhoton();
        }

        // update and cull
        for (let i = activePhotons.length - 1; i >= 0; i--) {
            const p = activePhotons[i];
            const prevX = p.x;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            // transform uses top-left; our x/y are centers
            const radius = PHOTON_SIZE / 2;
            p.el.style.transform = `translate3d(${Math.round(p.x - radius)}px, ${Math.round(p.y - radius)}px, 0)`;
            // resolve fate at molecule center (absorb/scatter/transmit)
            if (!p.fateResolved && prevX < moleculeCenterX && p.x >= moleculeCenterX) {
                const r = Math.random();
                const absorbedProb = _absorbedPercentage / 100;
                const scatterProb = _scatteredPercentage / 100;
                if (r < absorbedProb) {
                    releasePhotonEl(p.el);
                    activePhotons.splice(i, 1);
                    continue;
                } else if (r < absorbedProb + scatterProb) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = PHOTON_SPEED;
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                    p.fateResolved = true; // scattered
                } else {
                    p.fateResolved = true; // transmitted
                }
            }
            if (isOffscreen(p)) {
                releasePhotonEl(p.el);
                activePhotons.splice(i, 1);
            }
        }

        requestAnimationFrame(animatePhotons);
    }

    function initPhotons() {
        if (!$photonContainer || !$demo || !$molecule) return;
        updateRects();
        lastFrameTime = getLastFrameTimestamp();
        requestAnimationFrame(animatePhotons);
        // keep geometry up to date
        const ro = 'ResizeObserver' in window ? new ResizeObserver(() => updateRects()) : null;
        if (ro) {
            ro.observe($demo);
            ro.observe($molecule);
        } else {
            window.addEventListener('resize', updateRects, { passive: true });
        }
    }

    /*****************************************
                    UI UPDATES
    *****************************************/

    function updateUIWithPhotonFrequency() {
        const transmittedPercentage = getTransmittedPercentage();
        const scatteredPercentage = getScatteredPercentage();
        const absorbedPercentage = getAbsorbedPercentage();
        _scatteredPercentage = scatteredPercentage;
        _absorbedPercentage = absorbedPercentage;

        const $scatteredBar = $('.gauge__bar--scattered');
        const $absorbedBar = $('.gauge__bar--absorbed');
        const $transmittedBar = $('.gauge__bar--transmitted');
        
        if ($scatteredBar) {
            $scatteredBar.setAttribute('data-percentage', scatteredPercentage);
            $scatteredBar.style.setProperty('--bar-fill', `${Math.max(0, Math.min(100, Math.round(scatteredPercentage)))}%`);
        }
        if ($absorbedBar) {
            $absorbedBar.setAttribute('data-percentage', absorbedPercentage);
            $absorbedBar.style.setProperty('--bar-fill', `${Math.max(0, Math.min(100, Math.round(absorbedPercentage)))}%`);
        }
        if ($transmittedBar) {
            $transmittedBar.setAttribute('data-percentage', transmittedPercentage);
            $transmittedBar.style.setProperty('--bar-fill', `${Math.max(0, Math.min(100, Math.round(transmittedPercentage)))}%`);
        }

        const electronCloudFrequency = getElectronCloudFrequency();
        const electronCloudAmplitude = getElectronCloudAmplitude();

        $electronCloud.style.setProperty('--electron-cloud-amplitude', `${electronCloudAmplitude}px`);

        const electronCloudAnimation = getElectronCloudAnimation();
        const electronCloudAnimationPlaybackRate = Math.max(0.001, electronCloudFrequency);
        electronCloudAnimation.playbackRate = electronCloudAnimationPlaybackRate;
        
        _currentPhotonColor = computePhotonColor();
        $photonContainer.style.color = _currentPhotonColor;
        
        for (let i = 0; i < activePhotons.length; i++) {
            activePhotons[i].el.style.backgroundColor = '';
        }
    }

    function showResetLink($widget) {
        const $resetButton = $widget.querySelector('.reset-color-adjuster');
        $resetButton.classList.remove('visually-hidden');
    }

    function hideResetLink($widget) {
        const $resetButton = $widget.querySelector('.reset-color-adjuster');
        $resetButton.classList.add('visually-hidden');
    }


    /*****************************************
                    HANDLERS
    *****************************************/

    function updatePhotonFrequencyFromSlider() {
        let photonFrequency = Number($slider.value);
        setPhotonFrequency(photonFrequency);
    }

    function updateColorPreviewSwatch($widget) {
        const $redSlider = $widget.querySelector('.red-slider');
        const $greenSlider = $widget.querySelector('.green-slider');
        const $blueSlider = $widget.querySelector('.blue-slider');
        
        const redValue = Number($redSlider.value);
        const greenValue = Number($greenSlider.value);
        const blueValue = Number($blueSlider.value);

        const color = `rgb(${redValue}, ${greenValue}, ${blueValue})`;

        const $swatch = $widget.querySelector('.output-color-swatch');
        $swatch.style.backgroundColor = color;

        showResetLink($widget);
    }

    function resetColorAdjuster(e) {
        const $widget = e.target.closest('.color-adjuster-widget');
        
        const $redSlider = $widget.querySelector('.red-slider');
        const $greenSlider = $widget.querySelector('.green-slider');
        const $blueSlider = $widget.querySelector('.blue-slider');

        $redSlider.value = $redSlider.dataset.initialValue;
        $greenSlider.value = $greenSlider.dataset.initialValue;
        $blueSlider.value = $blueSlider.dataset.initialValue;

        updateColorPreviewSwatch($widget);

        e.preventDefault();
    }


    /*****************************************
                  LISTENER WIRING
    *****************************************/

    if ($slider) {
        $slider.addEventListener('input', updatePhotonFrequencyFromSlider, { passive: true });
    }

    function wireColorAdjusterListeners() {
        const $widgets = document.querySelectorAll('.color-adjuster-widget');
        $widgets.forEach($widget => {
            const $red = $widget.querySelector('.red-slider');
            const $green = $widget.querySelector('.green-slider');
            const $blue = $widget.querySelector('.blue-slider');
            const $reset = $widget.querySelector('.reset-color-adjuster');
            
            if ($red) $red.addEventListener('input', () => updateColorPreviewSwatch($widget), { passive: true });
            if ($green) $green.addEventListener('input', () => updateColorPreviewSwatch($widget), { passive: true });
            if ($blue) $blue.addEventListener('input', () => updateColorPreviewSwatch($widget), { passive: true });
            if ($reset) $reset.addEventListener('click', resetColorAdjuster);
        });
    }

    function initFirefighterImageBlend() {
        const widgets = document.querySelectorAll('.image-blend-widget');
        widgets.forEach(widget => {
            const slider = widget.querySelector('.ir-opacity-slider');
            if (!slider) return;
            const update = () => {
                const v = Math.max(0, Math.min(100, Number(slider.value || 0)));
                widget.style.setProperty('--ir-opacity', String(v / 100));
            };
            update();
            slider.addEventListener('input', update, { passive: true });
        });
    }
 
    function initBlueSkyScatteringDiagramAnimation() {
        const diagrams = document.querySelectorAll('.inline-svg-diagram');
        if (!diagrams || !diagrams.length) return;
        
        const prefersReduced = ('matchMedia' in window) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        diagrams.forEach(diagram => {
            
            if (prefersReduced) {
                diagram.classList.remove('is-running');
                return;
            }

            const startCycle = () => {
                const cs = getComputedStyle(diagram);
                const lightSpeed = Math.max(1e-6, parseFloat(cs.getPropertyValue('--light-speed')) || 200);
                const pauseBeforeBlue = parseFloat(cs.getPropertyValue('--pause-before-blue')) || 0;
                const pauseAfterBlue = parseFloat(cs.getPropertyValue('--pause-after-blue')) || 0;
                const roygSec = 300 / lightSpeed;
                const blueSeqSec = (250 + 20 + 20 + 10) / lightSpeed;
                const cycleMs = Math.max(0, (roygSec + pauseBeforeBlue + blueSeqSec + pauseAfterBlue) * 1000);
                diagram.classList.add('is-running');
                window.setTimeout(() => {
                    diagram.classList.remove('is-running');
                    // Force reflow to reset animations
                    void diagram.offsetWidth;
                    window.setTimeout(() => startCycle(), 50);
                }, cycleMs);
            };
            
            startCycle();
        });
    }
 
    
    /*****************************************
                   INITIALIZATION
    *****************************************/

    function init() {
        updatePhotonFrequencyFromSlider();
        initPhotons();

        const $widgets = document.querySelectorAll('.color-adjuster-widget');
        $widgets.forEach($widget => {
            updateColorPreviewSwatch($widget);
            hideResetLink($widget);
        });
        
        wireColorAdjusterListeners();
        initFirefighterImageBlend();
        initBlueSkyScatteringDiagramAnimation();
    }

    document.addEventListener('DOMContentLoaded', init, { once: true });
})();