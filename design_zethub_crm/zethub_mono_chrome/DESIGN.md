# Design System Specification: The Monochromatic Authority

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Architect."** 

This system rejects the "template-ready" clutter of modern SaaS in favor of an editorial, high-precision aesthetic. It treats interface design as an exercise in structural integrity and tonal depth. By removing the crutch of color, we force the user’s eye to follow a hierarchy built entirely on scale, weight, and light. 

To break the "standard grid" feel, we employ **intentional asymmetry**. Primary navigation or key data metrics should occupy unexpected proportions of the screen, creating a layout that feels curated rather than generated. We utilize "Breathing Room" as a functional component—negative space is not "empty"; it is a luxury material used to separate high-value information.

---

## 2. Colors & Tonal Architecture
The palette is a strict monochromatic spectrum. We do not use color to signify importance; we use contrast.

### The "No-Line" Rule
Standard 1px borders are prohibited for sectioning. To define boundaries, designers must use **Background Color Shifts**. For example, a `surface-container-low` (#f3f3f3) side panel should sit flush against a `surface` (#f9f9f9) main viewport. The "line" is created by the meeting of two tones, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium paper.
*   **Base:** `surface` (#f9f9f9)
*   **Deepest Recess:** `surface-container-lowest` (#ffffff) — used for primary content cards to make them "pop" forward.
*   **Elevated Tiers:** Use `surface-container-high` (#e8e8e8) for utility bars or secondary navigation to ground the experience.

### Glass & Texture
To move beyond "flat" design, use **Glassmorphism** for floating elements (Modals, Popovers). Apply a backdrop-blur of 20px to a `surface-container-lowest` background at 80% opacity. This creates a "frosted glass" effect that allows the underlying grayscale structure to bleed through, softening the interface.

---

## 3. Typography: Hierarchy through Mass
The system relies on the **Inter** typeface. Because color is absent, font-weight and size are your primary tools for directing user attention.

*   **Display (lg/md/sm):** High-impact, `SemiBold` (600). Used sparingly for high-level data summaries or welcome headers.
*   **Headline:** `Medium` (500). These are the anchors of your sections.
*   **Title:** `Medium` (500). Use for card headers or modal titles.
*   **Body:** `Regular` (400). Optimized for legibility with a generous 1.5x line-height.
*   **Label:** `SemiBold` (600) + All Caps. Use for small metadata or table headers to create a "technical" editorial feel.

---

## 4. Elevation & Depth
We eschew traditional "drop shadows" in favor of **Tonal Layering**.

### The Layering Principle
Depth is achieved by "stacking." A `surface-container-lowest` (#ffffff) card placed on a `surface-container-low` (#f3f3f3) background provides enough contrast to imply elevation without a single pixel of shadow.

### Ambient Shadows
When a component must "float" (e.g., a primary dropdown), use an **Ambient Shadow**:
*   **Blur:** 32px to 64px.
*   **Opacity:** 4%–6% of `on-surface` (#1a1c1c).
*   **Offset:** Vertical (Y) only, never horizontal. This mimics a natural overhead gallery light.

### The "Ghost Border" Fallback
If a border is required for accessibility in complex data tables, use a **Ghost Border**: `outline-variant` (#c6c6c6) at **15% opacity**. This provides a visual hint without breaking the "No-Line" philosophy.

---

## 5. Components

### Buttons
*   **Primary:** `primary` (#000000) background with `on-primary` (#e2e2e2) text. No border. 12px (`DEFAULT`) corner radius.
*   **Secondary:** `surface-container-highest` (#e2e2e2) background. Subtle and integrated.
*   **Tertiary:** Ghost style. No background, `Medium` weight text. Use only for low-priority actions like "Cancel."

### Input Fields
*   **Default State:** Background: `surface-container-low` (#f3f3f3). No border.
*   **Focus State:** A 1px Ghost Border using `primary` (#000000) at 20% opacity. 
*   **Error State:** Use `error` (#ba1a1a) only for the helper text and a 1px border. Do not tint the entire field background.

### Cards & Lists
*   **Prohibition:** Divider lines are strictly forbidden. 
*   **Separation:** Use **Vertical White Space** (Spacing Scale `6` or `8`) to separate list items. For heavy data lists, use alternating backgrounds (`surface` and `surface-container-low`) to create a "Zebra" stripe effect that feels like a modern spreadsheet.

### The "Pulse" Progress Component
In a grayscale system, "loading" states can feel dead. Use a subtle pulse animation on `surface-container-highest` (#e2e2e2) elements to indicate life and activity without using color.

---

## 6. Do’s and Don’ts

### Do:
*   **Use tight spacing for related items:** Use the `2` (0.5rem) or `3` (0.75rem) tokens to group labels with their inputs.
*   **Embrace Extreme Contrast:** Place `display-lg` text in `primary` (#000000) directly against a `surface-container-lowest` (#ffffff) background for a high-end fashion/editorial look.
*   **Use 12px (`DEFAULT`) rounding consistently:** This softens the brutalism of the grayscale palette.

### Don't:
*   **Don't use "Pure Black" for body text:** Use `on-surface-variant` (#474747) for long-form reading to reduce eye strain. Save `primary` (#000000) for headers.
*   **Don't use standard icons:** Avoid "filled" icons. Use thin-stroke (1px or 1.5px) outline icons to maintain the airy, premium feel of the typography.
*   **Don't add shadows to everything:** If a layout feels "messy," remove all shadows and rely purely on the **Surface Hierarchy**.