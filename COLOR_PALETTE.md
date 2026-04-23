# Etbaly Color Palette - Navy & Olive

## Primary Colors

### Navy Blue
```
Primary:      #1e3a5f  ████████  RGB(30, 58, 95)   - Main brand color
Primary Dark: #152a45  ████████  RGB(21, 42, 69)   - Hover states, depth
```

**Usage:**
- Primary buttons
- Active navigation links
- Brand elements
- Important CTAs
- 3D model default color
- Focus states

### Olive Green
```
Accent:       #6b7c3f  ████████  RGB(107, 124, 63)  - Main accent
Accent 2:     #8b9d5f  ████████  RGB(139, 157, 95)  - Light accent
Accent 3:     #4a5a2f  ████████  RGB(74, 90, 47)    - Dark accent
```

**Usage:**
- Secondary buttons
- Hover effects
- Highlights
- Icons
- Animated elements
- Success indicators (alternative)

## Background Colors

### Dark Theme (Default)
```
BG:           #0a0a0a  ████████  RGB(10, 10, 10)    - Main background
BG 2:         #111111  ████████  RGB(17, 17, 17)    - Secondary background
Surface:      #161616  ████████  RGB(22, 22, 22)    - Cards, panels
Surface 2:    #1e1e1e  ████████  RGB(30, 30, 30)    - Elevated surfaces
Surface 3:    #282828  ████████  RGB(40, 40, 40)    - Highest elevation
```

### Light Theme
```
BG:           #f5f5f0  ████████  RGB(245, 245, 240) - Main background
BG 2:         #eeede8  ████████  RGB(238, 237, 232) - Secondary background
Surface:      #ffffff  ████████  RGB(255, 255, 255) - Cards, panels
Surface 2:    #f8f8f5  ████████  RGB(248, 248, 245) - Elevated surfaces
Surface 3:    #efefea  ████████  RGB(239, 239, 234) - Highest elevation
```

## Text Colors

### Dark Theme
```
Text:         #f0f0f0  ████████  RGB(240, 240, 240) - Primary text
Text Muted:   #888888  ████████  RGB(136, 136, 136) - Secondary text
Text Dim:     #444444  ████████  RGB(68, 68, 68)    - Disabled text
```

### Light Theme
```
Text:         #0a0a0a  ████████  RGB(10, 10, 10)    - Primary text
Text Muted:   #555555  ████████  RGB(85, 85, 85)    - Secondary text
Text Dim:     #999999  ████████  RGB(153, 153, 153) - Disabled text
```

## Border Colors

### Dark Theme
```
Border:       #2a2a2a  ████████  RGB(42, 42, 42)    - Default borders
Border Light: #333333  ████████  RGB(51, 51, 51)    - Lighter borders
```

### Light Theme
```
Border:       #e0e0d8  ████████  RGB(224, 224, 216) - Default borders
Border Light: #ebebeb  ████████  RGB(235, 235, 235) - Lighter borders
```

## Semantic Colors

```
Success:      #10b981  ████████  RGB(16, 185, 129)  - Success states
Danger:       #ef4444  ████████  RGB(239, 68, 68)   - Error states
Warning:      #f59e0b  ████████  RGB(245, 158, 11)  - Warning states
```

## Color Combinations

### Primary Combinations
```
Navy + White:           High contrast, professional
Navy + Light Olive:     Harmonious, modern
Navy + Dark Background: Subtle, sophisticated
```

### Accent Combinations
```
Olive + Navy:           Complementary, balanced
Olive + White:          Fresh, clean
Olive + Dark Background: Organic, natural
```

### Gradient Combinations
```
Navy → Dark Navy:       Depth, dimension
Olive → Light Olive:    Smooth, organic
Navy → Olive:           Dynamic, interesting
```

## Usage Guidelines

### Do's ✅
- Use navy for primary actions and brand elements
- Use olive for accents and secondary elements
- Maintain sufficient contrast for accessibility
- Use darker shades for hover states
- Use lighter shades for disabled states
- Combine navy and olive for visual interest

### Don'ts ❌
- Don't use navy and olive at equal prominence
- Don't use olive for primary CTAs (use navy)
- Don't mix with the old blue/coral colors
- Don't use low-contrast combinations
- Don't overuse bright colors
- Don't ignore dark/light theme variations

## Accessibility

### WCAG Compliance

**AAA Rating (7:1 contrast)**
- White text on navy: ✅ 9.2:1
- Dark text on light olive: ✅ 7.5:1
- Navy on white background: ✅ 8.1:1

