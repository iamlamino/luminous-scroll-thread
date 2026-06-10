import React, { useState } from 'react';
import LuminousScrollThread from './components/LuminousScrollThread';

// ─── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  en: {
    toggle: 'FR',
    nav: 'LuminousScrollThread',
    hero_title: 'Scroll-driven glowing light thread',
    hero_sub: 'A React component that draws a living, glowing path as you scroll — with moving light pulses, depth layering, section activation bursts, and a splash effect when you reach the bottom.',
    hero_badge: 'Open Source',
    features_title: 'Features',
    features: [
      { title: 'Progressive reveal', desc: 'The thread draws itself as you scroll, using stroke-dashoffset driven by scroll progress.' },
      { title: 'Moving pulses', desc: '3 bright dots travel along the revealed path, animated via RAF with zero React re-renders per frame.' },
      { title: 'Depth layering', desc: 'SVG masks dim the thread in configurable zones, creating the illusion it passes behind cards.' },
      { title: 'Section activation', desc: 'IntersectionObserver watches section elements. When a new one enters, particles burst from the thread.' },
      { title: 'Bottom splash', desc: 'Ripple rings + upward particles fire when the thread reaches the end. Re-fires on each visit to the bottom.' },
      { title: 'Zero dependencies', desc: 'Pure React + SVG. No canvas, no WebGL, no animation library — just math and DOM.' },
    ],
    how_title: 'How it works',
    how: [
      { label: 'buildPath(W, H)', desc: 'S-curve SVG path using cubic Bezier commands, clamped to screen edges.' },
      { label: 'stroke-dashoffset', desc: 'dashOffset = pathLength × (1 − scrollProgress). Classic line-drawing trick.' },
      { label: 'getPointAtLength()', desc: 'Returns {x, y} at any distance along the path — used for pulses and particle spawn positions.' },
      { label: 'mix-blend-mode: screen', desc: 'Dark pixels become transparent. Only the colored glow is visible over any background.' },
      { label: 'ResizeObserver', desc: 'Remeasures page height whenever content changes — handles dynamic layouts.' },
      { label: 'prefers-reduced-motion', desc: 'Pulses and particles are skipped when the OS accessibility setting is enabled.' },
    ],
    install_title: 'Installation',
    install_cmd: '# Copy src/components/LuminousScrollThread.tsx into your project\n# No npm install needed — zero dependencies.',
    usage_title: 'Usage',
    about_title: 'About',
    about_desc: 'Built by Lamino for the ERP Purchase Requests platform, then extracted as a standalone open-source component. Feel free to adapt it to any dark-background landing page.',
    faq_title: 'FAQ',
    faq: [
      { q: 'Does it work on white backgrounds?', a: 'Use mix-blend-mode: multiply instead of screen, and invert the colours to dark tones.' },
      { q: 'Can I change the thread colour?', a: 'Yes — pass gradientStops prop with your own colour stops.' },
      { q: 'What about performance?', a: 'Pulse animation uses zero React re-renders per frame (direct DOM via setAttribute). Scroll updates are RAF-throttled.' },
      { q: 'Does it support TypeScript?', a: 'Yes — the component ships with full TypeScript types.' },
    ],
    footer: 'Open source. MIT License.',
  },
  fr: {
    toggle: 'EN',
    nav: 'LuminousScrollThread',
    hero_title: 'Fil lumineux piloté par le défilement',
    hero_sub: 'Un composant React qui trace un chemin vivant et lumineux au fil du scroll — avec des impulsions lumineuses, une superposition en profondeur, des explosions de particules par section, et un effet splash en bas de page.',
    hero_badge: 'Open Source',
    features_title: 'Fonctionnalités',
    features: [
      { title: 'Révélation progressive', desc: 'Le fil se dessine au scroll via stroke-dashoffset piloté par la progression de défilement.' },
      { title: 'Impulsions mobiles', desc: '3 points lumineux voyagent sur le fil, animés via RAF sans aucun re-render React par frame.' },
      { title: 'Profondeur par calques', desc: 'Des masques SVG atténuent le fil dans des zones configurables, donnant l\'illusion qu\'il passe derrière les cartes.' },
      { title: 'Activation par section', desc: 'IntersectionObserver surveille les sections. À chaque nouvelle entrée, des particules jaillissent depuis le fil.' },
      { title: 'Splash en bas de page', desc: 'Anneaux de vagues + particules ascendantes quand le fil atteint le bas. Se redéclenche à chaque visite.' },
      { title: 'Zéro dépendances', desc: 'React + SVG pur. Pas de canvas, pas de WebGL, pas de bibliothèque d\'animation.' },
    ],
    how_title: 'Comment ça marche',
    how: [
      { label: 'buildPath(W, H)', desc: 'Courbe en S via des commandes Bezier cubiques, limitées aux bords de l\'écran.' },
      { label: 'stroke-dashoffset', desc: 'dashOffset = longueur × (1 − progression). La technique classique de tracé de ligne.' },
      { label: 'getPointAtLength()', desc: 'Retourne {x, y} à n\'importe quelle distance sur le chemin — pour les impulsions et les spawns de particules.' },
      { label: 'mix-blend-mode: screen', desc: 'Les pixels sombres deviennent transparents. Seul le halo coloré est visible sur n\'importe quel fond.' },
      { label: 'ResizeObserver', desc: 'Recalcule la hauteur de page à chaque changement de contenu — compatible avec les mises en page dynamiques.' },
      { label: 'prefers-reduced-motion', desc: 'Impulsions et particules sont désactivées si le paramètre d\'accessibilité OS est actif.' },
    ],
    install_title: 'Installation',
    install_cmd: '# Copiez src/components/LuminousScrollThread.tsx dans votre projet\n# Aucun npm install nécessaire — zéro dépendances.',
    usage_title: 'Utilisation',
    about_title: 'À propos',
    about_desc: 'Créé par Lamino pour la plateforme ERP Purchase Requests, puis extrait comme composant open source. Libre à vous de l\'adapter à n\'importe quelle landing page sur fond sombre.',
    faq_title: 'FAQ',
    faq: [
      { q: 'Ça marche sur fond blanc ?', a: 'Utilisez mix-blend-mode: multiply à la place de screen, et inversez les couleurs en tons sombres.' },
      { q: 'Peut-on changer la couleur du fil ?', a: 'Oui — passez la prop gradientStops avec vos propres arrêts de couleur.' },
      { q: 'Quid des performances ?', a: 'L\'animation des impulsions ne déclenche aucun re-render React par frame (DOM direct via setAttribute). Le scroll est throttlé par RAF.' },
      { q: 'TypeScript supporté ?', a: 'Oui — le composant est livré avec ses types TypeScript complets.' },
    ],
    footer: 'Open source. Licence MIT.',
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const BG      = '#050912';
const BORDER  = 'rgba(56,189,248,0.12)';
const ACCENT  = '#38bdf8';
const MUTED   = '#94a3b8';
const CARD_BG = 'rgba(255,255,255,0.03)';

const sectionStyle: React.CSSProperties = {
  padding: '96px 24px',
  maxWidth: 860,
  margin: '0 auto',
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const t = T[lang];

  const SECTION_IDS = ['features', 'how-it-works', 'install', 'faq', 'about'];

  return (
    <div style={{ background: BG, minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Thread — sits behind all content */}
      <LuminousScrollThread sectionIds={SECTION_IDS} />

      {/* All content — z-index 1 floats above the thread */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Nav */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(5,9,18,0.85)', backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${BORDER}`,
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56,
        }}>
          <span style={{ color: ACCENT, fontWeight: 700, letterSpacing: '-0.02em', fontSize: 15 }}>
            ✦ {t.nav}
          </span>
          <button
            onClick={() => setLang(l => l === 'en' ? 'fr' : 'en')}
            style={{
              background: 'rgba(56,189,248,0.08)', border: `1px solid ${BORDER}`,
              color: ACCENT, padding: '4px 14px', borderRadius: 6,
              cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
            }}
          >
            {t.toggle}
          </button>
        </nav>

        {/* Hero */}
        <section style={{ ...sectionStyle, paddingTop: 120, paddingBottom: 120, textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(56,189,248,0.08)',
            border: `1px solid ${BORDER}`, color: ACCENT,
            padding: '3px 12px', borderRadius: 20, fontSize: 11,
            fontWeight: 700, letterSpacing: '0.1em', marginBottom: 28,
            textTransform: 'uppercase',
          }}>
            {t.hero_badge}
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
            color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1.15,
            marginBottom: 24,
          }}>
            {t.hero_title}
          </h1>
          <p style={{ color: MUTED, fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, maxWidth: 620, margin: '0 auto' }}>
            {t.hero_sub}
          </p>
        </section>

        {/* Features */}
        <section id="features" style={sectionStyle}>
          <h2 style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, marginBottom: 48, letterSpacing: '-0.02em' }}>
            {t.features_title}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {t.features.map((f, i) => (
              <div key={i} style={{
                background: CARD_BG, border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: '20px 22px',
              }}>
                <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{f.title}</div>
                <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" style={sectionStyle}>
          <h2 style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, marginBottom: 48, letterSpacing: '-0.02em' }}>
            {t.how_title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {t.how.map((item, i) => (
              <div key={i} style={{
                background: CARD_BG, border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: '18px 22px',
                display: 'flex', gap: 20, alignItems: 'flex-start',
              }}>
                <code style={{
                  color: ACCENT, fontSize: 12, fontFamily: 'monospace',
                  background: 'rgba(56,189,248,0.08)', padding: '3px 8px',
                  borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
                }}>
                  {item.label}
                </code>
                <span style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Install */}
        <section id="install" style={sectionStyle}>
          <h2 style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, marginBottom: 32, letterSpacing: '-0.02em' }}>
            {t.install_title}
          </h2>
          <pre style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: '18px 22px',
            color: '#a5f3fc', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7,
            overflowX: 'auto',
          }}>
            {t.install_cmd}
          </pre>
          <h3 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 600, margin: '36px 0 16px', letterSpacing: '-0.01em' }}>
            {t.usage_title}
          </h3>
          <pre style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: '18px 22px',
            color: '#a5f3fc', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7,
            overflowX: 'auto',
          }}>
{`import LuminousScrollThread from './components/LuminousScrollThread';

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', background: '#050912' }}>
      {/* Thread — sits behind all content */}
      <LuminousScrollThread sectionIds={['features', 'pricing', 'faq']} />

      {/* Page content — z-index: 1 floats above the thread */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <FeaturesSection id="features" />
        <PricingSection  id="pricing"  />
        <FAQSection      id="faq"      />
      </div>
    </div>
  );
}`}
          </pre>
        </section>

        {/* FAQ */}
        <section id="faq" style={sectionStyle}>
          <h2 style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, marginBottom: 40, letterSpacing: '-0.02em' }}>
            {t.faq_title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {t.faq.map((item, i) => (
              <div key={i} style={{
                background: CARD_BG, border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: '18px 22px',
              }}>
                <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{item.q}</div>
                <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section id="about" style={{ ...sectionStyle, paddingBottom: 120 }}>
          <h2 style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.02em' }}>
            {t.about_title}
          </h2>
          <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.75 }}>{t.about_desc}</p>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: `1px solid ${BORDER}`,
          padding: '20px 24px',
          textAlign: 'center',
          color: 'rgba(148,163,184,0.5)',
          fontSize: 12,
        }}>
          {t.footer}
        </footer>
      </div>
    </div>
  );
}
