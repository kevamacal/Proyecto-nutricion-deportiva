"""AST static audit test verifying deterministic boundaries in backend math engine.

Enforces zero LLM SDK imports or generative model calls inside calculation path modules under src/backend/core/ and src/backend/sports/.
"""

import ast
from pathlib import Path

FORBIDDEN_MODULE_PREFIXES = {
    "openai",
    "anthropic",
    "google.generativeai",
    "langchain",
    "llama_index",
    "ollama",
    "litellm",
}


def _get_python_files():
    base_dir = Path(__file__).parent.parent / "src" / "backend"
    core_files = list((base_dir / "core").rglob("*.py"))
    sports_files = list((base_dir / "sports").rglob("*.py"))
    return core_files + sports_files


def test_zero_llm_imports_in_calculation_modules():
    """Verify no LLM client SDK imports exist inside calculation modules."""
    files = _get_python_files()
    assert len(files) > 0, "No backend python calculation files found"

    for file_path in files:
        tree = ast.parse(file_path.read_text(encoding="utf-8"), filename=str(file_path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    for forbidden in FORBIDDEN_MODULE_PREFIXES:
                        assert not alias.name.startswith(forbidden), (
                            f"Forbidden LLM import '{alias.name}' found in {file_path}"
                        )
            elif isinstance(node, ast.ImportFrom) and node.module:
                for forbidden in FORBIDDEN_MODULE_PREFIXES:
                    assert not node.module.startswith(forbidden), (
                        f"Forbidden LLM import from '{node.module}' found in {file_path}"
                    )
