// Builds the intro's scroll-scrubbed image sequence from public/video/jp.mp4 into
// public/frames/wide and public/frames/portrait. Re-run after replacing the clip or the
// closing render:
//   node scripts/build-frames.mjs
//
// Why frames and not the video: seeking a <video> costs 15–40 ms a frame and judders, so
// CinematicIntro draws a decoded still to a canvas instead (see src/hooks/useFrameScrub.js).
//
// Wide screens get the full 1920×1080 frame. Portrait screens get a 1080×1080 centre crop —
// same sharpness, a third less weight, and all they ever show is the middle anyway.
//
// The last frame is not taken from the clip: it is public/images/last render.webp, the
// finished render of that same shot. The intro hands off to Home on that exact frame, so it
// has to be the picture Home itself shows — anything else cuts away to a different image.
// After changing it, set FRAME_COUNT in src/components/CinematicIntro.jsx to the count
// printed at the end.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs'

const VIDEO = 'public/video/jp.mp4'
const CLOSER = 'public/images/last render.webp'
const WIDE = 'public/frames/wide'
const PORTRAIT = 'public/frames/portrait'

const WIDE_SIZE = [1920, 1080]
const PORTRAIT_SIZE = [1080, 1080]
const QUALITY = 80 // webp; the sequence streams in while the visitor scrolls, so weight counts

const run = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' })

// scale up until the frame covers the box, then take the middle of it
const cover = ([w, h]) => `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`

function build(dir, size) {
  if (existsSync(dir)) rmSync(dir, { recursive: true })
  mkdirSync(dir, { recursive: true })
  run(['-i', VIDEO, '-vf', cover(size), '-c:v', 'libwebp', '-quality', String(QUALITY),
    '-compression_level', '6', '-start_number', '0', `${dir}/%03d.webp`])

  // the closing frame comes from the render, at a little more quality: it is the one frame
  // that is held on screen while the intro hands over
  const count = readdirSync(dir).length
  const last = String(count - 1).padStart(3, '0')
  run(['-i', CLOSER, '-vf', cover(size), '-c:v', 'libwebp', '-quality', '88',
    '-compression_level', '6', `${dir}/${last}.webp`])
  return count
}

for (const [dir, size] of [[WIDE, WIDE_SIZE], [PORTRAIT, PORTRAIT_SIZE]]) {
  const count = build(dir, size)
  console.log(`${dir}: ${count} frames, ${size.join('×')}, closing frame from ${CLOSER}`)
}
