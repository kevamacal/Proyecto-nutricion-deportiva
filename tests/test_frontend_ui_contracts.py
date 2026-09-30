"""Static UI contract tests for the React frontend.

Covers the Frontend & UI Specialist mandates in AGENTS.md:

* Section 2.4 / MANDATORY FLOW-STATE TEST RULE: the empty-state and the
  populated-state render must be *distinct branches*, not the same component
  receiving zeroed data.
* Section 2.4 / Context Hierarchy: user-facing copy must not leak
  implementation jargon (LLM, backend engine names, raw identifiers).
* Section 4.1: the design-token layer referenced by components must actually
  exist, otherwise the scoreboard gauges silently render as invisible boxes.

These are source-level assertions, mirroring the AST approach already used by
``tests/test_deterministic_boundary.py``: the repository has no JS test runner,
and a missing CSS token is a build-time-invisible defect that only a contract
test can catch.
"""

import re
from pathlib import Path

import pytest

FRONTEND_SRC = Path(__file__).parent.parent / "src" / "frontend" / "src"


def _read(rel_path: str) -> str:
    path = FRONTEND_SRC / rel_path
    assert path.is_file(), f"Expected frontend file to exist: {rel_path}"
    return path.read_text(encoding="utf-8")


def _tsx_files() -> list[Path]:
    return sorted(FRONTEND_SRC.rglob("*.tsx"))


# ---------------------------------------------------------------------------
# Design token layer
# ---------------------------------------------------------------------------

#: Every ``var(--token)`` reference found in the component sources.
_VAR_REF_PATTERN = re.compile(r"var\(\s*(--[a-z0-9-]+)\s*\)")


def _declared_css_tokens() -> set[str]:
    css = _read("index.css")
    return set(re.findall(r"^\s*(--[a-z0-9-]+)\s*:", css, flags=re.MULTILINE))


def test_every_referenced_css_variable_is_declared():
    """Undeclared tokens resolve to an invalid value and are dropped by the browser.

    This is how ``--radius-sm`` silently became ``border-radius: 0`` across the
    whole app, and how ``.macro-bar-fill`` ended up with no background at all.
    """
    declared = _declared_css_tokens()
    referenced: dict[str, list[str]] = {}

    for tsx in _tsx_files():
        for token in _VAR_REF_PATTERN.findall(tsx.read_text(encoding="utf-8")):
            referenced.setdefault(token, []).append(tsx.name)

    missing = {
        token: files for token, files in referenced.items() if token not in declared
    }
    assert not missing, (
        "Components reference CSS variables that index.css never declares; "
        f"they will silently fall back to initial values: {missing}"
    )


@pytest.mark.parametrize(
    "class_name",
    ["macro-bar-track", "macro-bar-fill", "metric-input", "glass-card"],
)
def test_scoreboard_and_onboarding_classes_are_styled(class_name: str):
    """The scoreboard gauges and onboarding input must have real rules."""
    css = _read("index.css")
    assert f".{class_name}" in css, f"index.css is missing a rule for .{class_name}"


def test_macro_bar_has_per_macro_colors():
    """Each macronutrient needs its own gauge color, not one shared default."""
    css = _read("index.css")
    for variant in ("prot", "carb", "fat"):
        assert f".macro-bar-fill.{variant}" in css, (
            f"Missing gauge color for macro '{variant}'"
        )


# ---------------------------------------------------------------------------
# Disabled affordance
# ---------------------------------------------------------------------------


def test_disabled_buttons_have_a_visual_state():
    """A forward action blocked on validation must not look clickable."""
    css = _read("index.css")
    assert ".btn-scoreboard:disabled" in css
    assert "cursor: not-allowed" in css


