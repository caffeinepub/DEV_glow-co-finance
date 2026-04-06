# Design Brief

## Direction

**Dashboard Elevated** — A refined, purpose-driven financial dashboard with dark foundation, botanical accents for profit/positive states, and strategic red for risk.

## Tone

Refined minimalism with information hierarchy. Dark mode primary, clean card composition, green + red semantics for financial clarity without sacrificing elegance.

## Differentiation

Botanical green primary (not generic blue) signals health + growth; strategic red for overdue/losses; dark sidebar navigation with elevated card surfaces create visual zones and depth.

## Color Palette

| Token         | OKLCH           | Role                            |
| ------------- | --------------- | ------------------------------- |
| background    | 0.14 0.02 260   | Page base, deep charcoal        |
| foreground    | 0.92 0.01 260   | Primary text, high contrast     |
| card          | 0.18 0.025 260  | Elevated surfaces, data zones   |
| primary       | 0.55 0.18 145   | Profit, success, positive KPIs  |
| secondary     | 0.22 0.02 260   | Neutral secondary actions       |
| muted         | 0.22 0.02 260   | Labels, inactive, low emphasis  |
| accent        | 0.72 0.14 85    | Alerts, call-to-action accents  |
| destructive   | 0.55 0.22 25    | Overdue, losses, errors         |
| success       | 0.6 0.16 150    | Charts, positive indicators     |
| warning       | 0.72 0.15 85    | Attention-needed flags          |

## Typography

- **Display**: Space Grotesk — modern, geometric, dashboard-forward headings and KPI labels
- **Body**: Plus Jakarta Sans — clean, readable, professional body text and UI labels
- **Mono**: JetBrains Mono — transaction codes, financial amounts, data precision
- **Scale**: Hero `text-5xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl font-bold`, label `text-xs uppercase tracking-widest`, body `text-base`

## Elevation & Depth

Multi-layer card surfaces with subtle shadows (`shadow-card`, `shadow-elevated`) create hierarchy without visual clutter. Sidebar darkest, cards elevated above main background, borders at `border: 1px` for precision.

## Structural Zones

| Zone    | Background          | Border              | Notes                                   |
| ------- | ------------------- | ------------------- | --------------------------------------- |
| Sidebar | sidebar (0.12)      | sidebar-border      | Dark, fixed nav; green active states    |
| Header  | card (0.18)         | border              | Title, breadcrumb, action zone          |
| Content | background (0.14)   | —                   | Spacious grid, card-based sections      |
| Cards   | card (0.18)         | border (subtle)     | KPI cards, tables, chart containers     |
| Footer  | muted-bg (0.22)     | border              | Secondary info, pagination, metadata    |

## Spacing & Rhythm

Grid-based: 16px base unit. Section gaps `gap-6 md:gap-8`, card padding `p-6`, micro-spacing `gap-2 gap-4` for component internals. Spacious vertical rhythm for reading comfort; compact horizontal density for data tables.

## Component Patterns

- **Buttons**: Primary (green), secondary (border), destructive (red). Rounded `rounded-md`, padding `px-4 py-2`. Hover: opacity + translate-y-0.5
- **Cards**: `bg-card border border-border rounded-lg shadow-card p-6`. White text on dark background, high contrast
- **KPI Cards**: Large number `text-kpi-lg text-primary` or `text-destructive`, label `text-label text-muted-foreground`, badge for status
- **Tables**: Striped alternation, condensed padding, sortable headers, selection checkboxes
- **Badges**: Success (green), warning (amber), destructive (red) — `badge-success`, `badge-warning`, `badge-destructive`

## Motion

- **Entrance**: Fade + translate-y on page load, 200ms ease-out
- **Hover**: Button/link scale 1.02, shadow lift, 150ms smooth
- **Decorative**: None — focus on clarity and information hierarchy

## Constraints

- **No decoration** — all visual elements serve function (hierarchy, state, grouping)
- **Green + red only** — botanical green for profit, coral-red for risk; muted greys for neutral
- **High contrast** — text on cards must be 0.92 foreground on 0.18 card (AA+++)
- **Mobile-responsive** — sidebar collapses to nav drawer on mobile, cards stack, typography scales

## Signature Detail

Botanical green primary (#65B46E in hex equivalent) signals health and growth in a financial context — replacing generic corporate blue. Pairs with dark sidebar for sophisticated, modern finance UI.

