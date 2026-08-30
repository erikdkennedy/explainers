# qm-splash

Adds the animation layer to the quantum post's header splash.

```bash
npm run splash                       # re-apply to src/assets/img/qm/qm-splash-lg.svg
npm run splash -- path/to/export.svg # apply to a fresh Figma export
```

**Run this after every re-export from Figma**, or the header goes static. The script is
idempotent — it strips its own previous output first, so re-running is always safe.

## Why a script and not a hand-edit

The splash is consumed as a CSS `background-image`. That loads the SVG in a sandboxed mode:
no scripting inside the file, no access from the page's stylesheet, no access from
`quantum.js`. So the animation has to live inside the SVG as declarative CSS — including the
`prefers-reduced-motion` guard, which is the only one there is, since the site's own
stylesheet cannot reach in.

Which means the animation is hand-written markup living inside a generated file. A re-export
would silently wipe it, so it is re-applied by a script rather than kept by hand. Anchors are
matched on path data (`d="M21.4424 444…"`) rather than on position in the file, and a missing
anchor throws instead of quietly shipping a static splash.

## What it animates

| | Where | How |
|---|---|---|
| 4 blackbody curves | bottom left | sweep in from the left, hold, slide off right; staggered |
| 2 forward-extinction lobes | bottom middle | dashed, marching against each other — the homepage card's effect |
| Bloch state vector | top left | precesses around the equator, with a slow nutation |
| Amplitude spiral | top right | the wave packet turns about its own axis, shadows included |

The dials are custom properties at the top of the injected `<style>` block — durations,
stagger, wobble amplitude, marker size, and the opacity the marker drops to while it is
behind the sphere. Edit them in `animate.mjs` (the `STYLE` template), not in the built SVG,
or the next run overwrites them.

### Two modes, and the shape of a sweep

```js
const SWEEP = {
    bb: { mode: 'sweep', name: 'qmsSweepBB', count: 4, stagger: 0.125, enter: 0.3125, exit: 0.3125, timing: 'linear' },
    fx: { mode: 'march', name: 'qmsMarchFX', count: 2, drawn: 0.8, timing: 'linear' },
};
```

**`march`** is the homepage card's treatment, brought over: the curve stays on the page and a
gap travels around it, and the pair run *opposite* ways — they are the in-phase and
quarter-out-of-phase components, so sending them against each other says so. `drawn` is the
fraction visible at any moment. The offset covers one whole path length per cycle, which with
`pathLength="1"` is exactly 1, so the pattern lands back on itself and the loop is seamless.
The homepage writes two mirrored keyframe sets; one set with `animation-direction: reverse` on
the second curve is the same motion and can't drift out of step with its twin.

⚠ **Do not copy the homepage's absolute `stroke-dasharray: 50px, 50px`.** It is tempting,
because both files draw this artwork at *identical* user-unit scale — each curve measures
1351.2 and 2466.4 units of arc in both — so the value transfers with no conversion, and
rendering the same path with the same dash gives pixel-identical results. It still looks wrong
in the header, and the reason is that **the curve's arc length per unit of visible area varies
enormously**. In the dense oscillating ring, 50 units of arc is a couple of pixels, so the dash
is sub-pixel and the line reads as solid. Out on the radial lobes, 50 units is most of a lobe,
so the same dash chops them into disconnected fragments. The homepage gets away with it only
because its card renders that panel at roughly half the header's size, where the second effect
is too small to resolve; at header size it reads as confetti.

A fraction of the path is immune to that: whatever the local density, the drawn run is always
the same proportion of the curve, so the figure stays coherent and what you see is one gap
sweeping round. It also treats the two curves alike despite their very different lengths,
which the absolute value does not.

**`sweep`** draws a curve on and slides it off. Its *shape* — and the stagger that has to stay
in step with it — can't be custom properties, because a keyframe selector is a literal
percentage and doesn't accept `var()`. So they're fractions of a cycle here, and the
percentages are computed.

`hold` is the pause drawn-and-waiting-to-leave; the gap — whatever the parts don't spend — is
the pause gone-and-waiting-to-return. **Leave `hold` out and it is derived as
`(count - 1) * stagger`**, which is the value that puts a family in lock-step: the instant the
last curve finishes entering is the instant the first begins to leave. Spend the rest of the
cycle on enter and exit and there's no gap either, so the loop runs continuously — in, out, in
— with nothing standing still. That's what the blackbody family does, and it's the only family
in `sweep` mode at the moment; give `hold` a value to break the lock-step deliberately.

