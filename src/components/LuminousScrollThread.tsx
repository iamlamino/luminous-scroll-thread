import React, { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Particle {
  dx: number; dy: number; r: number; color: string; dur: number;
}
interface Burst {
  id: number; x: number; y: number; particles: Particle[];
}
interface SplashState {
  id: number; x: number; y: number;
  rings: Array<{ maxR: number; delay: number; color: string }>;
  particles: Particle[];
}

// ─── Path builder ─────────────────────────────────────────────────────────────
function buildPath(W: number, H: number): string {
  if (W < 10 || H < 200) return '';
  const cx = W / 2;
  const sw = Math.min(W * 0.27, 310);
  const L  = Math.max(48, cx - sw);
  const R  = Math.min(W - 48, cx + sw);
  return [
    `M ${cx} 0`,
    `C ${cx} ${H * 0.033}, ${L * 0.92} ${H * 0.053}, ${L} ${H * 0.092}`,
    `S ${R} ${H * 0.172}, ${R} ${H * 0.222}`,
    `S ${cx} ${H * 0.272}, ${cx} ${H * 0.312}`,
    `S ${L * 0.86} ${H * 0.392}, ${L * 0.86} ${H * 0.438}`,
    `S ${R * 1.04} ${H * 0.518}, ${R * 1.04} ${H * 0.562}`,
    `S ${cx} ${H * 0.615}, ${cx} ${H * 0.652}`,
    `S ${L * 0.9}  ${H * 0.728}, ${L * 0.9}  ${H * 0.768}`,
    `S ${R * 0.96} ${H * 0.843}, ${R * 0.96} ${H * 0.882}`,
    `S ${cx} ${H * 0.944}, ${cx} ${H}`,
  ].join(' ');
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LuminousScrollThreadProps {
  /** IDs of section elements that trigger particle bursts on intersection. */
  sectionIds?: string[];
  /** Colour stops for the thread gradient. Each entry: ['offset%', 'color']. */
  gradientStops?: Array<[string, string]>;
  /** Colours used for burst and splash particles. */
  particleColors?: string[];
  /**
   * Page-fraction bands where the thread dims to simulate depth behind cards.
   * Each zone: [yStart, yEnd] as fractions of page height (0–1).
   * @default [[0.17, 0.25], [0.38, 0.46], [0.59, 0.67]]
   */
  depthZones?: Array<[number, number]>;
  /** Show the bottom splash (ripple rings + particles) when the thread reaches the end. */
  splash?: boolean;
  /** z-index of the SVG layer. @default 0 */
  zIndex?: number;
  /**
   * Hue rotation applied to the entire thread at full scroll (degrees).
   * 0 = no colour shift, 180 = full complementary shift.
   * @default 180
   */
  hueShift?: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_GRADIENT: Array<[string, string]> = [
  ['0%',   '#38bdf8'],
  ['20%',  '#06b6d4'],
  ['45%',  '#818cf8'],
  ['65%',  '#a855f7'],
  ['82%',  '#e879f9'],
  ['100%', '#67e8f9'],
];
const DEFAULT_BLOOM_GRADIENT: Array<[string, string]> = [
  ['0%',   'rgba(56,189,248,0.12)'],
  ['45%',  'rgba(99,102,241,0.16)'],
  ['75%',  'rgba(168,85,247,0.16)'],
  ['100%', 'rgba(6,182,212,0.12)'],
];
const DEFAULT_PARTICLE_COLORS = ['#67e8f9', '#a5b4fc', '#06b6d4', '#38bdf8', '#818cf8', '#e0f2fe'];
const DEFAULT_DEPTH_ZONES: Array<[number, number]> = [[0.17, 0.25], [0.38, 0.46], [0.59, 0.67]];

// ─── Component ────────────────────────────────────────────────────────────────

const LuminousScrollThread: React.FC<LuminousScrollThreadProps> = ({
  sectionIds     = [],
  gradientStops  = DEFAULT_GRADIENT,
  particleColors = DEFAULT_PARTICLE_COLORS,
  depthZones     = DEFAULT_DEPTH_ZONES,
  splash: showSplash = true,
  zIndex         = 0,
  hueShift       = 180,
}) => {
  // scrollProgress is NOT React state — all per-frame animation is pure RAF
  const [dims, setDims]             = useState({ w: 1200, h: 6000 });
  const [pathLen, setPathLen]       = useState(0);
  const [activeBounds, setActiveBounds] = useState<{ top: number; height: number } | null>(null);
  const [bursts, setBursts]         = useState<Burst[]>([]);
  const [splash, setSplash]         = useState<SplashState | null>(null);

  const pathRef       = useRef<SVGPathElement>(null);
  const bloomRef      = useRef<SVGPathElement>(null);
  const activePathRef = useRef<SVGPathElement>(null);
  const svgRef        = useRef<SVGSVGElement>(null);
  const pathLenRef    = useRef(0);
  const scrollRef     = useRef(0);
  const dimsRef       = useRef({ w: 1200, h: 6000 });
  const p1Ref         = useRef<SVGCircleElement>(null);
  const p2Ref         = useRef<SVGCircleElement>(null);
  const p3Ref         = useRef<SVGCircleElement>(null);
  const rafRef        = useRef(0);
  const burstId       = useRef(0);
  const prevSection   = useRef<string | null>(null);
  const splashId      = useRef(0);
  const splashFired   = useRef(false);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const pulses = useRef([
    { t: 0.018, speed: 0.00058 },
    { t: 0.370, speed: 0.00042 },
    { t: 0.710, speed: 0.00072 },
  ]);

  // ── Unique ID prefix (supports multiple instances on same page) ──────────────
  const uid = useRef(Math.random().toString(36).slice(2)).current;

  // ── Measure page dimensions ──────────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      const next = { w: window.innerWidth, h: document.documentElement.scrollHeight };
      dimsRef.current = next;
      setDims(next);
    };
    const timer = setTimeout(measure, 100);
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, []);

  // ── SVG path length ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    pathLenRef.current = len;
    setPathLen(len);
  }, [dims]);

  // ── Scroll — only updates ref, zero React state changes ─────────────────────
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Section activation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (sectionIds.length === 0) return;
    const obs = new IntersectionObserver(entries => {
      const hit = entries.find(e => e.isIntersecting);
      if (!hit) return;
      const id = hit.target.id;
      const el = document.getElementById(id);
      if (!el) return;

      const r = el.getBoundingClientRect();
      setActiveBounds({ top: window.scrollY + r.top, height: r.height });

      if (id === prevSection.current) return;
      prevSection.current = id;

      if (reducedMotion.current || !pathRef.current || pathLenRef.current === 0) return;

      const midY  = window.scrollY + r.top + r.height / 2;
      const normY = Math.min(1, Math.max(0, midY / dimsRef.current.h));
      const pt    = pathRef.current.getPointAtLength(normY * pathLenRef.current);
      const particles = Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
        const dist  = 18 + Math.random() * 36;
        return {
          dx:    Math.cos(angle) * dist,
          dy:    Math.sin(angle) * dist,
          r:     1.2 + Math.random() * 1.8,
          color: particleColors[i % particleColors.length],
          dur:   0.6 + Math.random() * 0.5,
        };
      });

      const bid = burstId.current++;
      setBursts(prev => [...prev.slice(-2), { id: bid, x: pt.x, y: pt.y, particles }]);
      setTimeout(() => setBursts(prev => prev.filter(b => b.id !== bid)), 1400);
    }, { threshold: 0.25 });

    sectionIds.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.h, sectionIds.join(',')]);

  // ── RAF — ALL per-frame animation, zero React re-renders ────────────────────
  useEffect(() => {
    const pRefs = [p1Ref, p2Ref, p3Ref];

    const tick = () => {
      const path = pathRef.current;
      const len  = pathLenRef.current;
      const prog = scrollRef.current;

      // strokeDashoffset — direct DOM, no React
      if (len > 0) {
        const visibleProg = Math.max(prog, 0.03); // always show first 3%
        const dashOff     = String(len * (1 - visibleProg));
        pathRef.current?.setAttribute('stroke-dashoffset', dashOff);
        bloomRef.current?.setAttribute('stroke-dashoffset', dashOff);
        activePathRef.current?.setAttribute('stroke-dashoffset', dashOff);
      }

      // Hue-rotate: colour shifts as user scrolls
      if (svgRef.current) {
        svgRef.current.style.filter = `hue-rotate(${prog * hueShift}deg)`;
      }

      // Splash trigger
      if (showSplash && !reducedMotion.current && len > 0) {
        if (prog < 0.82) {
          splashFired.current = false;
        } else if (prog >= 0.92 && !splashFired.current) {
          splashFired.current = true;
          const cx = dimsRef.current.w / 2;
          const sy = window.innerHeight - 80;
          const rings = [
            { maxR: 55,  delay: 0,    color: particleColors[2] ?? '#06b6d4' },
            { maxR: 90,  delay: 0.18, color: particleColors[3] ?? '#38bdf8' },
            { maxR: 130, delay: 0.34, color: particleColors[4] ?? '#818cf8' },
          ];
          const particles: Particle[] = Array.from({ length: 12 }, (_, i) => {
            const angle = (-Math.PI * 0.85) + (i / 11) * Math.PI * 0.70 + (Math.random() - 0.5) * 0.25;
            const dist  = 28 + Math.random() * 58;
            return {
              dx:    Math.cos(angle) * dist,
              dy:    Math.sin(angle) * dist,
              r:     1.4 + Math.random() * 2.2,
              color: particleColors[i % particleColors.length],
              dur:   0.75 + Math.random() * 0.65,
            };
          });
          const id = splashId.current++;
          setSplash({ id, x: cx, y: sy, rings, particles });
          setTimeout(() => setSplash(null), 2200);
        }
      }

      // Moving pulses
      if (!reducedMotion.current && path && len > 0 && prog > 0.008) {
        pulses.current.forEach((p, i) => {
          p.t += p.speed;
          if (p.t > prog) p.t = Math.max(0, prog * Math.random() * 0.15);
          const pt = path.getPointAtLength(p.t * len);
          const el = pRefs[i].current;
          if (el) {
            el.setAttribute('cx', String(pt.x));
            el.setAttribute('cy', String(pt.y));
            const fadeIn  = Math.min(1, p.t / 0.04);
            const fadeOut = Math.min(1, (prog - p.t) / 0.025);
            const breath  = 0.55 + Math.sin(Date.now() * 0.0015 + i * 2.2) * 0.38;
            el.style.opacity = String(Math.max(0, fadeIn * fadeOut * breath));
          }
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hueShift, showSplash]);

  // ── Render ───────────────────────────────────────────────────────────────────
  const { w, h } = dims;
  const pathD    = buildPath(w, h);
  const fallback = 10000;
  const mobile   = w < 480;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: dims.h > 0 ? dims.h : '100%',
        pointerEvents: 'none', overflow: 'visible',
        zIndex,
      }}
    >
      <svg
        ref={svgRef}
        width={w} height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
      >
        <defs>
          <filter id={`lst-soft-${uid}`} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`lst-strong-${uid}`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4"  result="b2" />
            <feMerge>
              <feMergeNode in="b1" />
              <feMergeNode in="b2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`lst-pulse-${uid}`} x="-400%" y="-400%" width="900%" height="900%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`lst-particle-${uid}`} x="-400%" y="-400%" width="900%" height="900%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          <linearGradient id={`lst-grad-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
            {gradientStops.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
          <linearGradient id={`lst-bloom-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
            {DEFAULT_BLOOM_GRADIENT.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>

          {depthZones.map(([ys, ye], i) => (
            <linearGradient key={i} id={`lst-dfade-${uid}-${i}`}
              gradientUnits="userSpaceOnUse" x1="0" y1={h * ys} x2="0" y2={h * ye}>
              <stop offset="0%"   stopColor="white" />
              <stop offset="25%"  stopColor="#505050" />
              <stop offset="75%"  stopColor="#505050" />
              <stop offset="100%" stopColor="white" />
            </linearGradient>
          ))}

          <mask id={`lst-mask-${uid}`}>
            <rect x="0" y="0" width={w} height={h} fill="white" />
            {depthZones.map(([ys, ye], i) => (
              <rect key={i} x="0" y={h * ys} width={w} height={h * (ye - ys)}
                fill={`url(#lst-dfade-${uid}-${i})`} />
            ))}
          </mask>

          {activeBounds && (
            <clipPath id={`lst-active-${uid}`}>
              <rect x={0} y={activeBounds.top - 120} width={w} height={activeBounds.height + 240} />
            </clipPath>
          )}
        </defs>

        {/* Ghost trace */}
        <path d={pathD} fill="none" stroke="rgba(6,182,212,0.05)" strokeWidth={mobile ? 1 : 1.5} />

        {/* Bloom halo — strokeDashoffset set by RAF */}
        <path
          ref={bloomRef}
          d={pathD} fill="none"
          stroke={`url(#lst-bloom-${uid})`}
          strokeWidth={mobile ? 7 : 11} strokeLinecap="round"
          strokeDasharray={pathLen || fallback}
          style={{ filter: 'blur(10px)' }}
        />

        {/* Core thread — strokeDashoffset set by RAF */}
        <path
          ref={pathRef}
          d={pathD} fill="none"
          stroke={`url(#lst-grad-${uid})`}
          strokeWidth={mobile ? 1.2 : 1.8} strokeLinecap="round"
          strokeDasharray={pathLen || fallback}
          filter={`url(#lst-soft-${uid})`}
          mask={`url(#lst-mask-${uid})`}
        />

        {/* Active section brightening — strokeDashoffset set by RAF */}
        {activeBounds && pathLen > 0 && (
          <path
            ref={activePathRef}
            d={pathD} fill="none"
            stroke="rgba(103,232,249,0.85)"
            strokeWidth={mobile ? 1.5 : 2.2} strokeLinecap="round"
            strokeDasharray={pathLen}
            clipPath={`url(#lst-active-${uid})`}
            filter={`url(#lst-strong-${uid})`}
          />
        )}

        {/* Moving light pulses */}
        <circle ref={p1Ref} cx={w/2} cy={-30} r={mobile ? 2.8 : 3.5} fill="#67e8f9" filter={`url(#lst-pulse-${uid})`} opacity={0} />
        <circle ref={p2Ref} cx={w/2} cy={-30} r={mobile ? 2   : 2.8} fill="#a5b4fc" filter={`url(#lst-pulse-${uid})`} opacity={0} />
        <circle ref={p3Ref} cx={w/2} cy={-30} r={mobile ? 1.5 : 2  } fill="#06b6d4" filter={`url(#lst-pulse-${uid})`} opacity={0} />

        {/* Particle bursts on section activation */}
        {bursts.map(burst =>
          burst.particles.map((p, i) => (
            <circle key={`${burst.id}-${i}`} cx={burst.x} cy={burst.y}
              r={p.r} fill={p.color} filter={`url(#lst-particle-${uid})`}>
              <animateTransform attributeName="transform" type="translate"
                from="0 0" to={`${p.dx} ${p.dy}`} dur={`${p.dur}s`} fill="freeze" />
              <animate attributeName="opacity" from="0.95" to="0" dur={`${p.dur}s`} fill="freeze" />
              <animate attributeName="r" from={String(p.r)} to="0" dur={`${p.dur}s`} fill="freeze" />
            </circle>
          ))
        )}
      </svg>

      {/* Bottom splash — fixed overlay, always above content */}
      {splash && (
        <svg style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none', zIndex: 9999,
          overflow: 'visible',
        }}>
          <defs>
            <filter id={`lst-splash-soft-${uid}`} x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id={`lst-splash-pulse-${uid}`} x="-400%" y="-400%" width="900%" height="900%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {splash.rings.map((ring, i) => (
            <circle key={`r-${splash.id}-${i}`} cx={splash.x} cy={splash.y}
              r="3" fill="none" stroke={ring.color} strokeWidth="2"
              filter={`url(#lst-splash-soft-${uid})`}>
              <animate attributeName="r"            from="3"    to={ring.maxR} dur="1.6s" begin={`${ring.delay}s`} fill="freeze" />
              <animate attributeName="opacity"      from="0.9"  to="0"        dur="1.6s" begin={`${ring.delay}s`} fill="freeze" />
              <animate attributeName="stroke-width" from="2.5"  to="0.3"      dur="1.6s" begin={`${ring.delay}s`} fill="freeze" />
            </circle>
          ))}

          <circle cx={splash.x} cy={splash.y} r="8" fill="#67e8f9" filter={`url(#lst-splash-pulse-${uid})`}>
            <animate attributeName="r"       from="8"    to="28" dur="0.45s" fill="freeze" />
            <animate attributeName="opacity" from="0.95" to="0"  dur="0.45s" fill="freeze" />
          </circle>

          {splash.particles.map((p, i) => (
            <circle key={`sp-${splash.id}-${i}`} cx={splash.x} cy={splash.y}
              r={p.r} fill={p.color} filter={`url(#lst-splash-soft-${uid})`}>
              <animateTransform attributeName="transform" type="translate"
                from="0 0" to={`${p.dx} ${p.dy}`} dur={`${p.dur}s`} fill="freeze" />
              <animate attributeName="opacity" from="0.95" to="0"         dur={`${p.dur}s`} fill="freeze" />
              <animate attributeName="r"       from={String(p.r)} to="0"  dur={`${p.dur}s`} fill="freeze" />
            </circle>
          ))}
        </svg>
      )}
    </div>
  );
};

export default LuminousScrollThread;
