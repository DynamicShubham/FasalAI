---
name: Tactile Field Intelligence
colors:
  surface: '#00180d'
  surface-dim: '#00180d'
  surface-bright: '#18402f'
  surface-container-lowest: '#001209'
  surface-container-low: '#002114'
  surface-container: '#002517'
  surface-container-high: '#053120'
  surface-container-highest: '#133c2b'
  on-surface: '#c0edd4'
  on-surface-variant: '#c1c8c2'
  inverse-surface: '#c0edd4'
  inverse-on-surface: '#0d3727'
  outline: '#8b938d'
  outline-variant: '#414844'
  surface-tint: '#a5d0b8'
  primary: '#a5d0b8'
  on-primary: '#0d3727'
  primary-container: '#012d1d'
  on-primary-container: '#6d9681'
  inverse-primary: '#3e6653'
  secondary: '#a5d0ba'
  on-secondary: '#0e3728'
  secondary-container: '#274e3d'
  on-secondary-container: '#94bea9'
  tertiary: '#e7c268'
  on-tertiary: '#3e2e00'
  tertiary-container: '#322400'
  on-tertiary-container: '#a98935'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c0edd4'
  primary-fixed-dim: '#a5d0b8'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#264e3c'
  secondary-fixed: '#c1ecd5'
  secondary-fixed-dim: '#a5d0ba'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#274e3d'
  tertiary-fixed: '#ffdf96'
  tertiary-fixed-dim: '#e7c268'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4400'
  background: '#00180d'
  on-background: '#c0edd4'
  surface-variant: '#133c2b'
  clay-surface: '#023D28'
  clay-highlight: '#0A5C3E'
  warm-sand: '#DBC9A7'
  alert-amber: '#F2A541'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  stack-sm: 0.75rem
  stack-md: 1.5rem
  stack-lg: 3rem
---

## Brand & Style

The brand identity is centered on the concept of **Tactile Intelligence**. It moves away from the sterile, flat nature of traditional agricultural software toward an interface that feels organic, responsive, and physically present. By utilizing a "Claymorphic" aesthetic, the design system evokes the soft, rounded forms of nature—seeds, river stones, and fertile mounds—creating an emotional connection between the digital tool and the physical earth.

The style is **Futuristic Tactile**, characterized by voluminous "clay" surfaces that appear to be sculpted rather than rendered. It utilizes deep inner shadows and soft outer glows to simulate light catching on matte, high-quality polymers. This creates a "squishy" and friendly environment that reduces the perceived complexity of data-heavy tasks, making the user feel like they are interacting with a physical, helpful tool rather than a distant server. 

The goal is to provide a sense of **Organic Security**—a modern, professional dashboard that feels as sturdy and reliable as the tools used in the field.

## Colors

The color palette is anchored in a **Deep Forest Dark Mode**. By using `#012D1D` as the foundation, we minimize eye strain during dawn or dusk use in the field and provide a rich canvas for volumetric effects.

- **Primary & Secondary:** These agricultural greens are rendered in matte finishes. Instead of flat fills, they are used as the base for claymorphic surfaces, where light and shadow create the perception of depth.
- **Warm Neutrals:** Accents of sand and gold provide a grounded, organic contrast to the deep greens, used primarily for high-importance data visualizations and highlights.
- **Clay Logic:** Surfaces do not use pure black. Instead, they use deep, desaturated greens (`clay-surface`) to maintain a "living" feel even in the shadows.
- **Luminance:** Highlights are achieved through subtle shifts in hue toward emerald (`clay-highlight`) rather than just adding white, ensuring the interface feels vibrant and saturated.

## Typography

Typography acts as the precise, technical counter-balance to the soft, squishy UI. 

**Sora** is utilized for headlines to bring a futuristic, geometric edge that complements the roundedness of the containers. Its wide apertures ensure legibility even against the complex shadows of claymorphic cards.

**Be Vietnam Pro** is used for all body copy and labels. Its friendly, contemporary humanist traits ensure that long-form agricultural reports or instructions remain approachable and warm. 

To maintain harmony:
- Headlines use high-weight variations to stand out from the deep surface depth.
- Labels are frequently uppercase with increased letter spacing to provide a "navigational" feel across tactile buttons.
- For mobile, headline sizes are scaled down to ensure they do not wrap awkwardly on smaller devices.

## Layout & Spacing

The layout philosophy follows a **Contextual Fluid Grid** that prioritizes large hit areas and breathable margins. Because claymorphic elements occupy significant visual volume, extra white space (or "dark space") is required to prevent the UI from feeling cluttered.

- **Grid Model:** A 12-column system on desktop and a 4-column system on mobile.
- **The "Volume" Buffer:** Components require larger gutters (`1.5rem`) than flat designs because their soft shadows and "outer glows" require physical space to prevent overlap.
- **Mobile Adaptation:** On mobile, margins are kept tight (`1rem`) to maximize the size of the tactile cards, ensuring they remain easy to tap with one hand.
- **Rhythm:** We use a strict 8px base unit. Component internal padding should rarely fall below `1.5rem` to maintain the "pillowy" aesthetic.

## Elevation & Depth

This design system rejects traditional flat elevation in favor of **Claymorphic Volumetrics**. Depth is not created by stacking layers, but by "extruding" and "indenting" the surface.

- **Outer Shadows:** Use dual-layer shadows. A small, dark, sharp shadow for contact, and a larger, diffused shadow tinted with the primary green to ground the element.
- **Inner Highlights:** Use an inset box-shadow on the top-left of components. This should be a soft, semi-transparent light green (`#0A5C3E`) to simulate a light source hitting the top edge of a matte object.
- **Inner Shadows:** Use a darker inset shadow on the bottom-right to create the "curved" fall-off of a physical object.
- **Interaction Depth:** When a button is pressed, the outer shadow should shrink, and the inner shadows should deepen, simulating a physical "squish" or displacement of the clay surface.

## Shapes

The shape language is strictly **Pill-Shaped and Organic**. We use a maximum roundedness setting to ensure every component feels like a smoothed-over object.

- **Primary Components:** Buttons, input fields, and tags use full pill shapes (rounded-full).
- **Containers & Cards:** Use a massive `2rem` (32px) radius. This creates a friendly, "lo-fi" aesthetic that removes all visual tension.
- **Iconography:** Icons should be enclosed in circular clay containers or use "blob" shapes as background anchors to maintain the non-linear visual metaphor.

## Components

### Buttons
Buttons are the most tactile elements. They feature a primary green clay finish with a subtle top-down inner highlight. Text is centered and bold. On hover, the "inner glow" intensifies; on click, the button appears to sink into the surface.

### Cards
Cards act as the primary information vessels. They use a slightly lighter green than the background to create separation. They must have a minimum of 24px internal padding to ensure content does not touch the highly rounded corners.

### Input Fields
Fields appear as "indented" versions of the clay surface. Instead of an outer shadow, they use a deep inner shadow to look like they have been pressed into the background. Text sits "inside" this recess.

### Chips & Status Badges
Small, pill-shaped markers. For "Active" or "Positive" statuses, use a soft glow (outer shadow) in the status color to make the chip appear as if it is emitting light.

### Selection Controls
Checkboxes and radios are large, circular clay "buttons." When selected, they transition from an "indented" state to an "extruded" state with a bright center point.

### Lists
Lists are separated into individual clay tiles rather than a single flat list with dividers. Each list item is its own voluminous pill, separated by an 8px vertical gap.