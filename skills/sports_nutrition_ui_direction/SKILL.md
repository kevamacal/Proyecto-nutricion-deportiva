---
name: sports_nutrition_ui_direction
description: Visual identity for the Sports Bioenergetics platform — how the hardwood court, the scoreboard ledger, and the nutrition label are expressed in type, colour, rule and space.
---

# Sports Nutrition UI Direction

How a screen **looks**: tokens, the scoreboard ledger layout, the fuel-gauge
readout, the navigation model. It does not decide which screen the user should
be looking at — that is
[`sports_nutrition_flow_direction`](../sports_nutrition_flow_direction/SKILL.md).
Decide the state first, then style that state.

> This file previously contained the flow-direction document by mistake, which is
> why the visual identity below went unwritten for several sprints and the
> dashboard drifted toward generic cards. Do not move these documents around
> again; the paths are referenced from `AGENTS.md` §2.4.

## The subject

An athlete checks this on a phone in a locker room, or on a laptop the night
before, tired, between sets. The interface has to be readable at a glance and
honest about numbers. It is a **scoreboard**, not a wellness app: no
celebratory gradients, no motivational copy, no confetti when you log a meal.
The tone is that of the board above the court.

## Type

Two families, both already loaded:

- **Barlow Condensed** — the scoreboard voice. Only for numeric readouts, the
  date, the wordmark, and section eyebrows sitting above a rule.
- **Public Sans** — everything else, sentence case.

Condensed uppercase is **earned, not sprayed.** It is correct on a value, a nav
label, or an eyebrow over a rule, because that is where a real arena board uses
it. It is wrong on a card heading. Applying `text-transform: uppercase` to every
`panel-title` in the app is the single most common way this design loses its
hierarchy: when everything shouts, the calories do not stand out, and the
protein number ends up carrying the same visual weight as the pantry count.

**Budget the boldness in one place.** The remaining-calories number is the
memorable element. Keep every panel title quieter than it, and the eyebrow rules
quieter still.

## Colour

Surfaces, not accents, carry the structure:

| Role | Token | Hex |
| --- | --- | --- |
| Page | `--bg-court` | `#171511` |
| Panel | `--surface-hardwood` | `#2A2118` |
| Nested row inside a panel | `--surface-card` | `#221B14` |
| Primary ink | `--ink-primary` | `#F2EFE6` |
| Secondary ink | `--ink-secondary` | `#C9C3B6` |
| Muted ink | `--ink-muted` | `#A39D90` |

Accent hues are **functional labels, never decoration.** Each one means
something specific, and that meaning must not drift:

| Accent | Token | Means |
| --- | --- | --- |
| Ember | `--accent-ember` | Protein, and the single primary action in view |
| Gold | `--accent-gold` | Carbohydrates |
| Lake | `--accent-lake` | Fat, and hydration |
| Moss | `--accent-moss` | Something successfully logged |
| Crimson | `--accent-crimson` | Destructive / error only |

Never introduce a new hue to fill a gap. If a new colour feels necessary, the
gap is almost always a missing rule or a missing weight, not a missing colour.

## Rules and hierarchy

**"Thick rule = hierarchy."** This is the load-bearing rule of the design.

- One **thick** top rule (3px), and only on the primary scoreboard panel of a
  view. There is exactly one per screen.
- Everything else is separated by **hairline** rules (`--line-graphite`).
- Never a stack of identical cards distinguished only by a coloured top border.
  That is the generated-design tell: content chopped into equal tiles where
  nothing is more important than anything else. If a panel needs a top border to
  be noticed, the panel is not correctly ordered.
- Prefer a **divider inside a panel** over a **new panel**. Reach for the second
  card only when the content is genuinely a different kind of thing.

## The fuel gauge

Macronutrients are horizontal **fuel-gauge rows**, never a donut or a ring
chart. A donut has no baseline to compare against and the centre becomes a
decorative donut hole; a row starts at a shared left edge, so the three
progressions are directly comparable by eye.

Each row is: label · `consumed / target` · track · fill. The fill animates over
~300ms because it is the user watching their own action land. The track must be
a visible recessed slot, and the fill must have a colour — a bar with no
`background` renders as nothing at all, which is invisible rather than empty.

## Layout

**Mobile is the primary case.** Single column, 560px cap, fixed bottom
navigation. A thumb reaches the bottom of the screen; a mouse does not.

**Desktop earns its space with a second column, not a wider single one.** At
`≥1024px` the shell grows to ~1120px and the dashboard becomes:

```
┌────────────────────────────────────┐
│ wordmark          athlete · día     │
├──────────────────────┬─────────────┤
│ ▌BALANCE            │ HIDRATACIÓN  │  ▌ = thick rule, once
│  1840 kcal          │ ─────────── │  ─ = hairline
│  ───────────        │ ▇▇▇▇▇░░ 62%  │
│  proteína ▇▇▇▇▇░ 94g│ ├───────────┤
│  carbo.   ▇▇▇▇░░ 61g│ ENTRENOS    │
│  grasa    ▇▇░░░░ 28g│  (lista)    │
│  ───────────        ├───────────┤
│  [entreno] [comida] │ DESPENSA    │
├──────────────────────┤  (resumen) │
│  COMIDAS DE HOY      └───────────┘
│  (lista)             │
└──────────────────────┴─────────────┘
```

Rules:

- **1fr / 320px**, never a 50/50 split. The balance is the reason the athlete
  opened the app; the side column is context.
- Bottom navigation is mobile-only. On desktop it becomes a top segmented nav —
  a fixed bottom bar with 80px of reserved padding is the wrong model for a
  pointer, and it wastes a 1120px canvas.
- The header carries **who and when** (athlete name, today's date). A bar with a
  wordmark and nothing else is wasted vertical space.
- One action is primary per view: ember fill. Everything else is hairline or
  outline. Two primary buttons side by side means neither is.

## Panel anatomy

```
┌─────────────────────────────────────┐
│ eyebrow  ──────────────────────     │  small muted label, hairline beneath
│ Title                              │  Public Sans, sentence case, quiet
│                                     │
│ content                             │
│                                     │
│ ─────────────────────────────────── │  hairline separates
│ secondary action                    │  outline, never fill
└─────────────────────────────────────┘
```

Every panel header repeats the same anatomy. Consistency of the frame is what
lets the content inside vary without the page coming apart.

## Empty states

An empty screen is an invitation to act, not a report of absence. Every empty
state states what is missing and contains **the button that resolves it**,
labelled with the same words as the button elsewhere in the app. Inert text like
"no has registrado ingestas hoy" with no control is a dead end.

Distinct from the zeroed data case: an empty state is its own branch, never the
populated component fed zeros. See the flow-direction skill.

## Motion

- Motion is reserved for state changes **the user caused**: a gauge filling after
  a meal, a panel assembling when the first pantry item lands.
- No entrance animation on elements that were already visible. Only what changed
  moves.
- ~300ms `ease-out`. Honour `prefers-reduced-motion` with a crossfade.

## Checklist before opening a PR for any screen

- [ ] Is there exactly **one** thick rule in the view?
- [ ] Do the three macro rows share a left edge, and does the fill have colour?
- [ ] Is any condensed-uppercase label outside a readout, an eyebrow, or a nav item?
- [ ] Did I reach for a hairline where I wanted a second card?
- [ ] Does the empty state contain the action that fills it?
- [ ] Is there exactly one ember-filled button in view?
- [ ] Above 1024px: is the grid 1fr / 320px, and is the nav at the top?
- [ ] Is `prefers-reduced-motion` respected?