# ---------------------------------------------------------------------------
# AGENTS.md 2.4 - empty vs populated states must be distinct branches
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("component", "collection"),
    [
        ("components/Dashboard/DashboardOverview.tsx", "loggedMeals"),
        ("components/Sports/LoggedWorkoutsTimeline.tsx", "activities"),
        ("components/PantryManager.tsx", "items"),
    ],
)
def test_empty_state_is_a_distinct_branch_with_its_own_action(
    component: str, collection: str
):
    """Guards against the empty-dashboard anti-pattern.

    The empty state must be gated on a real ``length === 0`` check, must not
    reuse the populated markup, and must offer the action that resolves it.
    """
    source = _read(component)
    empty_guard = re.search(
        rf"{collection}\.length\s*===\s*0\s*\?", source, flags=re.DOTALL
    )
    assert empty_guard, (
        f"{component} must branch on a real `{collection}.length === 0` check "
        "instead of rendering the populated layout with zeroed data"
    )

    empty_branch = source[empty_guard.start() : empty_guard.start() + 2000]
    assert "onClick" in empty_branch, (
        f"{component} empty state is inert: it must offer the action that fills it"
    )


def test_onboarding_states_render_distinct_screens_not_a_zeroed_dashboard():
    """ONBOARDING_* states must return their own wizard screens."""
    app = _read("App.tsx")
    for state, screen in [
        ("ONBOARDING_PROFILE", "<ProfileWizard"),
        ("ONBOARDING_TARGETS", "<TargetsConfirmation"),
        ("PANTRY_EMPTY_GUIDED", "<GuidedPantrySetup"),
    ]:
        assert f"appState === '{state}'" in app, (
            f"App.tsx no longer branches on {state}"
        )
        assert screen in app, f"{state} must render {screen}, not the dashboard"


# ---------------------------------------------------------------------------
# One action, one meaning
# ---------------------------------------------------------------------------


def test_registrar_comida_has_a_single_entry_point():
    """Two modals with the same label but different behaviour is not intuitive.

    ``PantryManager`` used to ship its own meal modal that persisted zero
    calories, while the dashboard used ``MealLoggingModal`` which computes real
    macros. The pantry now delegates to the shared builder.
    """
    pantry = _read("components/PantryManager.tsx")
    assert "onOpenMeal" in pantry, (
        "PantryManager must delegate to the shared meal builder"
    )
    assert "logMeal" not in pantry, (
        "PantryManager must not log meals itself; it would persist zero macros"
    )
    assert "MealLoggingModal" not in pantry, (
        "PantryManager must not declare a second meal modal"
    )
    assert "alert(" not in pantry, (
        "Errors must be shown inline, not via a native alert()"
    )


def test_meal_logging_modal_computes_real_macros():
    """Guard the behaviour the removed duplicate used to skip."""
    modal = _read("components/Meals/MealLoggingModal.tsx")
    assert "total_calories_kcal: roundedTotals.calories" in modal, (
        "The meal builder must submit computed calories, not zeros"
    )
    assert "total_protein_g: roundedTotals.protein" in modal


# ---------------------------------------------------------------------------
# Professional voice - no implementation jargon in user-facing copy
# ---------------------------------------------------------------------------

#: Phrases that expose the engine's internals to the athlete.
FORBIDDEN_USER_FACING_PHRASES = [
    "sin LLM",
    "LLM",
    "motor backend",
    "Motor Backend",
    "Backend Output",
    "mifflin-st jeor",
    "Mifflin-St Jeor",
    "multiplicador PAL",
    "Conectando a Supabase",
    "determinísticamente",
    "motor determinista",
    "biometría",
]


def _jsx_text_content(source: str) -> str:
    """Extract human-visible text from JSX, dropping code-only regions."""
    without_code = re.sub(r"\{[^{}]*\}", " ", source)
    return re.sub(r"\s+", " ", without_code)


