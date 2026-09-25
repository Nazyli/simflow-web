---
name: SimFlow Frontend
description: Restrained, production-grade workflow tooling for building and operating simulations.
colors:
  primary: "#9929EA"
  secondary: "#DBABFF"
  brand-gradient: "linear-gradient(89.36deg, #992AEB 0.55%, #DBABFF 96.36%)"
  canvas: "#F6F8FB"
  surface: "#FFFFFF"
  text-primary: "#172033"
  text-secondary: "#64748B"
  border: "#DBE3EC"
  border-strong: "#C6D2DF"
  accent-tint: "#F5E7FF"
  accent-text: "#5B148F"
  destructive: "#DC2626"
  status-amber-bg: "#FFFBEB"
  status-amber-border: "#FDE68A"
  status-amber-text: "#B45309"
typography:
  display:
    fontFamily: "Plus Jakarta Sans Variable, Arial, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans Variable, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Plus Jakarta Sans Variable, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans Variable, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "#7D1FC2"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: SimFlow Frontend

## Overview

**Creative North Star: "Quiet control room"**

SimFlow is an operational workflow tool, so the interface should feel calm, dense, and dependable during repeated daily use. Visual hierarchy comes from typography, proximity, alignment, and restrained contrast rather than decoration. The primary accent is reserved for actions, active states, focus, and selected surfaces.

The application has three visual modes: workbench surfaces for Studio and Runner, operations surfaces for History, Timers, and Master Data, and reference/configuration surfaces for Documentation and Settings. Each mode shares the same visual language while adapting density and structure to the task.

**Key Characteristics:**

- Quiet, professional, and information-dense.
- Flat surfaces with structural borders and selective elevation.
- One recognizable violet accent used sparingly and consistently.
- Responsive layouts that use available space without page-level overflow.

## Colors

The palette combines a cool near-white canvas, white working surfaces, slate text, and one violet brand accent.

### Primary

- **SimFlow Violet** (`{colors.primary}`): Primary actions, active navigation, focus rings, and selected controls.
- **Soft Violet** (`{colors.secondary}`): Secondary brand expression and restrained hover or supporting accents.
- **Brand Gradient** (`{colors.brand-gradient}`): Existing brand-specific surfaces only, never as a general page background or text treatment.

### Neutral

- **Cool Canvas** (`{colors.canvas}`): Main application page background.
- **Surface White** (`{colors.surface}`): Forms, tables, panels, cards, and dialogs.
- **Ink** (`{colors.text-primary}`): Headings, primary values, and important labels.
- **Slate** (`{colors.text-secondary}`): Descriptions, metadata, helper text, and secondary controls.
- **Structural Border** (`{colors.border}`): Dividers, table boundaries, and panel edges.
- **Strong Border** (`{colors.border-strong}`): Focused or emphasized controls.
- **Accent Tint** (`{colors.accent-tint}`): Selected or active backgrounds paired with `{colors.accent-text}`.

### Status

- **Amber Status Background** (`{colors.status-amber-bg}`), **Amber Border** (`{colors.status-amber-border}`), and **Amber Text** (`{colors.status-amber-text}`): Locked, warning, or usage states.
- **Destructive** (`{colors.destructive}`): Delete and irreversible actions only.

**The One Accent Rule.** Violet is an interaction signal, not a decorative fill. Do not introduce a different accent color for each menu item or feature.

## Typography

**Display Font:** Plus Jakarta Sans Variable (with Arial, sans-serif fallback)

**Body Font:** Plus Jakarta Sans Variable (with Arial, sans-serif fallback)

**Character:** The type system is compact, clear, and slightly technical without using a costume monospace face. Weight and spacing create hierarchy; large display text is used sparingly.

### Hierarchy

- **Display** (600, `clamp(1.5rem, 3vw, 2rem)`, 1.2): Page titles and the strongest entry points.
- **Title** (600, `1.125rem`, 1.35): Section titles and meaningful panel headings.
- **Body** (400, `0.875rem`, 1.5): Main interface copy and form content.
- **Label** (600, `0.75rem`, 1.35, slight positive tracking): Compact metadata, controls, and status labels.
- **Micro metadata** (500–600, `0.68rem–0.75rem`): Counts, compact state text, and supporting context; never below readable contrast.

**The No-Display-Costume Rule.** Do not use gradient text, oversized headings, all-caps decoration, or monospace text unless the content is genuinely code or measurement data.

## Layout

Use a 4px spacing rhythm. Standard page padding is 24px on desktop, 18px on tablet, and 12px on mobile. The application shell and page frames must allow content to use the available width; max-width containers are only appropriate when they improve reading measure or are explicitly required by the surface.

