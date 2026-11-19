# Design system

TokenFlow is a dark-first product surface. The visual language is built from a small set of tokens, a shared UI kit and a few repeatable layout patterns. There is no separate light theme in this release; the interface is designed for the midnight background and checked for contrast on that surface.

## Principles

1. **Quiet depth over decoration.** Glass panels, hairline borders and soft gradient lighting create hierarchy without hiding content.
2. **One accent per intent.** Violet is the primary action and identity color. Cyan is informational and transactional. Teal marks success, coral marks destructive or cancelled states, amber marks attention and platform administration.
3. **Motion explains, never delays.** Entrances reveal structure, live elements pulse, and scanning has a moving line. Every animation collapses under `prefers-reduced-motion`.
4. **Honest states.** Empty, loading, pending and disabled states are visible. There are no placeholder statistics or fake activity feeds.
5. **Responsive by default.** Tables become cards, sidebars become sheets, and actions stay reachable on a 360 px viewport.

## Tokens

Tokens live in `src/app/globals.css` using Tailwind CSS v4's CSS-first `@theme inline` block. Components consume semantic names such as `bg-surface`, `text-muted` or `border-border`, never raw hex values.

### Color

| Token | Value | Role |
| --- | --- | --- |
| `background` | `#080B18` | Page background |
| `surface` | `#10172A` | Cards and panels |
| `surface-raised` | `#171F38` | Menus, dialogs, elevated rows |
| `surface-hover` | `#1D2744` | Hover state for interactive rows |
| `foreground` | `#F4F6FF` | Primary text |
| `muted` | `#A8B2CC` | Secondary text |
| `subtle` | `#6B779A` | Metadata, labels, hints |
| `border` | `rgba(148,163,184,0.16)` | Default hairline |
| `border-strong` | `rgba(148,163,184,0.28)` | Emphasized separation |
| `violet` | `#8B5CF6` | Primary action, brand |
| `cyan` | `#22D3EE` | Info, booking confirmation, QR |
| `teal` | `#34D399` | Success and completion |
| `coral` | `#FB7185` | Destructive and cancellation |
| `amber` | `#FBBF24` | Attention and platform console |

The same palette is available to non-CSS consumers through `brandPalette` in `src/config/brand.ts`. Keep the two in sync when changing brand colors.

### Typography

- Sans: the Next.js font variable `--font-brand`, falling back to the system UI stack.
- Mono: `--font-mono-brand`, used for tokens, QR references and numeric identifiers.
- Headings are tight (`tracking-tight`) and bold. Eyebrows are uppercase, 10–11 px, wide tracking and `text-subtle`.
- Body copy uses `text-muted`; primary content uses `text-foreground`.

### Radius, spacing and elevation

- `--radius-sm` 8 px, `--radius-md` 12 px, `--radius-lg` 16 px, `--radius-xl` 20 px, `--radius-2xl` 28 px.
- Cards use `rounded-2xl` and `p-5`/`p-6`; inputs are 40–44 px tall with `rounded-xl`.
- Section rhythm is `space-y-5` inside a card and `space-y-7` between page sections.
- Elevation is expressed through layered gradients and colored shadows, not opaque drop shadows.

### Utility classes

Defined in `globals.css`:

| Utility | Use |
| --- | --- |
| `glass` | Standard translucent panel |
| `glass-strong` | Dialogs, menus and sticky chrome |
| `gradient-text` | Hero and metric emphasis |
| `surface-grid` | Masked grid behind hero content |
| `dot-grid` | Dense background texture |
| `glow-ring-violet`, `glow-ring-cyan` | Focused or highlighted cards |
| `hairline` | Gradient divider |
| `shimmer-bg` | Loading skeleton sweep |
| `mask-fade-b` | Fade the bottom of decorative art |
| `no-scrollbar` | Horizontal chip rows |

## Components

The UI kit mirrors the shadcn/ui composition style: Radix primitives, `class-variance-authority` variants, `cn()` for class merging, and `asChild` support where a link or button can stand in for the trigger.

### Primitives

