# ETBALY → EGN.UNIVERSITY AESTHETIC REDESIGN

## ✅ COMPLETED

### Core Infrastructure
- [x] Updated `package.json` with `@studio-freight/lenis` and `gsap`
- [x] Updated `index.html` with Bebas Neue + Inter fonts, dark theme default, cursor: none
- [x] Completely rewrote `index.css` with:
  - New color tokens (dark default, lime green primary)
  - Grain texture overlay animation
  - Gradient blob utilities
  - Sharp corner styles
  - Bebas Neue + Inter typography
  - Ticker tape animation
  - Button styles (sharp, no rounded corners)
  - Form styles (dark, minimal)
  - Removed all glass/glow effects
- [x] Updated `tailwind.config.js` with new color system
- [x] Created `src/lib/lenis.ts` for smooth scrolling
- [x] Created `src/views/components/CustomCursor.tsx` (40px circle, lerp movement)
- [x] Created `src/hooks/useFadeInView.ts` for scroll reveal animations
- [x] Updated `App.tsx` to initialize Lenis and render CustomCursor
- [x] Updated `PageWrapper.tsx` with slower, smoother page transitions

## 🚧 IN PROGRESS / TODO

### Critical Components (Need Complete Redesign)

#### Navbar
- [ ] Minimal, transparent → dark on scroll
- [ ] Bebas Neue logo
- [ ] Inter uppercase nav links
- [ ] Remove all glassmorphism
- [ ] Sharp corners
- [ ] Lime green hover states

#### Footer
- [ ] Dark #0a0a0a background
- [ ] Bebas Neue logo large
- [ ] Inter links in text-dim
- [ ] Thin top border
- [ ] Remove circuit patterns

#### Landing Page (MOST IMPORTANT)
- [ ] Hero section (100vh):
  - Massive "PRINT THE" + "FUTURE" (outlined) heading
  - Lime green gradient blob top-right
  - Blue blob bottom-left
  - Two sharp buttons (lime green + outlined)
  - Scrolling ticker tape at bottom
- [ ] About section (100vh):
  - Chapter number "01"
  - "/ WHAT WE DO" label
  - "WHERE IDEAS BECOME OBJECTS" heading
  - Two-column layout
  - Orange/purple gradient blobs
- [ ] How It Works (3 cards):
  - Chapter "02"
  - Dark cards, sharp corners
  - Large numbers 01, 02, 03
  - Lime green hover borders
- [ ] AI Feature section:
  - Chapter "03"
  - "AI-POWERED DESIGN" massive heading
  - Purple/blue gradient blobs
- [ ] Stats section:
  - Gradient background lime to blue
  - Large Bebas Neue stats
- [ ] CTA section:
  - "START PRINTING TODAY" heading
  - Two buttons

#### Products Page
- [ ] Dark background with grain
- [ ] Filter sidebar: dark surface, sharp corners, lime checkboxes
- [ ] Product cards: #161616, 1px #2a2a2a border, sharp corners
- [ ] Price in lime green
- [ ] Lime green border on hover

#### Chat Page
- [ ] Dark split layout (30% left sidebar, 70% right chat)
- [ ] AI bubbles: #1e1e1e with lime green left border
- [ ] User bubbles: dark, right aligned
- [ ] Input: dark, sharp, lime green focus
- [ ] Send button: lime green bg, black icon

#### Cart Sidebar
- [ ] #111111 background
- [ ] Items separated by #2a2a2a borders
- [ ] Price in lime green
- [ ] Checkout button: lime green, black text, sharp

#### Checkout Page
- [ ] Dark, minimal
- [ ] Step numbers: large Bebas Neue
- [ ] Dark form inputs
- [ ] Place Order: lime green sharp button

#### Profile Page
- [ ] Dark dashboard
- [ ] Left sidebar navigation
- [ ] Lime green avatar ring
- [ ] Dark card sections

#### Admin Page
- [ ] Full dark dashboard
- [ ] Stat cards with colored top borders
- [ ] Dark tables with thin borders

### Smaller Components

#### ProductCard
- [ ] Dark #161616 background
- [ ] 1px #2a2a2a border
- [ ] Sharp corners (4px max)
- [ ] Image fills top
- [ ] Price in lime green
- [ ] Lime green border on hover
- [ ] Slight lift on hover

#### AuthPanel / FormField
- [ ] Dark backgrounds
- [ ] Sharp corners
- [ ] Lime green focus states
- [ ] Remove all glassmorphism

#### ThemeToggle
- [ ] Minimal design
- [ ] Lime green active state
- [ ] Sharp corners

#### ModelViewerCanvas
- [ ] Keep 3D logic intact
- [ ] Update container styling to dark with sharp corners
- [ ] Lime green loading states

## DESIGN TOKENS REFERENCE

```css
/* Dark (default) */
--color-bg: #0a0a0a
--color-surface: #161616
--color-primary: #c8ff00 (lime green)
--color-accent: #ff6b35 (orange)
--color-accent-2: #a855f7 (purple)
--color-accent-3: #3b82f6 (blue)
--color-text: #f0f0f0
--color-text-muted: #888888
--color-text-dim: #444444
--color-border: #2a2a2a
```

## TYPOGRAPHY REFERENCE

```css
/* Headings */
font-family: 'Bebas Neue', sans-serif
text-transform: uppercase
letter-spacing: 0.02em

/* Hero h1 */
font-size: clamp(64px, 10vw, 140px)

/* Section h2 */
font-size: clamp(40px, 6vw, 80px)

/* Body */
font-family: 'Inter', sans-serif
font-size: 16px
line-height: 1.7
color: var(--color-text-muted)
```

## KEY VISUAL ELEMENTS

1. **Grain texture** - Always visible, animated
2. **Gradient blobs** - Different colors per section, heavily blurred
3. **Sharp corners** - Max 4px border-radius
4. **Lime green accents** - Primary CTA color
5. **Bebas Neue headings** - Massive, uppercase
6. **Chapter numbers** - Large, dim, like "01", "02", "03"
7. **Minimal borders** - 1px, #2a2a2a
8. **Dark surfaces** - #161616, #1e1e1e
9. **Custom cursor** - 40px circle, lime green
10. **Smooth scroll** - Lenis, ultra-slow

## REMOVED COMPLETELY

- ❌ All glassmorphism / backdrop-filter blur
- ❌ All glow effects / box-shadows
- ❌ Orbitron / Exo 2 / Playfair fonts
- ❌ Circuit board patterns
- ❌ Warm sand colors
- ❌ Heavy rounded corners
- ❌ Blue (#3b82f6) as primary color

## NEXT STEPS

1. Install dependencies: `npm install` (user needs to run this)
2. Redesign Navbar (most visible component)
3. Redesign Landing Page (hero + sections)
4. Redesign Products Page
5. Redesign Chat Page
6. Update all remaining components
7. Test smooth scrolling
8. Test custom cursor
9. Test page transitions
10. Mobile responsive check

## NOTES

- All business logic, API calls, stores, ViewModels, routing remain UNTOUCHED
- Only visual layer is being redesigned
- ModelViewer 3D logic stays the same, only container styling changes
- Form validation logic unchanged
- Auth and cart flows unchanged
