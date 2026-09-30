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
