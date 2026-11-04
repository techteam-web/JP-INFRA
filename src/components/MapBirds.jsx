import { useEffect, useRef } from 'react'

// Birds over the skyline, on a canvas above the map. They never catch the pointer, they
// keep to the sky in the upper part of the view, and they're drawn in a soft navy so they
// read as distance rather than decoration. Still when the page isn't showing, or when the
// viewer asks for less motion.
//
// They travel as flocks: a leader with the rest strung out behind in a loose V, each one
// beating a fraction of a second after the bird ahead, so the flap runs down the line the
// way it does on real birds. Flapping comes in bursts with a glide between.

const FLOCKS = 5
const SKY = 0.5 // how far down the view they're allowed to fly

const rand = (a, b) => a + Math.random() * (b - a)

// One gull in silhouette. Each wing is a fixed tapered shape — broad at the shoulder,
// drawn out to a fine swept tip — swung about the shoulder by the beat, the way a real
// one moves. Bending the outline by the beat instead (the obvious way) collapses the
// wings into spikes at the bottom of the stroke; rotating a shape that keeps its form
// reads as a bird at every point in the cycle, and the span shortens on its own as the
// wings swing. `flap` runs -1 (fully down) to 1 (fully up).
const SWING = 0.95 // radians either side of level

function drawBird(ctx, x, y, s, flap, tilt) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt)

  // Each part is filled on its own. Collecting them into one path and filling once would
  // avoid the overlap at the shoulders reading a shade darker, but mirroring one wing
  // reverses its winding, and the overlaps then cancel into a hole. The darker shoulder
  // is what a body looks like anyway.
  const angle = flap * SWING
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.scale(side, 1) // mirror, so both wings swing together
    ctx.rotate(-angle)
    ctx.beginPath()
    ctx.moveTo(0, -s * 0.11)
    ctx.quadraticCurveTo(s * 0.52, -s * 0.27, s, -s * 0.02) // leading edge, out to the tip
    ctx.quadraticCurveTo(s * 0.46, s * 0.13, 0, s * 0.12) // trailing edge, swept back
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // the body, between the shoulders
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.2, s * 0.09, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function makeFlock(w, h, offscreen) {
  const depth = rand(0.4, 1) // far flocks are smaller, paler and slower
  const size = 4 + depth * 8
  const dir = Math.random() < 0.72 ? 1 : -1
  const count = Math.random() < 0.4 ? 1 : Math.round(rand(3, 6))

  return {
    x: offscreen ? (dir > 0 ? rand(-240, -90) : w + rand(90, 240)) : rand(0, w),
    y: rand(h * 0.05, h * SKY),
    dir,
    depth,
    speed: (11 + depth * 26) * dir,
    bob: rand(0.0005, 0.0013),
    beat: rand(2.1, 3.3), // wingbeats a second
    phase: rand(0, Math.PI * 2),
    glide: rand(0, Math.PI * 2),
    // the leader, then the rest fanned out behind it
    birds: Array.from({ length: count }, (_, i) => ({
      dx: -dir * i * size * rand(1.7, 2.5),
      dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * size * rand(0.7, 1.3),
      lag: i * rand(0.14, 0.28), // seconds behind the bird ahead
      size: size * rand(0.84, 1.12),
    })),
  }
}

export default function MapBirds({ active }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const ctx = canvas.getContext('2d')
    let flocks = []
    let w = 0
    let h = 0

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      flocks = Array.from({ length: FLOCKS }, () => makeFlock(w, h, false))
    }
    size()
    window.addEventListener('resize', size)

    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000) // a slow frame mustn't teleport them
      last = now
      ctx.clearRect(0, 0, w, h)

      for (const f of flocks) {
        f.x += f.speed * dt
        f.phase += f.beat * dt * Math.PI * 2
        // bursts of flapping with a glide in between
        const beating = 0.4 + 0.6 * Math.max(0, Math.sin(now * 0.00035 + f.glide))
        const drift = Math.sin(now * f.bob) * 12
        const tilt = Math.cos(now * f.bob) * 0.09 * f.dir

        ctx.fillStyle = `rgba(13, 35, 60, ${0.2 + f.depth * 0.45})`
        for (const b of f.birds) {
          drawBird(
            ctx,
            f.x + b.dx,
            f.y + b.dy + drift,
            b.size,
            Math.sin(f.phase - b.lag * Math.PI * 2) * beating,
            tilt,
          )
        }

        const tail = f.birds[f.birds.length - 1]
        const lead = f.x + (f.dir > 0 ? 0 : tail.dx)
        const back = f.x + (f.dir > 0 ? tail.dx : 0)
        if ((f.dir > 0 && back > w + 60) || (f.dir < 0 && lead < -60)) {
          Object.assign(f, makeFlock(w, h, true))
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
    }
  }, [active])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden="true" />
}