@pytest.mark.parametrize("tsx", _tsx_files(), ids=lambda p: p.name)
def test_no_implementation_jargon_reaches_the_user(tsx: Path):
    """AGENTS.md 2.3 keeps math out of prompts; the same courtesy applies to copy.

    The athlete needs "energía en reposo", not the name of the equation used to
    derive it. Architecture vocabulary belongs in the PR description, not on
    screen.
    """
    visible = _jsx_text_content(tsx.read_text(encoding="utf-8"))
    found = [p for p in FORBIDDEN_USER_FACING_PHRASES if p in visible]
    assert not found, (
        f"{tsx.name} exposes implementation jargon to the athlete: {found}. "
        "Describe the outcome the user cares about instead."
    )


def test_raw_user_identifier_is_not_rendered():
    """A raw UUID is engineering residue, not something an athlete needs."""
    profile = _read("components/Profile/ProfileOnboarding.tsx")
    assert "ID: ${user.id}" not in profile, (
        "Do not render the raw user id to the athlete"
    )


# ---------------------------------------------------------------------------
# Accessibility floor
# ---------------------------------------------------------------------------


def test_onboarding_choice_buttons_expose_pressed_state():
    """Single-choice steps must announce their selection to assistive tech.

    Every button whose selected styling is driven by a conditional ``primary``
    class has to also carry ``aria-pressed``; otherwise the current choice is
    communicated by color alone.
    """
    wizard = _read("components/Flow/ProfileWizard.tsx")

    toggle_buttons = [
        block
        for block in re.findall(r"<button\b.*?</button>", wizard, flags=re.DOTALL)
        if "'primary' : ''" in block
    ]
    assert len(toggle_buttons) >= 4, (
        "Expected the profile wizard to render choice buttons for sex, activity "
        "level and goal"
    )

    missing = [b for b in toggle_buttons if "aria-pressed=" not in b]
    assert not missing, (
        "Choice buttons in the profile wizard must set aria-pressed so the "
        f"selected option is not conveyed by color alone ({len(missing)} missing)"
    )


def test_reduced_motion_is_respected():
    css = _read("index.css")
    assert "prefers-reduced-motion: reduce" in css


# ---------------------------------------------------------------------------
# Scoreboard hierarchy - sports_nutrition_ui_direction
# ---------------------------------------------------------------------------


def test_dashboard_has_exactly_one_thick_rule():
    """ "Thick rule = hierarchy" only means something if there is exactly one.

    Four panels distinguished only by a coloured top border is the
    generated-design tell: nothing is more important than anything else, and
    the remaining-calories number ends up carrying the same weight as the
    pantry item count.
    """
    dashboard = _read("components/Dashboard/DashboardOverview.tsx")
    assert "panel-scoreboard" in dashboard, (
        "The balance panel must carry the thick rule"
    )
    assert "borderTop: '3px" not in dashboard, (
        "No dashboard panel may define its own coloured top border; hierarchy "
        "comes from the single .panel-scoreboard rule and from hairlines"
    )
    assert dashboard.count("panel-scoreboard") == 1, (
        "Exactly one panel per view may claim the thick rule"
    )


def test_side_column_panels_do_not_claim_hierarchy():
    """Panels rendered beside the balance must defer to it."""
    for component in [
        "components/Common/WaterIntakeCard.tsx",
        "components/Sports/LoggedWorkoutsTimeline.tsx",
    ]:
        source = _read(component)
        assert "borderTop: '3px" not in source, (
            f"{component} renders inside the dashboard's side column and must "
            "not draw its own thick rule"
        )
        assert "panel-eyebrow" in source, (
            f"{component} must use the shared eyebrow anatomy so side-column "
            "panels match the main column"
        )


def test_macro_gauges_live_inside_the_balance_panel():
    """Three equal cards for macros reads as an index, not a scoreboard.

    The gauges belong inside the balance, divided by hairlines, so the whole
    balance is one continuous readout.
    """
    dashboard = _read("components/Dashboard/DashboardOverview.tsx")
    assert "gauges.map" in dashboard, "Gauges must be rendered from one shared list"
    assert dashboard.count("panel-card") <= 3, (
        "The dashboard must merge related panels rather than stack one card per "
        "metric; balance + meals + pantry is the expected count"
    )
    for hairline in ("panel-divider",):
        assert dashboard.count(hairline) >= 2, (
            "The balance panel separates its sections with hairlines, not cards"
        )


