# Standard-Zoom Density Design

**Date:** 2026-09-25
**Status:** Approved
**Scope:** Frontend UI at default browser zoom, excluding Documentation

## Goal

Make the application feel compact and balanced at Chrome's default 100% zoom, rather than relying on 75–80% browser zoom to reduce visual scale. Preserve readable hierarchy and comfortable interactions.

## Design

- Apply a consistent compact-density pass to all desktop application pages except Documentation.
- Reduce desktop page padding and vertical gaps between sections by roughly 15–20%, using shared layout primitives where possible.
- Lower desktop interface typography by one modest step: page and section headings shrink slightly; general body, form, and table text moves from about 14px to 13px. Keep standard `text-xs` labels at 12px, do not reduce existing fixed-size micro-labels, and retain clear contrast and line height.
- Keep Documentation typography, article measure, navigation, and spacing unchanged.
- Do not scale the whole application with CSS transforms or globally shrink the browser root font size.
- Preserve control and icon-button hit areas; density changes affect visual whitespace and type, not operability.
- Apply compact typography to portalled dialogs, selects, popovers, sheets, and tooltips opened from compact pages.
- Keep auto-height text buttons at a 36px minimum height when their font size is reduced.
- Keep existing typography and responsive behavior on tablet and mobile, and avoid page-level horizontal overflow.

## Implementation boundaries

Use the shared layout components and existing tokens/classes for page frames, headers, section rhythm, tables, and form typography. Make only targeted exceptions where a page's task needs more space (notably Studio/Runner canvases). Do not change behavior, routes, API contracts, or data handling. Documentation remains untouched.

## Verification

- Review representative operations pages, Settings, Studio, and Runner at 100% browser zoom and compare with the current compactness goal.
- Confirm Documentation's typography/layout is unchanged.
- Check desktop, tablet, and mobile widths for wrapping, usable controls, focus visibility, and horizontal overflow.
- Run frontend tests, lint/format checks relevant to changed files, and the production build.
