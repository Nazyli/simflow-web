# Full Application UI Redesign Design

**Date:** 2026-09-24  
**Status:** Draft for review  
**Scope:** Frontend application UI, excluding the redesigned sidebar visual system

## Goal

Make the SimFlow frontend feel like a restrained, production-grade SaaS product used daily by real operators. The redesign will improve hierarchy, density, alignment, and consistency across the application without changing routes, API contracts, data behavior, or workflow business logic.

## Product context

SimFlow is a workflow and simulation product. Its UI has three primary usage modes:

1. Building and operating simulations in Studio and Runner.
2. Inspecting operational data in History, Timers, and Master Data.
3. Reading reference material and configuring the product in Documentation and Settings.

The sidebar already has a dedicated visual system and is out of scope for this redesign. The application shell header may be aligned with the new content system, but its navigation behavior remains unchanged.

## Design principles

- Preserve existing functionality, routes, API behavior, and business logic.
- Prefer hierarchy through typography, spacing, alignment, and contrast.
- Use surfaces only when they clarify grouping or elevation.
- Avoid nested cards, decorative gradients, glassmorphism, glow, and ornamental badges.
- Keep the interface dense enough for daily operational use without becoming cramped.
- Make controls and status indicators explicit, readable, keyboard-accessible, and predictable.
- Use the existing component library and established patterns before introducing new primitives.

## Visual system

### Color roles

| Role | Value | Usage |
| --- | --- | --- |
| Application canvas | `#F6F8FB` | Main page background |
| Surface | `#FFFFFF` | Tables, forms, panels, dialogs |
| Primary text | `#172033` | Headings and important values |
| Secondary text | `#64748B` | Descriptions, metadata, helper text |
| Border | `#DBE3EC` | Structural separation |
| Strong border | `#C6D2DF` | Focused or emphasized controls |
| Accent | `#9929EA` | Primary actions, active states, focus |
| Accent tint | `#F5E7FF` | Active and selected backgrounds |

The accent is not used as a decorative fill across large areas. Gradients remain limited to existing brand-specific areas outside the content redesign.

### Typography

- Use `Plus Jakarta Sans Variable` throughout the application UI.
- Page titles use a compact `text-lg` to `text-xl` scale, with semibold weight.
- Section headings use a clear weight step, not oversized display text.
- Metadata remains compact and muted, but must remain readable at normal zoom.
- Do not use gradient text, all-caps labels as decoration, or arbitrary font-size variations.

### Shape, spacing, and depth

- Use the existing 4px spacing rhythm.
- Default page padding: 24px desktop, 18px tablet, 12px mobile.
- Use `6px–10px` radius for controls and structural surfaces.
- Reserve larger radius values for dialogs or established workspace surfaces only.
- Use borders for structure and a small shadow only for real elevation such as dialogs, popovers, or floating controls.
- Avoid a shadow and border combination when spacing and contrast already provide separation.

## Page modes

### Workbench mode: Studio and Runner

The workbench should prioritize the task surface over decorative framing.

- Use a compact toolbar or page heading row.
- Keep canvas, editor, and selection panels visually dominant.
- Use panel boundaries and spacing instead of nested cards.
- Keep actions near the context they affect.
- Preserve graph editing, node configuration, participant channels, and all existing interaction behavior.
- Ensure narrow layouts use panel stacking or controlled horizontal regions rather than causing page-level horizontal scrolling.

### Operations mode: History, Timers, and Master Data Actors

These pages should be table-first and optimized for scanning.

- Replace repeated large header cards with a direct page heading row.
- Keep primary actions aligned with the page title.
- Use a compact filter/status row when it materially improves scanning.
- Treat tables as the main surface; avoid wrapping every table in multiple cards.
- Retain status counts where useful, but render them as a restrained summary strip rather than oversized metric cards.
- Preserve table sorting, filtering, row actions, dialogs, deletion flows, timer actions, and pagination or scrolling behavior.

### Reference and configuration mode: Documentation and Settings

These pages should be quieter and content-focused.

- Documentation uses a readable article column with a stable navigation region.
- Search and document navigation remain easy to find without becoming dashboard chrome.
- Settings uses sections with clear labels, descriptions, controls, and action feedback.
- Do not add decorative illustrations, dashboard metrics, or unnecessary empty-state containers.

## Shared UI structure

The redesign will introduce or consolidate only small, reusable layout patterns where they remove repeated styling without hiding page-specific behavior:

- `PageFrame`: owns page width, responsive padding, canvas background, and vertical rhythm.
- `PageHeader`: owns title, description, breadcrumb/context when applicable, and primary actions.
- `Toolbar`: owns filters and secondary actions for operational pages.
- `SummaryStrip`: owns compact status/count summaries where needed.
- `SurfaceSection`: owns a single meaningful content boundary when a section needs separation.

These are presentation-only primitives. They do not fetch data, own routing, or encode domain rules. Existing shadcn components remain the source for buttons, inputs, dialogs, tabs, tables, and menus.

If an existing page already has a suitable structure, it should be adapted rather than wrapped in additional containers.

## Responsive behavior

- Desktop keeps the persistent sidebar and uses the available main content width efficiently.
- Tablet reduces page padding and allows workbench panels to stack or collapse according to existing behavior.
- Mobile turns the sidebar into its existing drawer behavior and makes page headers/actions wrap without overlap.
- Tables use local horizontal scrolling only when the data genuinely requires it; the application shell must not create page-level horizontal scrolling.
- Long titles, descriptions, actor names, simulation names, and status labels truncate or wrap intentionally.
- Focus order follows DOM order at every breakpoint.

## Accessibility and interaction

- Preserve semantic headings, landmarks, labels, and button names.
- Keep visible focus rings using the existing accent treatment.
- Use hover only as a supporting cue; active and focus states must not rely on hover.
- Keep transitions short and limited to meaningful state changes such as navigation, disclosure, and dialog entry.
- Respect reduced-motion preferences for existing animated surfaces.
- Maintain usable touch targets even when icon glyphs remain visually compact.

## Out of scope

- Sidebar visual redesign or navigation taxonomy changes.
- Route changes, API changes, data model changes, and business logic changes.
- New dashboard metrics or new product features.
- Replacing the existing component library.
- Backend or database work.

## Verification strategy

- Run the existing frontend test suite after each cohesive implementation batch.
- Run TypeScript/Vite production build before completion.
- Run the Impeccable detector on changed UI files.
- Check desktop, tablet, and mobile layout behavior for page-level overflow, focus visibility, wrapping, and table scrolling.
- Confirm all existing routes remain reachable and all existing actions retain their behavior.

