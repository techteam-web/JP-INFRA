import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { LOGO_PATHS, LOGO_VIEWBOX } from '../assets/logoPaths'
import { LOGO_LABEL } from './EndgameLogo'

gsap.registerPlugin(DrawSVGPlugin)

const FILL_D = LOGO_PATHS.join('')

// Preloader logo that draws itself: every letter outline is traced like a pen stroke
// (GSAP DrawSVG), sweeping left to right, then the logo fills in solid and the outlines
// settle. Calls onDone once the drawing is complete.
export default function LogoDraw({ className = '', onDone }) {
  const svgRef = useRef(null)
  const onDoneRef = useRef(onDone)

  useLayoutEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return undefined
    const strokes = svg.querySelectorAll('.js-draw-stroke')
    const fill = svg.querySelector('.js-draw-fill')
    const done = () => onDoneRef.current?.()

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(strokes, { opacity: 0 })
      gsap.set(fill, { opacity: 1 })
      done()
      return undefined
    }

    gsap.set(strokes, { drawSVG: '0%' })

    const tl = gsap
      .timeline({ delay: 0.25, onComplete: done })
      .to(strokes, { drawSVG: '100%', duration: 1.5, ease: 'power2.inOut', stagger: { each: 0.04 } })
      .to(fill, { opacity: 1, duration: 0.9, ease: 'power1.inOut' }, '-=0.35')
      .to(strokes, { opacity: 0.25, duration: 0.9, ease: 'power1.inOut' }, '<')

    return () => tl.kill()
  }, [])

  return (
    <svg ref={svgRef} viewBox={LOGO_VIEWBOX} className={`block overflow-visible ${className}`} role="img" aria-label={LOGO_LABEL}>
      <path className="js-draw-fill" d={FILL_D} fill="currentColor" fillRule="evenodd" opacity="0" />
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {LOGO_PATHS.map((d, i) => (
          <path key={i} className="js-draw-stroke" d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  )
}