Workbench pages prioritize the editor, canvas, channel workspace, and selection panels. Operations pages are table-first and use compact heading and summary rows. Documentation keeps a readable article measure while Settings uses clearly separated configuration sections.

Desktop keeps the persistent sidebar. Tablet layouts collapse or overlay secondary panels when necessary. Mobile uses the existing drawer behavior and allows headings/actions to wrap without overlap. Horizontal scrolling is local to genuinely wide data regions; the application shell must not create page-level horizontal scrolling.

Long names and descriptions truncate or line-clamp intentionally. Grid cards use flex columns so footers align at the bottom even when content lengths differ. Focus order follows DOM order at every breakpoint.

## Elevation & Depth

The default system is flat and structural. Borders, surface contrast, and spacing establish most hierarchy. Use a small soft shadow only for real elevation such as dialogs, popovers, floating controls, or a card responding to hover. Avoid combining heavy shadows with decorative borders.

### Shadow Vocabulary

- **Resting surface:** No shadow; use a structural border when separation is needed.
- **Hover lift:** A subtle `0 4px 12px rgba(15, 23, 42, 0.08)` shadow paired with a modest border-color change.
- **Overlay:** A stronger but soft shadow reserved for dialogs, popovers, and floating panels.

**The Flat-by-Default Rule.** A surface should earn elevation through interaction or overlay behavior; never add a shadow only to make a component look modern.

## Shapes

Use restrained rounded corners: 6px for compact controls, 8px for standard controls and cards, and 10px for larger structural surfaces. Borders are 1px and use the structural border token. Avoid making every element pill-shaped or using oversized rounded containers.

Cards and panels should have one clear boundary. Do not nest cards inside cards when spacing and a divider can establish the same relationship. Status chips and badges may use compact rounded corners when they communicate a real state.

## Components

### Buttons

- **Shape:** Compact 6–8px corners with a minimum usable touch target.
- **Primary:** SimFlow Violet background, white text, semibold label, and compact horizontal padding.
- **Hover / Focus:** Slightly darker violet on hover; visible violet focus ring with no glow effect.
- **Secondary / Ghost:** Neutral text and surface treatment; hover changes contrast or background subtly.
- **Destructive:** Red is reserved for irreversible actions and should not dominate the default interface.

### Inputs / Fields

- **Style:** White surface, 1px structural border, 8px corners, readable body text, and compact vertical padding.
- **Focus:** Strong border or violet focus ring; focus must remain visible without relying on hover.
- **Error / Disabled:** Use explicit text and contrast changes; do not communicate errors by color alone.

### Cards / Containers

- **Corner Style:** 8px by default.
- **Background:** White surface on the cool canvas.
- **Shadow Strategy:** Flat at rest; subtle hover lift only when the card is interactive.
- **Border:** Structural border at rest, slightly stronger or accent-tinted on interaction.
- **Internal Padding:** 12–16px using the spacing rhythm.
- **Interactive list cards:** Keep the title bounded, description line-clamped, actions near the title, and metadata/status in a dedicated footer when alignment matters.

### Status Badges

Use a badge only when it conveys a meaningful state such as locked, warning, active, or ready. Keep the palette restrained: amber for usage/lock warnings, slate for neutral readiness, and violet for selected/active state.

### Navigation

Navigation uses concise labels, consistent icon sizing, and a quiet active state. The persistent sidebar owns navigation grouping and its responsive drawer/collapse behavior. Content headers should not duplicate sidebar taxonomy; they should show only the local context needed to orient the user.

## Do's and Don'ts

### Do:

- **Do** use Plus Jakarta Sans Variable throughout the application UI.
- **Do** use the shared shadcn/ui primitives and Tailwind utilities before creating custom components or global CSS.
- **Do** use `{colors.primary}` for meaningful actions and active/focus states.
- **Do** use spacing, typography, alignment, and contrast to establish hierarchy.
- **Do** keep responsive overflow local to the region that needs it.
- **Do** preserve semantic headings, labels, focus rings, and usable touch targets.

### Don't:

- **Don't** revive the old violet-to-indigo brand gradient for new elements.
- **Don't** use large decorative gradients, glassmorphism, glow, or heavy shadowed cards.
- **Don't** turn every element into a pill, card, badge, or nested surface.
- **Don't** introduce a different color for each navigation item or feature.
- **Don't** put business rules, node definitions, ports, or API contracts in the visual layer.
- **Don't** create page-level horizontal scrolling to solve a local layout problem.