| File | Exports and notes |
| --- | --- |
| `components/ui/button.tsx` | `Button` with `default`, `secondary`, `outline`, `ghost`, `destructive`, `cyan`, `teal`, `amber` variants and `sm`/`lg`/`icon` sizes; `loading` swaps in a spinner |
| `components/ui/badge.tsx` | `Badge` tones (`violet`, `cyan`, `teal`, `coral`, `amber`, `neutral`) and `StatusBadge` backed by `STATUS_STYLES` |
| `components/ui/card.tsx` | `Card`, `CardHeader`, `CardContent`, `CardFooter` |
| `components/ui/dialog.tsx` | Radix dialog with `DialogBody`, `DialogFooter`, `wide` size |
| `components/ui/alert-dialog.tsx` | Destructive confirmations |
| `components/ui/dropdown-menu.tsx` | Row actions and account menus |
| `components/ui/input.tsx` | `Input`, `Textarea`, `SelectNative` |
| `components/ui/select.tsx` | Radix select for richer option lists |
| `components/ui/label.tsx` | `Field` wrapper with label, hint and error |
| `components/ui/table.tsx` | Composable table primitives |
| `components/ui/tabs.tsx` | Workspace and console tabs |
| `components/ui/toggle.tsx` | `Switch` and checkbox treatments |
| `components/ui/tooltip.tsx` | Short contextual help |
| `components/ui/avatar.tsx` | Profile imagery with fallback initials |
| `components/ui/misc.tsx` | `PageHeader`, `Separator`, section headings |
| `components/ui/empty-state.tsx` | Icon, title, description and a single next action |
| `components/ui/stat-card.tsx` | Metric tile with optional trend and accent |
| `components/ui/skeleton.tsx` | Layout-shaped loading placeholders |

### Product components

- `brand/logo.tsx`, `brand/qr-pattern.tsx` — brand mark and decorative QR art.
- `layout/public-header.tsx`, `public-footer.tsx`, `dashboard-shell.tsx` — the three shells.
- `marketing/*` — hero, feature bento, workflow, capabilities, final CTA.
- `booking/booking-flow.tsx` — multi-step service, branch, date, slot and dynamic-field flow.
- `booking/appointment-actions.tsx` — reschedule and cancel with policy-aware availability.
- `booking/qr-ticket.tsx` — printable QR ticket with token details.
- `manage/*` — scanner, queue board, services manager, schedules manager, staff manager, analytics charts, settings form.
- `platform/*` — organization review table, user role table, platform settings.
- `animations/reveal.tsx`, `count-up.tsx` — shared motion helpers.

## Patterns

### Page header

Every authenticated page starts with `PageHeader`: an optional eyebrow, a title, a one-sentence description and an actions slot. Keep actions to one primary button plus at most one secondary.

### Status

Use `StatusBadge` for any appointment, token or organization status. Never hand-roll status colors; add new statuses to `STATUS_STYLES` in `src/config/constants.ts` so every surface stays consistent.

### Cards and metrics

Cards group one job. A metric tile contains a label, a large value, a supporting sentence and an optional trend. Do not invent trends when there is no historical data; omit the trend instead.

### Tables

Tables are the dense view for appointments, tokens, staff, notifications and audit logs. On small screens, switch to stacked rows or a card list rather than horizontal scrolling for primary actions. When `status` filters are present, use the rounded chip row pattern from `/appointments`.

### Forms

- Use `Field` for every label/hint/error group.
- Validate on the server with Zod and surface field paths from the API envelope.
- Destructive actions use `AlertDialog` or a dialog with an explicit consequence sentence.
- Buttons show a loading state and disable repeat submission.

### Empty and setup states

`EmptyState` is required for every list. Setup problems use `SetupRequired` from the layouts, with the exact missing integration named and a link to the setup guide. An empty screen should always answer “what do I do next?”.

### QR presentation

QR surfaces use a white code field on a dark card. The reference is mono, grouped and copyable. The ticket page warns that the code refreshes on each load and that screenshots may stop working after a reissue.

## Motion

Motion for React is used in three places only:

- marketing reveals and hero art,
- count-up metrics,
- small feedback transitions such as the scanner line and pulse glow.

Rules:

- durations stay between 150 ms and 600 ms for UI feedback, longer only for ambient background motion;
- never animate layout-critical content in a way that blocks reading;
- use `will-change` sparingly;
- the global reduced-motion block shortens every animation and disables smooth scrolling.

## Accessibility

- Target WCAG 2.2 AA contrast on the dark surface. Do not place `text-subtle` on `surface-raised` for essential copy.
- All interactive elements are reachable by keyboard and show the violet focus ring.
- Icons that carry meaning have an accessible name; decorative icons are hidden.
- Dialogs and menus use Radix focus management and escape handling.
- Forms associate labels, hints and errors. Server errors are announced in a live region inside the form.
- The camera scanner always offers a manual reference input, so camera denial is never a dead end.
- Color is never the only status signal: the badge text names the state.

## Extending the system

1. Add or change a token in `globals.css` and, if it is brand-level, in `brandPalette`.
2. Add a variant to the relevant component rather than one-off classes in a page.
3. Add the status or role to `constants.ts` before using it in a badge or filter.
4. Write or update a component test when behavior changes, and check the page at 360 px, 768 px and 1440 px.
5. Keep new dependencies out of the client bundle unless the interaction requires them.
