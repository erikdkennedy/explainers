#!/usr/bin/env bash
# Turn out/master.mkv into deliverable mp4s.
#
# The studio writes a *lossless* master so this can be re-run freely — re-tuning a bitrate
# never means re-simulating 240 frames. Emits a small ladder and prints the sizes, because
# 8 s of 1400x900 at 30 fps inside 3 MB is 0.079 bits/pixel, which is tight for a moving
# saturated field and cannot be predicted reliably in advance.
#
#   tools/wavefunction-studio/encode.sh [width] [height] [frames] [gop]
#
# The third argument keeps only the first N frames. ⚠️ That trades the seamless loop for a
# punchier clip: the loop closes only at a full injection period, so cutting early leaves a
# visible jump where the field at the cut does not match the field at frame 0. Deliberate,
# and sometimes the right call — a viewer notices three dead seconds long before they
# notice a single-frame discontinuity. To shorten the clip *without* the jump, raise
# packetsInFlight in step with frames instead (see the note in sim.js).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$HERE/out"
MASTER="$OUT/master.mkv"
W="${1:-1400}"
H="${2:-900}"
LIMIT="${3:-0}"
GOPARG="${4:-0}"

[ -f "$MASTER" ] || { echo "no $MASTER — run an export from the studio first"; exit 1; }

TOTAL=$(ffprobe -v error -count_frames -select_streams v:0 \
    -show_entries stream=nb_read_frames -of csv=p=0 "$MASTER")
if [ "$LIMIT" -gt 0 ] && [ "$LIMIT" -lt "$TOTAL" ]; then
    FRAMES="$LIMIT"
    TRIM=(-frames:v "$LIMIT")
    echo "master: $TOTAL frames, keeping the first $FRAMES (loop seam not preserved)"
else
    FRAMES="$TOTAL"
    TRIM=()
    echo "master: $FRAMES frames"
fi

# zscale (libzimg) rather than swscale: error-diffusion dithering on the RGB->YUV step
# measurably helps the near-black gradients, which is where 8-bit banding shows first.
# The colour metadata is tagged explicitly — untagged non-standard sizes get guessed at,
# and a bt601/bt709 mismatch reads as visibly wrong saturation on this kind of content.
# m=bt709 names the *output* matrix. The master is RGB, so there is exactly one RGB->YUV
# conversion in the whole pipeline and it happens here, tagged, with dithering.
VF="zscale=w=$W:h=$H:f=lanczos:m=bt709:dither=error_diffusion,format=yuv420p"
TAGS=(-color_primaries bt709 -color_trc bt709 -colorspace bt709)
# One GOP for the whole clip by default. Frame 0 is an IDR regardless, and a plain
# autoplay/loop/muted video never seeks, so a single GOP costs nothing and buys 10-20%
# bitrate — which matters against a 3 MB budget.
#
# ⚠️ But that is exactly wrong for a video with `controls`. Every seek decodes forward from
# the previous keyframe, so a single GOP means dragging backwards replays up to the whole
# clip. Measured at 1400x900 / 150 frames / CRF 18: -g 150 -> 2.59 MB, -g 30 -> 2.72 MB,
# -g 15 -> 2.85 MB, -g 5 -> 3.30 MB. 15 is the sweet spot — +10% for a seek that decodes
# at most 14 frames.
if [ "$GOPARG" -gt 0 ]; then
    GOP=(-g "$GOPARG" -keyint_min "$GOPARG" -sc_threshold 0)
    echo "keyframe every $GOPARG frames (scrub-friendly)"
else
    GOP=(-g "$FRAMES" -keyint_min "$FRAMES" -sc_threshold 0)
fi

encode_crf() {
    local crf="$1" out="$OUT/wavefunction-crf$1.mp4"
    ffmpeg -v error -y -i "$MASTER" -vf "$VF" \
        -c:v libx264 -preset veryslow -tune animation -crf "$crf" \
        -profile:v high -level 4.0 "${GOP[@]}" "${TAGS[@]}" "${TRIM[@]}" \
        -fps_mode passthrough -movflags +faststart -an "$out"
    printf '  crf %-3s  %6.2f MB  %s\n' "$crf" "$(bc -l <<< "$(stat -f%z "$out")/1000000")" "$out"
}

encode_target() {
    # Declared separately: referencing ${kbps} inside the same `local` statement that
    # assigns it trips `set -u`.
    local kbps="$1"
    local out="$OUT/wavefunction-${kbps}k.mp4"
    # The GOP settings must be identical in both passes — x264 rejects pass 2 outright
    # with "different keyint setting than first pass" otherwise.
    ffmpeg -v error -y -i "$MASTER" -vf "$VF" -c:v libx264 -preset veryslow \
        -tune animation -b:v "${kbps}k" "${GOP[@]}" "${TRIM[@]}" -pass 1 -an -f null /dev/null 2>/dev/null
    ffmpeg -v error -y -i "$MASTER" -vf "$VF" -c:v libx264 -preset veryslow \
        -tune animation -b:v "${kbps}k" -pass 2 -profile:v high -level 4.0 \
        "${GOP[@]}" "${TAGS[@]}" "${TRIM[@]}" -fps_mode passthrough -movflags +faststart -an "$out"
    printf '  %-6s  %6.2f MB  %s\n' "${kbps}k" "$(bc -l <<< "$(stat -f%z "$out")/1000000")" "$out"
}

cd "$OUT"
echo "encoding ${W}x${H}…"
encode_crf 18
encode_crf 20
encode_crf 23
encode_target 2750
rm -f ffmpeg2pass-0.log ffmpeg2pass-0.log.mbtree

echo
echo "pick one and copy it to src/assets/img/qm/wavefunction-in-3d.mp4"
echo "then check the loop point:  ffprobe -count_frames -select_streams v:0 \\"
echo "    -show_entries stream=nb_read_frames -of csv=p=0 <file>   # must equal $FRAMES"
