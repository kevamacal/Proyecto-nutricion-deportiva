from collections.abc import Generator
from uuid import uuid4

import pytest

from src.backend.api.v1.schemas import FoodItemResponse, NutritionalInfoSchema
from src.backend.db.repository import food_repository


@pytest.fixture(autouse=True)
def setup_test_food_catalog() -> Generator[None]:
    """Autouse fixture to populate food_repository with test items before each test."""
    defaults = [
        ("Pechuga de pollo", "Meat", "g", 100.0, 165.0, 31.0, 0.0, 3.6, 0.0, 0.0, 74.0),
        (
            "Arroz blanco cocido",
            "Grains",
            "g",
            100.0,
            130.0,
            2.7,
            28.2,
            0.3,
            0.4,
            0.05,
            1.0,
        ),
        (
            "Huevo entero",
            "Dairy & Eggs",
            "unit",
            1.0,
            72.0,
            6.3,
            0.4,
            4.8,
            0.0,
            0.2,
            71.0,
        ),
        (
            "Pan de molde para sándwich",
            "Grains",
            "g",
            100.0,
            265.0,
            8.5,
            49.0,
            3.2,
            3.0,
            4.5,
            490.0,
        ),
        (
            "Jamón en lonchas (Chopped/Cocido)",
            "Processed Meats",
            "g",
            100.0,
            110.0,
            17.0,
            1.5,
            4.0,
            0.0,
            1.0,
            850.0,
        ),
        (
            "Queso en lonchas para sándwich",
            "Dairy & Eggs",
            "g",
            100.0,
            330.0,
            22.0,
            2.0,
            26.0,
            0.0,
            1.5,
            700.0,
        ),
    ]
    for (
        name,
        cat,
        unit,
        srv_sz,
        cal,
        prot,
        carb,
        fat,
        fib,
        sug,
        sod,
    ) in defaults:
        item_id = uuid4()
        food_repository.seed_test_item(
            FoodItemResponse(
                id=item_id,
                name=name,
                category=cat,
                default_unit=unit,
                is_custom=False,
                created_by_user_id=None,
                nutrition=NutritionalInfoSchema(
                    serving_size=srv_sz,
                    serving_unit=unit,
                    calories_kcal=cal,
                    protein_g=prot,
                    carbohydrates_g=carb,
                    fat_g=fat,
                    fiber_g=fib,
                    sugars_g=sug,
                    sodium_mg=sod,
                ),
            )
        )
    yield
    food_repository._items.clear()