The stagger had to move out of CSS for that reason alone: CSS could hold it, but the hold could
never be written in terms of it, so the two would fall out of step the first time either was
tuned. Cycle length stays in CSS; choreography lives here.

`enter` relative to `stagger` sets how sequential it reads — at `enter == stagger` each curve
finishes just as the next starts, and larger values cascade them into a wave. Blackbody runs
`linear` on purpose: an eased draw makes each line rush its middle and creep at both ends,
which blurs the beat the stagger is establishing.

Overspending a cycle throws. Stops that collide on one percentage (a zero hold, a zero gap) are
collapsed — duplicates are legal CSS and render fine, but they read as a mistake in a file
meant to be tuned by hand. `count` is checked against the class list, since disagreeing would
show up as one curve that never moves rather than as an error.

## The amplitude spiral

The top-right panel is a complex wave packet in 3-D: 108 white beads on a helix around the
x axis, plus its two shadows — 108 grey beads on the Re plane and 108 on the Im plane.
Rotating the helix is a phase rotation, so the shadows have to move too: freeze them and the
picture contradicts itself. Both come out of one construction.

The 3-D structure is recovered at inject time, never written down, so a re-export with
different studio settings re-derives itself. It recovers exactly — the figure was plotted, not
drawn — and the numbers are reported on every run: 16.984 beads per cycle against the studio's
17, an Im/Re scale of 0.908, a phase-linearity RMS of **0.0125u**, and a rest error of
**0.0000u**, meaning the construction reproduces every one of the 324 beads' own pixels.

Three traps, each of which cost a round trip:

- ⚠ **Order the chain by each bead's point on the axis, not by the bead.** The helix swings
  ±26u, so projecting the beads themselves onto the axis is not monotone and interleaves the
  chain.
- ⚠ **Refine the projection direction against the pairing it produces.** One pass off the angle
  histogram lands within 0.02°, which is not enough: where the packet is widest, a hundredth of
  a degree flips which shadow wins. A wrong shadow gives a bead the wrong component, which moves
  its point on the axis, which re-sorts it — so runs of the chain come out shifted by one and
  the fit sits at 2.9u instead of 0.03u, looking nothing like a pairing fault.
- ⚠ **Do not search the Im/Re scale ratio.** The residual is linear in (rho, b0, rho·a0), so all
  three solve exactly for a given phase. Searching rho alongside the phase parks the fit in a
  false minimum.

The studio's own defaults were a useful prior but not the answer: the export used an Im/Re
scale of 0.908 where the panel reads 1.00, and plane offsets in a different ratio to its
184:220. Anything read off that panel is a starting point, not a spec.

## Re-rooting the extinction loop

A `sweep` grows from wherever the path's `M` is. Figma seams the black extinction curve just
right of the plot's origin, so it grew out of the middle of the picture. It is a *closed*
all-cubic path, so rotating its segment list moves the seam to the leftmost vertex without
altering the shape at all — verified as **0 changed pixels** in that panel against the
un-rerooted render. Its grey partner already begins at `x = 400`, so only the black one is
touched.

Now that the extinction pair *marches* rather than sweeps this is inert — a marching dash has
no growth direction, and moving the seam only shifts where the dashes sit along a periodic
pattern. It is kept because it costs nothing, is proven pixel-identical, and is needed again
the moment that family goes back to `sweep`.

Segments are carried as verbatim text rather than reparsed and reprinted, which keeps every
coordinate byte-identical. That is what makes the operation idempotent, and it is why the
anchor for that curve is an *interior* segment rather than its `M` — re-rooting moves the `M`,
so matching on it would fail the second time round.

## Geometry

The Bloch orbit is solved, not measured by hand. The sphere's outline is four bezier arcs, so
its on-curve points give centre `(94, 106)` and radius `80.098` exactly; the equator's
y-radius is read off the dashed ellipse and comes back as `1/√3` of the x-radius — a true
35.26° isometric tilt. If Figma moves the sphere, the script picks the new numbers up.
