// GLSL for the height-field surface and the ground frame.
//
// RawShaderMaterial + GLSL3 throughout, deliberately: three's ShaderMaterial chunk
// injection and colourspace machinery are the source of most of the silent-failure modes
// here, and none of it is wanted. GLSL3 buys texelFetch and gl_VertexID, both of which
// are load-bearing below.
//
// The colour law is copied from paintDoubleSlitField() in src/assets/js/quantum.js and
// must stay identical to it — the reader meets the flat canvas widget first, and the two
// figures have to read as the same physics. Phase 0 is cyan; the wheel runs
// cyan -> blue -> magenta -> red -> yellow -> green.

export const surfaceVertex = /* glsl */ `
precision highp float;
precision highp sampler2D;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

uniform sampler2D uField;
uniform ivec2 uFieldSize;
uniform vec2 uPlaneSize;    // world extent (x, z)
uniform vec2 uCell;         // world size of one cell, for the height gradient
uniform float uPeak;        // clip-wide peak |psi|, fixed for the whole loop
uniform float uHeightScale;
uniform float uKnee;
uniform int uHeightMode;    // 0 = probability |psi|^2, 1 = amplitude |psi|

in vec3 position;

out vec2 vFieldUv;
out vec3 vNormal;
out vec3 vWorldPos;

// ⚠️ texelFetch is undefined out of range — it does not clamp. Unclamped border reads
// give garbage normals along all four edges.
// ⚠️ Deliberately *not* exposure-scaled, unlike the colour path. The transmitted field is
// ~0.6% of the incident packet, so a gain big enough to lift it would clamp the packet
// across ~3 sigma of its width and turn the hill into a flat-topped mesa. Height gets its
// whole dynamic range from uKnee instead, which compresses logarithmically and leaves the
// peak a dome. That is why uKnee's control is a log slider reaching down to 1e-5.
float magnitudeAt(ivec2 c) {
    c = clamp(c, ivec2(0), uFieldSize - ivec2(1));
    vec2 psi = texelFetch(uField, c, 0).rg;
    float m = length(psi) / max(uPeak, 1e-20);
    return uHeightMode == 0 ? m * m : m;
}

// asinh, not a power law and not Reinhard. Reinhard asymptotes, which turns every peak
// into a flat-topped plateau; asinh keeps rising, so peaks stay domes. uKnee is
// effectively the hump-width control: the dome's footprint is where mag > uKnee.
float heightOf(float mag) {
    return uHeightScale * asinh(mag / uKnee) / asinh(1.0 / uKnee);
}

void main() {
    // Texels map 1:1 to vertices, so fetch by index. Sampling by the plane's own uv is a
    // trap: uv runs 0..1 inclusive while texel centres sit at (i+0.5)/N, which duplicates
    // one texel and skips another — a one-cell shear that is invisible until you look for it.
    ivec2 c = ivec2(gl_VertexID % uFieldSize.x, gl_VertexID / uFieldSize.x);
    vFieldUv = (vec2(c) + 0.5) / vec2(uFieldSize);

    float h  = heightOf(magnitudeAt(c));
    float hL = heightOf(magnitudeAt(c + ivec2(-1, 0)));
    float hR = heightOf(magnitudeAt(c + ivec2( 1, 0)));
    float hD = heightOf(magnitudeAt(c + ivec2(0, -1)));
    float hU = heightOf(magnitudeAt(c + ivec2(0,  1)));

    // Height-field normal. The literal 1.0 keeps the vector's length >= 1, so normalize()
    // can never produce NaN, and a flat black region correctly yields straight up.
    // Gradients must use *world* cell spacing, not texel spacing, or the shading inverts
    // as uHeightScale changes.
    float dhdx = (hR - hL) / (2.0 * uCell.x);
    float dhdz = (hU - hD) / (2.0 * uCell.y);
    vNormal = normalize(vec3(-dhdx, 1.0, -dhdz));

    // The geometry is a flat XY plane; the mapping to world is done here rather than by
    // rotating the geometry, so the axis convention is stated once and visibly.
    // Field row 0 (the source end) lands at -Z, i.e. furthest from a camera on +Z.
    vWorldPos = vec3(position.x, h, -position.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vWorldPos, 1.0);
}
`;