def test_gauge_rows_share_a_left_edge():
    """A donut has no baseline; a row does. No ring charts in this design."""
    dashboard = _read("components/Dashboard/DashboardOverview.tsx")
    for chart in ("conic-gradient", "donut", "PieChart", "polar"):
        assert chart not in dashboard, (
            f"Macronutrients must use horizontal fuel gauges, not '{chart}'"
        )


def test_macro_targets_are_whole_grams():
    """A target of "522.15g" is a rounding artefact leaking into the UI.

    Targets arrive from the backend as floats. An athlete reads a target, not a
    float, and the extra precision makes the scoreboard look unfinished.
    """
    dashboard = _read("components/Dashboard/DashboardOverview.tsx")
    for target in ("protein_g", "carbohydrates_g", "fat_g"):
        assert f"target: Math.round(dailyTargets.{target})" in dashboard, (
            f"Macro target {target} must be rounded for display"
        )


def test_only_one_primary_action_per_dashboard_view():
    """ "Spend the boldness in one place."

    The desktop screenshot had two ember-filled buttons competing: the balance's
    primary action and the workouts empty-state button. An empty state repeats
    an action, it does not re-declare it as the page's primary.
    """
    for component in [
        "components/Dashboard/DashboardOverview.tsx",
        "components/Sports/LoggedWorkoutsTimeline.tsx",
    ]:
        source = _read(component)
        assert "btn-action-pill primary" not in source, (
            f"{component} must not add a second ember-filled action; the balance "
            "panel owns the view's single primary action"
        )


# ---------------------------------------------------------------------------
# Desktop layout
# ---------------------------------------------------------------------------


def test_desktop_gets_a_second_column_not_a_wider_one():
    """A wider single column is the lazy fix; the side column is the real one."""
    css = _read("index.css")
    assert "@media (min-width: 1024px)" in css, "There is no desktop breakpoint"
    assert "grid-template-columns: 1fr 320px" in css, (
        "The desktop dashboard must be 1fr / 320px, never a 50/50 split"
    )
    assert "max-width: 1120px" in css, "The container must grow on desktop"


def test_bottom_nav_is_hidden_on_desktop():
    """A fixed bottom bar with reserved padding is the wrong model for a pointer.

    This originally asserted only that `.mobile-bottom-nav` appeared *somewhere*
    inside the media query. It passed while both nav bars were rendering,
    because the base `display: flex` rule sat *after* the media query and won on
    source order. Order is now part of the assertion.
    """
    css = _read("index.css")

    base = re.search(r"^\.mobile-bottom-nav\s*\{[^}]*\}", css, flags=re.MULTILINE)
    assert base, "Missing base .mobile-bottom-nav rule"

    override = re.search(
        r"@media \(min-width: 1024px\)\s*\{\s*[^}]*?\.mobile-bottom-nav\s*\{[^}]*?display: none",
        css,
        re.DOTALL,
    )
    assert override, ".mobile-bottom-nav must be hidden at desktop widths"
    assert override.start() > base.start(), (
        "The desktop override must come AFTER the base rule; both are "
        "single-class selectors, so a preceding override silently loses"
    )


def test_only_one_nav_is_visible_at_each_width():
    """The bug visible in the desktop screenshot: the bottom bar and the top nav
    rendered together, because two same-specificity rules contradicted and the
    later one won.
    """
    css = _read("index.css")
    desktop = css[css.index("@media (min-width: 1024px)") :]

    hidden = set(re.findall(r"\.([a-z-]+)\s*\{\s*display: none", desktop))
    shown = set(re.findall(r"\.([a-z-]+)\s*\{\s*display: flex", desktop))

    assert "mobile-bottom-nav" in hidden, "Bottom nav must be hidden on desktop"
    assert "desktop-nav" in shown, "Segmented nav must be shown on desktop"
    assert not hidden & shown, (
        f"Classes cannot be both shown and hidden at desktop widths: {hidden & shown}"
    )


