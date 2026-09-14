# Skill: Sports Nutrition UI Direction

## Purpose
`frontend-design` (installed at `.agents/skills/frontend-design/`) tells agents *how* to avoid generic AI aesthetics and *how* to derive a direction from the brief. This skill supplies the actual direction for this project, so every agent lands on the same visual identity instead of each one improvising — and so nobody defaults to the wellness-app cliché (cream background, terracotta accent, rounded soft-shadow cards, leaf icons).

Run this skill together with `frontend-design`, not instead of it: `frontend-design` still governs process (plan → critique against brief → build), accessibility floor, motion restraint, and copy voice. This document only fixes the tokens and layout concept that process should converge on for this specific product.

## Grounding concept
This product sits at the intersection of two real objects that already have a distinctive, legible visual language of their own — lean on them instead of a generic dashboard look:

1. **The nutrition facts label** — thick/thin horizontal rule hierarchy, left-aligned labels, right-aligned tabular numbers, dense but scannable.
2. **The sport scoreboard / split timer** — large, high-contrast condensed numerals, built for reading at a glance mid-activity.

Every screen that shows macros, calories, sets, reps, or time should look like it belongs to one of these two objects, not to a generic SaaS card.

## Design tokens

### Color (5 named hex values, not 4–6 generic ones — pick exactly these unless the brief overrides)
- `--bg-court: #171511` — near-black with a warm, slightly green-brown undertone (hardwood-under-lights, not the flat neutral #0B0B0B/#111 "tinted near-black" tell).
- `--surface-hardwood: #2A2118` — dark leather/oak brown, used for raised surfaces (cards, panels). Grounded in gym equipment materials, not a generic dark-mode grey.
- `--ink-chalk: #F2EFE6` — warm chalk white for text and rules on dark surfaces.
- `--accent-ember: #C1622B` — muted baked-clay orange (basketball leather / hardwood, deliberately duller than a bright SaaS orange). Reserve for the single most important number on a screen (e.g. calories remaining), never for decoration.
- `--accent-lake: #3E6E64` — deep teal-green for recovery/hydration states (cooldown, water intake). Never paired with `--accent-ember` in equal weight — one leads per screen.
- `--accent-flag: #B23A48` — muted brick red, used only for deficit/limit warnings, like a referee's flag. Never used as a default UI color.
- `--line-graphite: #4A473F` — mid-tone rule color for secondary dividers.

Explicitly avoid: cream/near-#F4F1EA backgrounds, terracotta near #D97757, bright acid-green or vermilion-on-black, and identical rounded cards with a uniform `rgba(0,0,0,.1)` shadow.

### Typography (roles, not just fonts)
- **Display / section headers / big stats:** a condensed grotesk with real personality — e.g. Barlow Condensed SemiBold, or Big Shoulders Display. Used for jersey-style numerals (calories remaining, PRs, current streak). Avoid Oswald by default; it's become the condensed-sans version of the cream/terracotta tell.
- **Body / ingredient lists / instructions:** a humanist sans with strong legibility at small sizes — Public Sans or IBM Plex Sans. Avoid defaulting to Inter; it's the single most common "AI default" body face and reads as templated the instant it's recognized.
- **All numeric data (macros, kcal, reps, sets, weights, times):** use tabular/lining figures via OpenType features on the chosen sans, not a separate monospace face. `frontend-design` explicitly flags "a monospace face for small data labels" as a generic tell — don't reach for it here even though the content is numeric. The one exception: a live rest-timer or workout-split countdown may use a monospace face, because that's the one place a "terminal/stopwatch" register is actually earned by the content, not decorative.

### Layout concept
```
Dashboard (ledger layout, not a card grid):
┌─────────────────────────────────────┐
│ TODAY                    ═══════════│ ← thick rule under page title
│ Calories remaining         1,240    │ ← --accent-ember, large condensed numeral, right-aligned
│ ─────────────────────────────────── │ ← thin rule
│ Protein        142g / 180g   ▓▓▓▓░  │ ← horizontal fuel-gauge bar, not a donut chart
│ Carbs          210g / 260g   ▓▓▓░░  │
│ Fat             48g /  70g   ▓▓░░░  │
│ ─────────────────────────────────── │
│ NEXT MEAL                            │
│ Grilled chicken bowl      12:30     │ ← left label / right tabular time, index-card style
└─────────────────────────────────────┘
```
- Left-align labels, right-align all numbers — this single rule does most of the work of feeling like a real nutrition label instead of a generic dashboard.
- Replace donut/pie macro charts with horizontal stacked or fuel-gauge bars; they read faster at a glance (the scoreboard influence) and avoid the now-common "three overlapping rings" motif.
- Recipe and meal cards: zero or minimal border-radius, a single hairline rule instead of a soft drop shadow — think index card / recipe box, not SaaS card kit. If you want one signature tactile detail, a subtle torn/perforated top edge on recipe cards is a reasonable place to "spend the one bold choice" `frontend-design` asks for — don't add a second one elsewhere on the same screen.
- Numbered markers (01/02/03) are earned only where content is genuinely sequential — a daily meal timeline or a workout's set order qualifies; a features list or a macro breakdown does not.

## Principles
1. Every visual device should encode real data hierarchy (rule weight = importance), not decorate an otherwise generic layout.
2. Spend the one bold, memorable choice per screen — usually the ledger/scoreboard treatment of the primary stat — and keep everything else quiet and disciplined around it.
3. Motion is reserved for state changes the user caused: a macro bar filling after logging a meal, a set being checked off. No default hover-lift or fade-up-on-scroll on every element.
4. Interface voice is a coach's voice: active, specific, no filler. "Log meal," "142g protein logged," not "Submit" or "Success!"
5. When a screen's draft starts resembling the generic AI defaults `frontend-design` calls out (cream+terracotta, rounded card grid, ALL-CAPS eyebrows, "→" on buttons), stop and re-derive it from the ledger/scoreboard concept above instead.

## When to trigger
- Any time the Frontend & UI Specialist Agent starts a new screen, component, or significant visual revision.
- Run in the same pass as `frontend-design`'s plan step — use these tokens as the starting point for that skill's "compact token system," rather than generating a new one from scratch each time.