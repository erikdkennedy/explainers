// Static server for the studio plus the export sink.
//
// Frames arrive as raw RGBA and go straight into a long-lived ffmpeg on stdin — no PNG
// encoding (50-150 ms/frame of deflate at 2800x1800) and no gigabyte of intermediates on
// disk. What ffmpeg writes is a *lossless master*; encode.sh makes deliverables from it,
// so re-tuning a bitrate never means re-simulating 240 frames.
//
//   node tools/wavefunction-studio/serve.mjs      ->  http://127.0.0.1:8123

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.join(HERE, 'out');
// Every client call uses a relative URL, so the port is free to move.
const PORT = Number(process.env.PORT) || 8123;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',   // wrong MIME here => strict-MIME module
    '.mjs': 'text/javascript; charset=utf-8',  // rejection, reported as an opaque
    '.json': 'application/json; charset=utf-8',// "failed to load module script"
    '.css': 'text/css; charset=utf-8',
};

let encoder = null;
// Last finished export, so a script can poll for completion. Driving a long export from
// headless Brave needs this: --virtual-time-budget fast-forwards timers but does not wait
// for CPU-bound work, so the browser exits long before the render loop is done.
let lastExport = null;

/* ============================================================================
   UTILITY
   ============================================================================ */

function send(res, status, body, type = 'text/plain; charset=utf-8') {
    // No caching, ever. Edit a shader, reload, see the change — a stale cached module
    // otherwise shows up as an error pointing at a line you have already fixed.
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

function serveFile(res, filePath) {
    fs.readFile(filePath, (error, data) => {
        if (error) return send(res, 404, 'not found');
        send(res, 200, data, TYPES[path.extname(filePath)] || 'application/octet-stream');
    });
}

/* ============================================================================
   EXPORT SINK
   ============================================================================ */

function startEncoder({ width, height, fps }) {
    fs.mkdirSync(OUT, { recursive: true });
    const master = path.join(OUT, 'master.mkv');

    const args = [
        '-y',
        '-f', 'rawvideo', '-pixel_format', 'rgba',
        '-video_size', `${width}x${height}`, '-framerate', String(fps),
        '-i', 'pipe:0',
        // readRenderTargetPixels hands back rows bottom-up; flipping here is free,
        // where flipping 20 MB per frame in JS would not be.
        '-vf', 'vflip',
        // ⚠️ Lossless *RGB*, not YUV, and ffv1 rather than x264. A yuv444p master carries
        // no colour tags, so zscale later fails with "no path between colorspaces", and it
        // would put two separate RGB->YUV conversions in one pipeline. Staying in RGB
        // until the single tagged conversion in encode.sh is simpler and better. It has to
        // be ffv1 because this build of libx264 has no RGB output colourspace (check with
        // `ffmpeg -h encoder=libx264 | grep -A2 "Supported pixel formats"`); asking x264
        // for gbrp silently gives you yuv444p back.
        // Measured 25 ms/frame at 2800x1800 — comfortably ahead of the simulation.
        '-c:v', 'ffv1', '-level', '3', '-coder', '1', '-context', '0', '-g', '1',
        '-threads', '8', '-pix_fmt', 'gbrp',
        '-fps_mode', 'passthrough',
        master,
    ];

    const child = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString().slice(-2000); });
    child.on('error', (e) => { console.error('ffmpeg failed to start:', e.message); });

    encoder = { child, master, frames: 0, width, height, fps, get stderr() { return stderr; } };
    return encoder;
}

async function writeFrame(buffer) {
    if (!encoder) throw new Error('no export in progress');
    if (buffer.length !== encoder.width * encoder.height * 4) {
        throw new Error(`frame is ${buffer.length} bytes, expected `
            + `${encoder.width * encoder.height * 4}`);
    }
    // Honour backpressure or node's heap balloons while ffmpeg falls behind.
    if (!encoder.child.stdin.write(buffer)) {
        await once(encoder.child.stdin, 'drain');
    }
    encoder.frames++;
}

async function finishEncoder() {
    if (!encoder) throw new Error('no export in progress');
    const active = encoder;
    encoder = null;

    active.child.stdin.end();
    const [code] = await once(active.child, 'close');
    if (code !== 0) throw new Error(`ffmpeg exited ${code}\n${active.stderr}`);
    const { size } = fs.statSync(active.master);
    lastExport = { master: active.master, frames: active.frames, bytes: size };
    return lastExport;
}

/* ============================================================================
   ROUTES
   ============================================================================ */

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const route = url.pathname;

    try {
        if (req.method === 'POST') {
            if (route === '/export/start') {
                const config = JSON.parse((await readBody(req)).toString());
                startEncoder(config);
                return send(res, 200, JSON.stringify({ ok: true }), TYPES['.json']);
            }
            if (route === '/export/frame') {
                await writeFrame(await readBody(req));
                return send(res, 200, JSON.stringify({ frames: encoder.frames }), TYPES['.json']);
            }
            if (route === '/export/end') {
                const result = await finishEncoder();
                return send(res, 200, JSON.stringify(result), TYPES['.json']);
            }
            if (route === '/params') {
                const body = (await readBody(req)).toString();
                fs.writeFileSync(path.join(HERE, 'params.json'), body);
                return send(res, 200, JSON.stringify({ ok: true }), TYPES['.json']);
            }
            return send(res, 404, 'not found');
        }

        if (route === '/export/status') {
            return send(res, 200, JSON.stringify({
                running: !!encoder,
                frames: encoder ? encoder.frames : 0,
                last: lastExport,
            }), TYPES['.json']);
        }

        // three is served straight out of node_modules so the version the studio runs is
        // exactly the one package.json pins.
        if (route.startsWith('/vendor/three/')) {
            const rel = route.slice('/vendor/three/'.length);
            const target = path.join(ROOT, 'node_modules/three', rel);
            if (!target.startsWith(path.join(ROOT, 'node_modules/three'))) {
                return send(res, 403, 'forbidden');
            }
            return serveFile(res, target);
        }

        const name = route === '/' ? 'index.html' : route.slice(1);
        const target = path.join(HERE, name);
        if (!target.startsWith(HERE)) return send(res, 403, 'forbidden');
        return serveFile(res, target);
    } catch (error) {
        console.error(error);
        send(res, 500, error.message);
    }
});

// Bound to loopback explicitly: this writes to the filesystem and spawns ffmpeg.
server.listen(PORT, '127.0.0.1', () => {
    console.log(`wavefunction studio  ->  http://127.0.0.1:${PORT}`);
});