def test_navigation_labels_have_a_single_source_of_truth():
    """The two nav models must not drift apart."""
    app = _read("App.tsx")
    assert "NAV_ITEMS" in app
    assert app.count("NAV_ITEMS.map") == 2, (
        "Both the desktop and mobile nav must render from NAV_ITEMS"
    )


def test_nav_visibility_is_owned_by_one_class():
    """Guards a real bug: `.nav-segment` setting `display` after `.desktop-nav`
    hid it, so the desktop segmented nav also rendered on phones.

    Two rules with equal specificity means the outcome depends on source order,
    which is not something a reader should have to verify.
    """
    css = _read("index.css")

    nav_segment = re.search(r"\.nav-segment\s*\{[^}]*\}", css)
    assert nav_segment, "Missing .nav-segment rule"
    assert "display:" not in nav_segment.group(0), (
        ".nav-segment must not set display: .desktop-nav owns visibility in "
        "both directions, otherwise source order decides the outcome"
    )

    desktop_nav = re.search(r"\.desktop-nav\s*\{[^}]*\}", css)
    assert desktop_nav and "display: none" in desktop_nav.group(0), (
        ".desktop-nav must be hidden by default (mobile)"
    )
    assert re.search(
        r"@media \(min-width: 1024px\)\s*\{[^@]*?\.desktop-nav\s*\{[^}]*display: flex",
        css,
        re.DOTALL,
    ), ".desktop-nav must become visible at desktop widths"


def test_scoreboard_grid_works_without_the_desktop_media_query():
    """The grid is a desktop upgrade, not a dependency.

    If `.scoreboard-grid` is only styled inside the media query, mobile gets an
    unstyled block element and the two columns collapse together with no gap
    between them.
    """
    css = _read("index.css")
    desktop_start = css.index("@media (min-width: 1024px)")

    base_rule = re.search(r"\.scoreboard-grid\s*\{[^}]*\}", css[:desktop_start])
    assert base_rule, (
        ".scoreboard-grid needs a base rule so mobile keeps column spacing"
    )
    assert "gap:" in base_rule.group(0), (
        "Without a base gap, the main and side columns touch on mobile"
    )
    assert "flex-direction: column" in base_rule.group(0), (
        "Mobile must stack the two columns"
    )


# ---------------------------------------------------------------------------
# The visual spec must exist
# ---------------------------------------------------------------------------


def test_visual_identity_spec_is_present_and_not_overwritten():
    """The drift this issue fixes started because these files were misfiled.

    `sports_nutrition_ui_direction/SKILL.MD` held the *flow* document, and the
    flow path referenced by AGENTS.md 2.4 did not exist, so the visual identity
    was written nowhere.
    """
    skills = Path(__file__).parent.parent / "skills"

    ui_spec = skills / "sports_nutrition_ui_direction" / "SKILL.md"
    assert ui_spec.is_file(), f"Missing visual identity spec: {ui_spec}"
    ui_text = ui_spec.read_text(encoding="utf-8")
    assert "UI Direction" in ui_text, (
        "sports_nutrition_ui_direction must document the visual identity, not the flow"
    )
    assert "Canonical application states" not in ui_text, (
        "The flow document has leaked back into the UI direction spec"
    )

    flow_spec = skills / "sports_nutrition_flow_direction" / "SKILL.md"
    assert flow_spec.is_file(), (
        f"AGENTS.md 2.4 references {flow_spec}, which must exist"
    )
    assert "Canonical application states" in flow_spec.read_text(encoding="utf-8")

    agents = Path(__file__).parent.parent / "AGENTS.md"
    assert "sports_nutrition_flow_direction/SKILL.md" in agents.read_text(
        encoding="utf-8"
    )