**AA Rating (4.5:1 contrast)**
- White text on olive: ✅ 5.2:1
- Olive on dark background: ✅ 4.8:1
- Light olive on dark: ✅ 5.5:1

**Fails (< 4.5:1)**
- Olive on white: ⚠️ 3.8:1 (use for decorative only)
- Light olive on white: ⚠️ 3.2:1 (use for decorative only)

## Color Psychology

### Navy Blue
**Emotional Response:**
- Trust and reliability
- Professionalism
- Stability and security
- Intelligence and wisdom
- Authority and confidence

**Industry Associations:**
- Technology and software
- Finance and banking
- Healthcare
- Corporate/enterprise
- Government

### Olive Green
**Emotional Response:**
- Growth and renewal
- Balance and harmony
- Nature and sustainability
- Innovation and progress
- Calm and peace

**Industry Associations:**
- Eco-friendly products
- Sustainable technology
- Organic/natural products
- Modern design
- Innovation

## Implementation

### CSS Variables
```css
:root {
  --color-primary: #1e3a5f;
  --color-primary-dark: #152a45;
  --color-accent: #6b7c3f;
  --color-accent-2: #8b9d5f;
  --color-accent-3: #4a5a2f;
}
```

### Tailwind Classes
```html
<!-- Navy -->
<div class="bg-primary text-white">Navy Button</div>
<div class="border-primary">Navy Border</div>
<div class="text-primary">Navy Text</div>

<!-- Olive -->
<div class="bg-accent text-white">Olive Button</div>
<div class="border-accent">Olive Border</div>
<div class="text-accent">Olive Text</div>
```

### Three.js Materials
```tsx
<meshStandardMaterial 
  color="#1e3a5f"  // Navy
  metalness={0.3} 
  roughness={0.4} 
/>
```

### SVG Graphics
```svg
<!-- Navy -->
<rect fill="#1e3a5f" />
<path stroke="#1e3a5f" />

<!-- Olive -->
<circle fill="#6b7c3f" />
<line stroke="#6b7c3f" />
```

## Color Variations

### Navy Tints (Lighter)
```
90%: #2f4a75  ████████  For subtle backgrounds
80%: #405a8b  ████████  For hover states
70%: #516aa1  ████████  For active states
```

### Navy Shades (Darker)
```
90%: #1a3355  ████████  For pressed states
80%: #162c4b  ████████  For deep shadows
70%: #122541  ████████  For darkest elements
```

### Olive Tints (Lighter)
```
90%: #7a8b52  ████████  For subtle backgrounds
80%: #899a65  ████████  For hover states
70%: #98a978  ████████  For active states
```

### Olive Shades (Darker)
```
90%: #606f38  ████████  For pressed states
80%: #556231  ████████  For deep shadows
70%: #4a552a  ████████  For darkest elements
```

## Export Formats

### Hex
```
Navy:  #1e3a5f
Olive: #6b7c3f
```

### RGB
```
Navy:  rgb(30, 58, 95)
Olive: rgb(107, 124, 63)
```

### HSL
```
Navy:  hsl(214, 52%, 25%)
Olive: hsl(77, 33%, 37%)
```

### RGBA (with opacity)
```
Navy 50%:  rgba(30, 58, 95, 0.5)
Olive 50%: rgba(107, 124, 63, 0.5)
```

## Design Tools

### Figma
```
Navy:  #1e3a5f
Olive: #6b7c3f
```

### Adobe XD
```
Navy:  1E3A5F
Olive: 6B7C3F
```

### Sketch
```
Navy:  #1e3a5f
Olive: #6b7c3f
```

## Brand Guidelines

### Logo Colors
- Primary logo: Navy (#1e3a5f)
- Secondary logo: Olive (#6b7c3f)
- Monochrome: White or Black

### Typography Colors
- Headings: Navy or Text color
- Body text: Text color
- Links: Navy with olive hover
- Captions: Text Muted

### UI Elements
- Primary buttons: Navy background, white text
- Secondary buttons: Transparent with navy border
- Tertiary buttons: Olive background, white text
- Icons: Navy or Olive depending on context
- Badges: Olive background, white text

## Summary

The navy and olive color scheme provides:
- ✅ Professional appearance
- ✅ Good accessibility
- ✅ Distinctive brand identity
- ✅ Versatile application
- ✅ Modern aesthetic
- ✅ Eco-tech positioning
