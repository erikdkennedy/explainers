// three.js scene for the wavefunction surface.
//
// three is here for OrbitControls and the matrix stack and nothing else — the materials
// are RawShaderMaterial + GLSL3 and opt out of the chunk pipeline entirely. See the
// header of shaders.js for why.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { surfaceVertex, surfaceFragment, frameVertex, frameFragment } from './shaders.js';

/* ============================================================================
   CONSTANTS & CONFIG
   ============================================================================ */

const PLANE_SIZE = 1;          // world units; the field window is square
const PREVIEW_WIDTH = 1400;    // uPixelScale is measured against this, so lines authored
                               // in the preview keep their width through the 2x export

export const defaultLook = {
    // Colour gain. The transmitted pattern is ~0.6% of the incident packet's amplitude,
    // so without this the entire payoff of the video renders black. Over-exposed regions
    // clamp to a fully saturated hue rather than washing out — see the fragment shader.
    exposure: 14,
    heightScale: 0.24,
    // Log-scaled in the UI. Height takes its whole dynamic range from here rather than
    // from exposure; at 0.002 the incident hill is full height and the diffracted pattern
    // sits around a quarter of it. Probability mode squares the range, so it wants a much
    // smaller knee than amplitude mode — expect to move this when toggling.
    knee: 0.02,
    heightMode: 1,          // 0 = probability |psi|^2, 1 = amplitude |psi|
    gamma: 0.6,             // DS_GAMMA, matching the flat canvas widget
    ambient: 0.55,
    diffuse: 0.45,
    specular: 0.35,
    shininess: 60,
    lightAzimuth: 135,      // degrees
    lightElevation: 42,
    fade: 0.14,
    grid: 0,
    gridCount: 24,
    gridWidth: 1.1,
    frameOpacity: 0.55,
    frameWidth: 1.3,
    // The barrier band. Kept below frameOpacity so it reads as a surface the wave meets
    // rather than competing with the crisp border lines.
    wallOpacity: 0.34,
    // How far above the ground the frame lines float. The field is never exactly zero, so
    // a line at y=0 gets buried under the faint haze everywhere; lift it until the lines
    // clear the plain but the real humps still occlude them.
    frameHeight: 0.006,
    fov: 32,
    cameraAzimuth: 0,       // degrees around +Y, 0 = looking down -Z from +Z
    cameraElevation: 32,
    cameraDistance: 2.05,
    cameraTargetY: 0.06,
};

/* ============================================================================
   CORE
   ============================================================================ */

