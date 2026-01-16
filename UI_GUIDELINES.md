# UI Guidelines

## UI primitives

Location: `apps/web/src/components/ui/`

- `Button` (`Button.tsx`)
  - Variants: `primary`, `secondary`, `ghost`, `danger`
  - Sizes: `sm`, `md`, `lg`
  - Shapes: `pill`, `rounded`
- `Input` / `Textarea` / `Select` (`Input.tsx`)
  - Sizes: `sm`, `md`, `lg`
- `Text` (`Text.tsx`)
  - Variants: `title`, `subtitle`, `body`, `muted`, `label`, `caption`

Use these primitives in client components to keep typography and controls consistent.

## Typography tokens

Defined in `apps/web/src/app/globals.css`:

- `--font-size-xs`: 12px
- `--font-size-sm`: 13px
- `--font-size-md`: 14px
- `--font-size-lg`: 16px
- `--font-size-xl`: 24px

Prefer `Text` variants or the CSS variables above instead of hardcoded font sizes.

## Spacing & radius

Use spacing tokens from `globals.css`:

- `--space-1` … `--space-8`

Radius tokens:

- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`

## Layout guidance

- Use CSS modules for page layout and component styling.
- Keep layout containers consistent (max-width + centered grid where appropriate).

## Inline styles

Allowed only for dynamic, computed styles (e.g., calculated sizes or colors).
Static styling should live in CSS modules or UI primitives.
