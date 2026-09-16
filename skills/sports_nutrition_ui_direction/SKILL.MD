Skill: Sports Nutrition Flow Direction
Purpose

sports_nutrition_ui_direction defines how a screen should look (tokens, ledger/scoreboard layout). It does not define which screen the user should be looking at, or how the app moves between them. This skill fills that gap: it turns the app into a state machine driven by real backend data, instead of one dashboard that always renders everything — populated or not — at once.

Run this skill before sports_nutrition_ui_direction: first decide what state the user is in and what flow step that implies, then apply the visual tokens to that specific step.

Core rule

Never render the full dashboard as the default view. Always derive the current view from the user's actual data state. If you find yourself passing zeros or empty arrays into the same component that shows real data, stop — that is the empty-dashboard anti-pattern this skill exists to prevent.

Canonical application states
State	Condition (backend data)	What the user must see
ONBOARDING_PROFILE	No profile record exists for the user	Single-step-at-a-time profile wizard (age, sex, weight, height, activity level, goal). No dashboard chrome visible yet.
ONBOARDING_TARGETS	Profile exists, but targets (BMR/TDEE/macros) haven't been calculated/confirmed	A single confirmation screen showing the calculated targets (from the deterministic backend engine) with an explicit "Confirmar objetivos" action — not buried inside a wider dashboard.
PANTRY_EMPTY_GUIDED	Profile + targets confirmed, but pantry has zero items	Dashboard chrome may appear, but the primary panel is a guided "añade tus primeros alimentos" flow (receipt OCR upload or manual quick-add), not an empty ledger card with a placeholder message.
ACTIVE_NO_LOGS_TODAY	Pantry has items, but no meals/sessions logged today	Full dashboard, but calorie/macro ledger explicitly reads as "not started today" (e.g. full-width empty gauge with a clear call to action), distinguished visually from a day in progress — not the same bar at 0%.
ACTIVE_IN_PROGRESS	At least one meal or session logged today	Full ledger/scoreboard dashboard as designed in sports_nutrition_ui_direction, populated with real running totals.
AGENT_QUERY_IN_FLIGHT	User has sent a message to the LangGraph orchestrator and a response is pending	Chat view shows the routing in progress (see "Agent chat feedback" below) — never a frozen input with no feedback.

Treat this table as the source of truth for "what screen renders" — a component that ignores this and renders ACTIVE_IN_PROGRESS's layout regardless of state is a bug, not a design choice.

Step-by-step wizards (ONBOARDING_PROFILE, ONBOARDING_TARGETS, PANTRY_EMPTY_GUIDED)
One question or one decision per screen. Do not group multiple unrelated fields (e.g. weight + activity level + goal) into a single step just to reduce step count.
Persist progress after every step (so a refresh or a later session resumes where the user left off — read from backend state, don't rely on local-only state for this).
Forward navigation is only enabled once the current step's data is valid (use the same Pydantic validation the backend enforces; don't re-invent looser client-side rules).
Always show where the user is in the sequence (e.g. a slim progress rule at the top consistent with the ledger's "thick rule = hierarchy" language from sports_nutrition_ui_direction — not a generic numbered-dot stepper, to stay consistent with that skill's typographic direction).
Backward navigation must always be available and must not discard already-valid data.
Transitions and motion (this overrides frontend-design's general motion restraint for these specific cases)

frontend-design and sports_nutrition_ui_direction are right that decorative motion (hover-lift on every card, fade-up-on-scroll) is a generic AI tell and should be avoided. That guidance is about decorative motion. It does not apply to structural motion that carries the user between application states — that motion is load-bearing, not decorative, and is required here:

Step-to-step transition (wizards): slide + fade, ~220–280ms, ease-out on enter / ease-in on exit. The outgoing step slides toward the direction of travel (forward = exits left, back = exits right) so the user's sense of direction in the flow is never ambiguous.
State-to-state transition (e.g. PANTRY_EMPTY_GUIDED → ACTIVE_NO_LOGS_TODAY after the first item is added): the dashboard chrome should assemble in — e.g. the ledger rules draw in top-to-bottom, ~300–400ms — rather than popping in fully formed. This is the "one orchestrated moment" frontend-design explicitly allows, and it should be spent here, not on a generic page-load animation.
Data-driven change within a state (macro bar filling after logging a meal, session added to today's log): animate the bar/number transition itself (~300ms ease-out), matching sports_nutrition_ui_direction's existing "motion reserved for state changes the user caused" principle. This was already correctly specified — keep it as-is.
Do not add entrance animation to elements that were already visible before the state change. Only what actually changed should move.
Implementation: use a single animation approach consistently across the app (e.g. Framer Motion if React) rather than mixing CSS transitions and a JS library across different screens.
Respect prefers-reduced-motion for all of the above, per frontend-design's accessibility floor — swap slides/draw-ins for simple opacity crossfades.
Agent chat feedback (AGENT_QUERY_IN_FLIGHT)
The chat must show which part of the LangGraph flow is executing when it's slower than an instant reply (e.g. "Consultando tu inventario…" while inventory_node runs, "Generando receta…" while recipe_node runs), sourced from real orchestrator step events, not a generic spinner with static text.
If the orchestrator's routing touches multiple nodes for one query (e.g. basketball_node → nutrition_node → inventory_node → recipe_node), reflect that as a short sequence of state labels, not a single unlabeled loading state — this doubles as a truthful, low-effort way to make the multi-agent architecture visible to the user instead of hiding it behind one spinner.
Checklist before opening a PR for any screen
Which row of the canonical states table does this screen correspond to?
Does the component branch on real backend state, or does it just receive different prop values into the same always-rendered layout?
If this is a wizard, is there exactly one decision per step, and is progress resumable from backend state?
Does every animation added correspond to an actual state or data change — not a decorative default?
Has prefers-reduced-motion been checked?
When to trigger
Any time the Frontend & UI Specialist Agent starts a new screen, resolves a UI-related GitHub issue, or is asked to "connect" a screen to real backend/session state.
Always in the same pass as sports_nutrition_ui_direction, and before it: decide the state/step first, then style it.