export class SurfaceScene {
    constructor(canvas) {
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,          // 2x supersampling on export beats MSAA here, and
                                       // MSAA cannot be read back from a render target
            preserveDrawingBuffer: true,
        });
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.toneMapping = THREE.NoToneMapping;
        // LinearSRGBColorSpace is three's identity transform — NoColorSpace is only legal
        // on a texture and throws here. RawShaderMaterial never pulls in
        // <colorspace_fragment> anyway, so nothing converts: the shader writes HSV values
        // straight out, exactly as paintDoubleSlitField() writes them into ImageData.
        // Adding a conversion would also silently make the export darker than the
        // preview, since the canvas and render-target paths read different settings.
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(defaultLook.fov, 1, 0.01, 100);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;

        this.look = { ...defaultLook };
        this.fieldSize = { width: 0, height: 0 };
        this.texture = null;
        this.mesh = null;

        this.buildFrame();
        this.applyCamera();
    }

    /* --- geometry & texture -------------------------------------------- */

    // The window size changes with the wavelength (the absorbing margin scales with it),
    // so the mesh is rebuilt whenever it does rather than assumed constant.
    ensureSize(width, height) {
        if (this.fieldSize.width === width && this.fieldSize.height === height) return;
        this.fieldSize = { width, height };

        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.scene.remove(this.mesh);
        }
        if (this.texture) this.texture.dispose();

        const data = new Uint16Array(width * height * 4);
        this.texture = new THREE.DataTexture(
            data, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
        // ⚠️ All four of these matter. three's default minFilter is a mipmap filter, and
        // a mipmap filter on a texture with no mipmaps makes it *incomplete* — it then
        // samples as (0,0,0,1) with no error at all, i.e. a flat black surface.
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.generateMipmaps = false;
        this.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.texture.wrapT = THREE.ClampToEdgeWrapping;
        // texelFetch indexes raw texels, so the upload must not flip rows under it.
        this.texture.flipY = false;
        this.texture.colorSpace = THREE.NoColorSpace;
        this.texture.needsUpdate = true;

        const geometry = new THREE.PlaneGeometry(
            PLANE_SIZE, PLANE_SIZE, width - 1, height - 1);

        const material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: surfaceVertex,
            fragmentShader: surfaceFragment,
            uniforms: {
                uField: { value: this.texture },
                uFieldSize: { value: new THREE.Vector2(width, height) },
                uPlaneSize: { value: new THREE.Vector2(PLANE_SIZE, PLANE_SIZE) },
                uCell: { value: new THREE.Vector2(PLANE_SIZE / (width - 1), PLANE_SIZE / (height - 1)) },
                uPeak: { value: 1 },
                uExposure: { value: this.look.exposure },   // fragment stage only
                uHeightScale: { value: this.look.heightScale },
                uKnee: { value: this.look.knee },
                uHeightMode: { value: this.look.heightMode },
                uGamma: { value: this.look.gamma },
                uLightDir: { value: new THREE.Vector3(0, 1, 0) },
                uCameraPos: { value: new THREE.Vector3() },
                uAmbient: { value: this.look.ambient },
                uDiffuse: { value: this.look.diffuse },
                uSpecular: { value: this.look.specular },
                uShininess: { value: this.look.shininess },
                uFade: { value: this.look.fade },
                uGrid: { value: this.look.grid },
                uGridCount: { value: this.look.gridCount },
                uGridWidth: { value: this.look.gridWidth },
                uPixelScale: { value: 1 },
            },
        });

        this.mesh = new THREE.Mesh(geometry, material);
        // The vertex shader displaces, so three's bounding sphere (computed from the flat
        // plane) is wrong and the surface would vanish at some camera angles.
        this.mesh.frustumCulled = false;
        this.scene.add(this.mesh);
        this.applyLook();
    }

    buildFrame() {
        const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 1, 1);
        const material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: frameVertex,
            fragmentShader: frameFragment,
            transparent: true,
            depthWrite: false,
            uniforms: {
                uWallV: { value: 0.5 },
                uWallThickness: { value: 0.03 },
                uSlitSeparation: { value: 0.13 },
                uSlitWidth: { value: 0.022 },
                uLineWidth: { value: this.look.frameWidth },
                uPixelScale: { value: 1 },
                uOpacity: { value: this.look.frameOpacity },
                uWallOpacity: { value: this.look.wallOpacity },
            },
        });
        this.frame = new THREE.Mesh(geometry, material);
        this.frame.frustumCulled = false;
        this.frame.renderOrder = 1;
        // ⚠️ Just *above* the surface floor, not below. The surface is an opaque quad that
        // is merely black where |psi| is zero, so a frame underneath it is hidden
        // everywhere. Sitting a hair above, the lines show across the flat black plain and
        // are correctly occluded wherever the wave rises over them — which is what the
        // reference frame shows happening to the wall line behind the humps.
        this.frame.position.y = this.look.frameHeight;
        this.scene.add(this.frame);
    }

    uploadField(halfFloats) {
        if (!this.texture) return;
        this.texture.image.data.set(halfFloats);
        this.texture.needsUpdate = true;
    }

    setPeak(peak) {
        if (this.mesh) this.mesh.material.uniforms.uPeak.value = peak;
    }

    // Takes the barrier geometry straight from the simulation parameters, so the drawn
    // wall and the simulated one cannot drift apart.
    setWall({ wallDistance, wallThickness, slitSeparation, slitWidth }) {
        const u = this.frame.material.uniforms;
        u.uWallV.value = wallDistance;
        u.uWallThickness.value = wallThickness;
        u.uSlitSeparation.value = slitSeparation;
        u.uSlitWidth.value = slitWidth;
    }

    /* --- look & camera --------------------------------------------------- */

    applyLook() {
        const L = this.look;
        if (this.mesh) {
            const u = this.mesh.material.uniforms;
            u.uExposure.value = L.exposure;
            u.uHeightScale.value = L.heightScale;
            u.uKnee.value = Math.max(L.knee, 1e-6);
            u.uHeightMode.value = L.heightMode;
            u.uGamma.value = L.gamma;
            u.uAmbient.value = L.ambient;
            u.uDiffuse.value = L.diffuse;
            u.uSpecular.value = L.specular;
            u.uShininess.value = L.shininess;
            u.uFade.value = L.fade;
            u.uGrid.value = L.grid;
            u.uGridCount.value = L.gridCount;
            u.uGridWidth.value = L.gridWidth;

            const az = THREE.MathUtils.degToRad(L.lightAzimuth);
            const el = THREE.MathUtils.degToRad(L.lightElevation);
            u.uLightDir.value.set(
                Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
        }
        this.frame.material.uniforms.uOpacity.value = L.frameOpacity;
        this.frame.material.uniforms.uWallOpacity.value = L.wallOpacity;
        this.frame.material.uniforms.uLineWidth.value = L.frameWidth;
        this.frame.position.y = L.frameHeight;
        this.applyCamera();
    }

    applyCamera() {
        const L = this.look;
        this.camera.fov = L.fov;
        this.controls.target.set(0, L.cameraTargetY, 0);

        const az = THREE.MathUtils.degToRad(L.cameraAzimuth);
        const el = THREE.MathUtils.degToRad(L.cameraElevation);
        this.camera.position.set(
            L.cameraDistance * Math.cos(el) * Math.sin(az),
            L.cameraTargetY + L.cameraDistance * Math.sin(el),
            L.cameraDistance * Math.cos(el) * Math.cos(az));
        this.camera.lookAt(this.controls.target);
        this.camera.updateProjectionMatrix();
        this.controls.update();
    }

    // Read the interactively-orbited camera back into `look`, so "lock & save" records
    // what is on screen rather than what was last typed in.
    captureCamera() {
        const p = this.camera.position;
        const t = this.controls.target;
        const d = p.distanceTo(t);
        this.look.cameraDistance = d;
        this.look.cameraTargetY = t.y;
        this.look.cameraElevation = THREE.MathUtils.radToDeg(Math.asin((p.y - t.y) / d));
        this.look.cameraAzimuth = THREE.MathUtils.radToDeg(Math.atan2(p.x - t.x, p.z - t.z));
        return this.look;
    }

    /* --- rendering -------------------------------------------------------- */

    setPixelScale(renderWidth) {
        const scale = renderWidth / PREVIEW_WIDTH;
        if (this.mesh) this.mesh.material.uniforms.uPixelScale.value = scale;
        this.frame.material.uniforms.uPixelScale.value = scale;
    }

    render(width, height) {
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.setPixelScale(width);
        if (this.mesh) this.mesh.material.uniforms.uCameraPos.value.copy(this.camera.position);
        this.renderer.render(this.scene, this.camera);
    }

    // Off-screen render for export. `samples: 0` is deliberate — reading back from a
    // multisampled framebuffer is INVALID_OPERATION, and 2x supersampling is better AA
    // than MSAA here anyway because it antialiases the shading, not just geometry edges.
    ensureTarget(width, height) {
        if (this.target && this.target.width === width && this.target.height === height) {
            return this.target;
        }
        if (this.target) this.target.dispose();
        this.target = new THREE.WebGLRenderTarget(width, height, {
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            depthBuffer: true,
            stencilBuffer: false,
            samples: 0,
            colorSpace: THREE.NoColorSpace,
        });
        this.pixels = new Uint8Array(width * height * 4);
        return this.target;
    }

    renderToPixels(width, height) {
        const target = this.ensureTarget(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.setPixelScale(width);
        if (this.mesh) this.mesh.material.uniforms.uCameraPos.value.copy(this.camera.position);

        this.renderer.setRenderTarget(target);
        this.renderer.render(this.scene, this.camera);
        this.renderer.readRenderTargetPixels(target, 0, 0, width, height, this.pixels);
        this.renderer.setRenderTarget(null);
        // Rows come back bottom-up; ffmpeg's vflip fixes it for free rather than
        // shuffling 20 MB per frame here.
        return this.pixels;
    }
}
