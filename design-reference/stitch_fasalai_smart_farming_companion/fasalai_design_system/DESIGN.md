---
name: FasalAI Design System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414844'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6653'
  primary: '#012d1d'
  on-primary: '#ffffff'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#a5d0b9'
  secondary: '#57615c'
  on-secondary: '#ffffff'
  secondary-container: '#d8e2dc'
  on-secondary-container: '#5b6560'
  tertiary: '#322400'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c3900'
  on-tertiary-container: '#c4a24c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#dbe5df'
  secondary-fixed-dim: '#bfc9c3'
  on-secondary-fixed: '#151d1a'
  on-secondary-fixed-variant: '#3f4945'
  tertiary-fixed: '#ffdf96'
  tertiary-fixed-dim: '#e7c268'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4400'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Open Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Open Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Open Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  mobile-headline:
    fontFamily: Open Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-margin: 16px
  gutter: 16px
---

## Brand & Style
The brand personality of the design system is defined as a **Calm Digital Companion**. It is designed to feel like a dependable advisor standing in the field with the farmer, rather than a remote piece of software. The visual language balances professional agricultural expertise with a warm, approachable human touch.

The style is **Modern Corporate Minimalism**, stripped of all unnecessary decorative elements to focus entirely on utility and clarity. By utilizing a high-contrast palette and generous white space, the design ensures that critical data—such as weather alerts or crop health—is immediately legible. This approach prioritizes "recognition over recall," making the interface intuitive for users who may be less familiar with complex digital patterns. The emotional goal is to foster **trust and reliability**, using stable layouts and familiar visual metaphors.

## Colors
The color palette is rooted in the natural world, using a **Deep Agricultural Green** (`#1B4332`) as the primary anchor to signify growth and stability. 

- **Primary:** Used for key actions, primary branding, and structural headers.
- **Secondary/Neutral:** A series of warm neutrals and soft, desaturated greens are used for background surfaces and card containers. The background is a specific **Off-White** (`#FCFBF7`) to reduce eye strain compared to pure white.
- **Accents:** Earthy tones like ochre are used sparingly for secondary data points or notifications, ensuring they don't compete with the primary green.
- **Contrast:** A strict adherence to high-contrast ratios is maintained, specifically for text-on-background pairings, to support outdoor readability in high-sunlight conditions.

## Typography
Typography is the cornerstone of this design system's accessibility. We use **Open Sans** for headlines to provide a friendly, open feel that remains legible at various weights. **Noto Sans** is selected for body text and labels due to its exceptional support for regional scripts (Hindi, Marathi, etc.), ensuring a seamless visual experience across multi-language interfaces.

Key typographic principles:
- **Scalability:** Body text starts at a comfortable 16px/18px to ensure ease of reading for all age groups.
- **Hierarchy:** Clear distinction between headers and body via weight and size. 
- **Regional Optimization:** Line heights are slightly increased (1.5x - 1.6x) to accommodate the vertical strokes of Brahmic scripts without clipping.

## Layout & Spacing
The design system utilizes a **Fluid Grid** model with a base unit of 8px. This ensures consistent rhythm across all components.

- **Mobile First:** The layout defaults to a single-column stack on mobile devices with 16px side margins to maximize touch-target width.
- **Touch Targets:** A minimum height of 48px is enforced for all interactive elements to accommodate varied manual dexterity and field-use conditions.
- **Rhythm:** Vertical spacing between cards is set to 16px (md) to maintain a clear separation of concerns without fragmenting the page. Large sections are separated by 40px (xl) to provide visual "breathing room."

## Elevation & Depth
To maintain the "Companion" feel, the design system avoids heavy shadows and floating effects that can feel overly "tech-heavy." Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Levels:** The base background is the warmest neutral. Cards and containers use a pure white surface.
- **Soft Depth:** Depth is communicated through subtle, 1px borders in a soft neutral-grey or very light green. 
- **Shadows:** When elevation is required (e.g., for a floating action button or a primary modal), use a "Diffusion Shadow"—a very soft, low-opacity (8-10%) shadow with a large blur radius and no spread, tinted with the primary green to feel organic rather than synthetic.

## Shapes
The shape language is defined by **Roundedness Level 2**. This provides 0.5rem (8px) corners for standard components like input fields and buttons.

- **Cards:** Use a larger 1rem (16px) radius to feel friendlier and more approachable.
- **Consistency:** All interactive elements must share these rounded characteristics to signal "clickability."
- **Visual Metaphor:** The rounded corners mimic the organic, non-linear shapes found in nature, avoiding the aggressive sharpness of enterprise software.

## Components
### Buttons
Buttons are solid and high-contrast. The primary button uses the Primary Green with white text. Secondary buttons use a thick 2px border of the Primary Green. All buttons have a minimum height of 48px for easy tapping.

### Cards
Cards are the primary way information is delivered. They feature a white background, a 1px soft border, and the standard 16px corner radius. Content inside cards should have a minimum of 16px padding.

### Input Fields
Fields use a light neutral background with a clear label above. On focus, the border transitions to Primary Green. For non-technical users, use large, clear helper text below the field.

### Chips & Tags
Used for crop types (e.g., "Wheat," "Cotton") or status (e.g., "Ready for Harvest"). These use the secondary soft green background with Primary Green text to maintain a monochromatic, calm look.

### Lists
Lists are spacious with dividers that do not span the full width of the container, creating a "grouped" look that is easier to parse.

### Large Touch Targets
Every actionable item, including checkboxes and radio buttons, is wrapped in a larger hit area (min 48px) to ensure usability for users who may have calloused hands or are using the device in a rugged environment.