# ✦ LuminousScrollThread

**[English](#english) · [Français](#français)**

---

## English

### What it is

A React component that draws a living, glowing S-curve thread as the user scrolls down the page.

- **Progressive reveal** — the thread draws itself segment by segment using `stroke-dashoffset`
- **Moving light pulses** — 3 bright dots travel along the revealed path, animated at 60fps with zero React re-renders
- **Depth layering** — SVG masks dim the thread in configurable zones, creating the illusion it passes *behind* cards
- **Section activation** — when a section enters the viewport, particles burst outward from the thread at that position
- **Bottom splash** — ripple rings + upward particles fire when the thread reaches the end of the page; re-fires each time

Zero dependencies. Pure React + SVG.

---

### Demo

```
npm install
npm run dev
```

Open `http://localhost:5173` and scroll.

---

### Installation

Copy [`src/components/LuminousScrollThread.tsx`](src/components/LuminousScrollThread.tsx) into your project. No npm package — it's a single self-contained file.

---

### Usage

```tsx
import LuminousScrollThread from './components/LuminousScrollThread';

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', background: '#050912' }}>
      {/* Thread — behind everything */}
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
}
```

> The parent must be `position: relative`. The thread auto-measures page height and adapts to any resize.

---

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sectionIds` | `string[]` | `[]` | Element IDs the thread reacts to. Particles burst when each new section enters the viewport. |
| `gradientStops` | `Array<[string, string]>` | cyan/indigo palette | Colour stops for the thread gradient. Each entry: `['offset%', 'color']`. |
| `particleColors` | `string[]` | cyan/indigo palette | Colours used for burst and splash particles. |
| `depthZones` | `Array<[number, number]>` | `[[0.17,0.25],[0.38,0.46],[0.59,0.67]]` | Page fractions where the thread dims to simulate depth. |
| `splash` | `boolean` | `true` | Whether to show the bottom splash effect. |
| `zIndex` | `number` | `2` | z-index of the SVG layer. Works with `mix-blend-mode: screen`. |

---

### How it works

#### 1. Path — `buildPath(W, H)`

Single SVG `<path>` using cubic Bezier **S commands** — a smooth S-curve from top-center to bottom-center, weaving left and right. All coordinates are proportional to page height so it stretches to any page length.

#### 2. Progressive reveal — `stroke-dashoffset`

```
dashOffset = pathLength × (1 − scrollProgress)
```

`pathLength` is measured once via `pathElement.getTotalLength()`. `scrollProgress = scrollY / (pageHeight − viewportHeight)`.

#### 3. Moving pulses — RAF + `getPointAtLength()`

Three `<circle>` elements are moved each frame by directly calling `element.setAttribute('cx', ...)` inside `requestAnimationFrame`. **Zero React state updates per frame.** `getPointAtLength(distance)` returns the exact `{x, y}` at any distance along the path.

#### 4. Depth layering — SVG `<mask>`

A `<mask>` is applied to the core thread path. Inside the mask:
- White rectangle covering the full page → full opacity
- `linearGradient` rectangles over each depth zone → fade to ~32% opacity

The gradient makes transitions smooth. The bloom halo is *not* masked, so the soft glow persists even in dimmed zones.

#### 5. Section activation — `IntersectionObserver`

`IntersectionObserver` watches each element in `sectionIds`. On a new section entering (tracked via `prevSectionRef`):
1. `activeBounds` updates → a clipped bright path lights up over that section
2. `getPointAtLength(sectionMidY / pageHeight × pathLength)` finds the thread coordinate at the section midpoint → 10 particles animate outward from that exact point

#### 6. `mix-blend-mode: screen`

The SVG container uses `mix-blend-mode: screen`. In screen mode, dark pixels (near black) become transparent — only the colored glow is visible over any background. This is why the thread can float above opaque section backgrounds without obscuring text or UI.

---

### Performance

| Concern | Approach |
|---------|----------|
| Pulse animation | Direct DOM via `setAttribute` — zero React re-renders |
| Scroll listener | RAF-throttled — at most 1 state update per frame |
| Section detection | `IntersectionObserver` — no scroll listener needed |
| Resize | `ResizeObserver` on `document.documentElement` |
| Accessibility | `prefers-reduced-motion` disables pulses and particles |

---

### Requirements

- React 18+
- TypeScript (optional — the file is plain TSX, rename to `.jsx` if needed)
- A dark background (`mix-blend-mode: screen` requires it)

---

### License

MIT

---

---

## Français

### C'est quoi

Un composant React qui trace un fil lumineux en S au fur et à mesure que l'utilisateur scrolle.

- **Révélation progressive** — le fil se dessine segment par segment via `stroke-dashoffset`
- **Impulsions lumineuses** — 3 points lumineux voyagent sur le fil, animés à 60fps sans aucun re-render React
- **Profondeur par calques** — des masques SVG atténuent le fil dans des zones configurables, donnant l'illusion qu'il passe *derrière* les cartes
- **Activation par section** — quand une section entre dans le viewport, des particules jaillissent depuis le fil à cette position
- **Splash en bas de page** — anneaux de vagues + particules ascendantes quand le fil atteint le bas de page ; se redéclenche à chaque visite

Zéro dépendances. React + SVG pur.

---

### Démo

```
npm install
npm run dev
```

Ouvrir `http://localhost:5173` et scroller.

---

### Installation

Copier [`src/components/LuminousScrollThread.tsx`](src/components/LuminousScrollThread.tsx) dans votre projet. Pas de package npm — c'est un seul fichier autonome.

---

### Utilisation

```tsx
import LuminousScrollThread from './components/LuminousScrollThread';

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', background: '#050912' }}>
      {/* Le fil — derrière tout le contenu */}
      <LuminousScrollThread sectionIds={['features', 'pricing', 'faq']} />

      {/* Contenu de la page — z-index: 1 flotte au-dessus du fil */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <FeaturesSection id="features" />
        <PricingSection  id="pricing"  />
        <FAQSection      id="faq"      />
      </div>
    </div>
  );
}
```

> Le parent doit être `position: relative`. Le fil mesure automatiquement la hauteur de page et s'adapte à tout redimensionnement.

---

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `sectionIds` | `string[]` | `[]` | IDs des éléments réactifs. Des particules jaillissent à chaque nouvelle section visible. |
| `gradientStops` | `Array<[string, string]>` | palette cyan/indigo | Arrêts de couleur du dégradé du fil. Chaque entrée : `['offset%', 'couleur']`. |
| `particleColors` | `string[]` | palette cyan/indigo | Couleurs des particules de burst et de splash. |
| `depthZones` | `Array<[number, number]>` | `[[0.17,0.25],[0.38,0.46],[0.59,0.67]]` | Fractions de la page où le fil s'atténue pour simuler la profondeur. |
| `splash` | `boolean` | `true` | Afficher l'effet splash en bas de page. |
| `zIndex` | `number` | `2` | z-index du calque SVG. Fonctionne avec `mix-blend-mode: screen`. |

---

### Comment ça marche

#### 1. Le chemin — `buildPath(W, H)`

Un seul `<path>` SVG construit avec des **commandes Bezier cubiques S** — une courbe en S lisse du centre-haut au centre-bas, ondulant à gauche et à droite. Toutes les coordonnées sont proportionnelles à la hauteur de page.

#### 2. Révélation progressive — `stroke-dashoffset`

```
dashOffset = longueurChemin × (1 − progressionScroll)
```

`longueurChemin` est mesuré une fois via `pathElement.getTotalLength()`. `progressionScroll = scrollY / (hauteurPage − hauteurViewport)`.

#### 3. Impulsions mobiles — RAF + `getPointAtLength()`

Trois `<circle>` sont déplacés chaque frame en appelant directement `element.setAttribute('cx', ...)` dans `requestAnimationFrame`. **Zéro mise à jour du state React par frame.** `getPointAtLength(distance)` retourne les coordonnées `{x, y}` exactes à n'importe quelle distance sur le chemin.

#### 4. Profondeur — `<mask>` SVG

Un `<mask>` est appliqué au chemin principal. À l'intérieur :
- Rectangle blanc sur toute la page → opacité totale
- Rectangles `linearGradient` sur chaque zone de profondeur → fondu vers ~32% d'opacité

#### 5. Activation par section — `IntersectionObserver`

`IntersectionObserver` surveille chaque élément de `sectionIds`. À chaque nouvelle section (suivie via `prevSectionRef`) :
1. `activeBounds` se met à jour → un chemin lumineux clipé s'illumine sur la section
2. `getPointAtLength(midY / hauteurPage × longueur)` localise le fil au niveau du milieu de section → 10 particules s'animent depuis ce point exact

#### 6. `mix-blend-mode: screen`

Le conteneur SVG utilise `mix-blend-mode: screen`. En mode screen, les pixels sombres (proches du noir) deviennent transparents — seul le halo coloré est visible sur n'importe quel fond. C'est ce qui permet au fil de flotter au-dessus de sections à fond opaque sans masquer le texte.

---

### Performance

| Point | Approche |
|-------|----------|
| Animation impulsions | DOM direct via `setAttribute` — zéro re-render React |
| Écouteur scroll | RAF-throttlé — au plus 1 mise à jour state par frame |
| Détection sections | `IntersectionObserver` — pas d'écouteur scroll nécessaire |
| Redimensionnement | `ResizeObserver` sur `document.documentElement` |
| Accessibilité | `prefers-reduced-motion` désactive impulsions et particules |

---

### Prérequis

- React 18+
- TypeScript (optionnel — renommer en `.jsx` si besoin)
- Fond sombre (`mix-blend-mode: screen` l'exige)

---

### Licence

MIT