export const surfaceFragment = /* glsl */ `
precision highp float;
precision highp sampler2D;

uniform sampler2D uField;
uniform float uPeak;
uniform float uExposure;
uniform float uGamma;        // DS_GAMMA in quantum.js — keep at 0.6

uniform vec3 uLightDir;      // world space
uniform vec3 uCameraPos;     // world space
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uShininess;

uniform float uFade;         // fraction of the far end that fades out; 0 disables
uniform float uGrid;         // 0 = off
uniform float uGridCount;
uniform float uGridWidth;    // pixels, at 1x
uniform float uPixelScale;   // renderWidth / previewWidth, so export lines match preview

in vec2 vFieldUv;
in vec3 vNormal;
in vec3 vWorldPos;

out vec4 fragColor;

const float TAU = 6.283185307179586;

// Exactly the six-case switch in paintDoubleSlitField(): saturation is pinned at 1, so
// there is no s term. Do not "simplify" this into a library hsv2rgb — the point is that
// it is the same arithmetic as the canvas widget.
vec3 phaseColour(float value, float hue6) {
    int sector = int(mod(floor(hue6), 6.0));
    float f = fract(hue6);
    float rising = value * f;
    float falling = value * (1.0 - f);
    if (sector == 0) return vec3(value, rising, 0.0);
    if (sector == 1) return vec3(falling, value, 0.0);
    if (sector == 2) return vec3(0.0, value, rising);
    if (sector == 3) return vec3(0.0, falling, value);
    if (sector == 4) return vec3(rising, 0.0, value);
    return vec3(value, 0.0, falling);
}

// Cheap hash for the dither. Smooth gradients on black band badly at 8 bits, and every
// codec then turns the bands into blocking, so this is worth its one line.
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // Sampled per fragment, not interpolated from the vertex stage. Phase wraps every
    // wavelength, so interpolating hue between a vertex at 350 degrees and one at 10
    // runs backwards through the entire colour wheel — a rainbow smear on every fringe.
    // Interpolating re/im and taking atan2 here has no such discontinuity.
    vec2 psi = texture(uField, vFieldUv).rg;

    float mag = uExposure * length(psi) / max(uPeak, 1e-20);
    // Clamped *before* the colour lookup, so an over-exposed region saturates to a fully
    // bright hue rather than washing out to white. Clipping the rgb triple afterwards
    // would destroy the hue, and the hue is the data.
    float value = pow(clamp(mag, 1e-8, 1.0), uGamma);
    float hue6 = fract(atan(psi.y, psi.x) / TAU + 0.5) * 6.0;
    vec3 colour = phaseColour(value, hue6);

    vec3 n = normalize(vNormal);
    vec3 v = normalize(uCameraPos - vWorldPos);
    vec3 l = normalize(uLightDir);
    float lambert = max(dot(n, l), 0.0);
    float spec = pow(max(dot(n, normalize(l + v)), 0.0), uShininess);

    // ⚠️ Additive, not multiplicative. Multiplying by the lambert term kills the neon
    // everywhere the surface faces away, and the hue *is* the data.
    colour = colour * (uAmbient + uDiffuse * lambert) + value * uSpecular * spec;

    if (uGrid > 0.5) {
        vec2 g = vFieldUv * uGridCount;
        vec2 d = abs(fract(g - 0.5) - 0.5) / fwidth(g);   // distance to a line, in pixels
        float line = 1.0 - smoothstep(0.0, uGridWidth * uPixelScale, min(d.x, d.y));
        colour = mix(colour, vec3(1.0), line * 0.28);
    }

    // The far rows compress into sub-pixel frequencies no amount of supersampling fixes,
    // and a hard edge there reads as a cut-off rectangle rather than an open plain.
    if (uFade > 0.0) {
        colour *= smoothstep(0.0, uFade, vFieldUv.y);
    }

    colour += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    fragColor = vec4(colour, 1.0);
}
`;

/* ============================================================================
   Ground frame — the thin white lines that bound the plane and mark the wall
   ============================================================================
   Drawn in a shader on a single quad rather than as line geometry, because WebGL
   ignores linewidth > 1 on every platform and Line2 would need its own resolution
   plumbing. fwidth gives constant *screen* width for free, which is what the
   reference has. */

export const frameVertex = /* glsl */ `
precision highp float;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
    // v is flipped so it matches vFieldUv in the surface shader: v = 0 is the source end
    // of the domain. Without this, uWallV would have to be passed as 1 - wallDistance,
    // and the wall line would sit mirrored about the middle — which still looks plausible.
    vUv = vec2(uv.x, 1.0 - uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, 0.0, -position.y, 1.0);
}
`;

export const frameFragment = /* glsl */ `
precision highp float;
uniform float uWallV;         // wall centre along the plane, 0..1
uniform float uWallThickness; // domain units, matching the barrier in the simulation
uniform float uSlitSeparation;
uniform float uSlitWidth;
uniform float uLineWidth;     // pixels, at 1x
uniform float uPixelScale;
uniform float uOpacity;
uniform float uWallOpacity;
in vec2 vUv;
out vec4 fragColor;
void main() {
    vec2 fw = fwidth(vUv);

    // Outer border of the ground plane.
    float border = min(min(vUv.x, 1.0 - vUv.x) / fw.x, min(vUv.y, 1.0 - vUv.y) / fw.y);
    float borderAlpha = 1.0 - smoothstep(0.0, uLineWidth * uPixelScale, border);

    // The barrier, drawn as a filled band at its *real* thickness rather than a hairline,
    // ⚠️ with the two slits cut out of it. Drawing an unbroken line here was a bug worth
    // remembering: the simulation had slits all along, but the annotation did not, so the
    // wall read as solid and the whole figure looked wrong for a reason that had nothing
    // to do with the physics.
    float band = 1.0 - clamp((abs(vUv.y - uWallV) - uWallThickness * 0.5) / fw.y, 0.0, 1.0);

    // Domain x is vUv.x - 0.5; slits sit at +/- separation/2, each slitWidth across.
    float fromSlit = abs(abs(vUv.x - 0.5) - uSlitSeparation * 0.5) - uSlitWidth * 0.5;
    float solid = clamp(fromSlit / fw.x, 0.0, 1.0);   // 0 inside a slit, 1 in the wall

    float a = max(borderAlpha * uOpacity, band * solid * uWallOpacity);
    if (a <= 0.002) discard;
    fragColor = vec4(vec3(1.0), a);
}
`;
