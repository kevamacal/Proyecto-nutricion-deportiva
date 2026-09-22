import React, { useState, useEffect } from 'react';
import { Utensils, Flame, Plus, Trash2, BookOpen, Layers, Check, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchFoodCatalog,
  fetchRecipes,
  logMeal,
  saveRecipe,
  type CatalogFoodItem,
} from '../../services/supabaseApi';
import type { RecipeItem } from '../../types';
import { FoodSelectorModal, type SelectedBatchItem } from '../Food/FoodSelectorModal';
import { FoodImageFallback } from '../Common/FoodImageFallback';
import { BaseModal } from '../Common/BaseModal';

interface DraftIngredient {
  id: string;
  food_item_id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  base_serving_size: number;
  base_calories_kcal: number;
  base_protein_g: number;
  base_carbs_g: number;
  base_fat_g: number;
}

interface MealLoggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MealLoggingModal: React.FC<MealLoggingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'BUILDER' | 'PRESETS'>('BUILDER');
  const [mealType, setMealType] = useState<string>('LUNCH');
  const [mealName, setMealName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saveAsRecipe, setSaveAsRecipe] = useState<boolean>(false);

  const [catalog, setCatalog] = useState<CatalogFoodItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [draftIngredients, setDraftIngredients] = useState<DraftIngredient[]>([]);

  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial data load when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchFoodCatalog()
        .then((items) => {
          setCatalog(items);
          // Set initial default ingredient if draft is empty
          if (draftIngredients.length === 0 && items.length > 0) {
            const first = items[0];
            setDraftIngredients([
              {
                id: `ing_${Date.now()}_1`,
                food_item_id: first.food_item_id || first.id,
                name: first.name,
                category: first.category,
                quantity: 150,
                unit: first.default_unit || 'g',
                base_serving_size: first.nutrition?.serving_size || 100,
                base_calories_kcal: first.nutrition?.calories_kcal || 0,
                base_protein_g: first.nutrition?.protein_g || 0,
                base_carbs_g: first.nutrition?.carbohydrates_g || 0,
                base_fat_g: first.nutrition?.fat_g || 0,
              },
            ]);
            setMealName(first.name);
          }
        })
        .catch((err) => console.error('Error loading catalog:', err));

      fetchRecipes(user?.id)
        .then((recs) => setRecipes(recs))
        .catch((err) => console.error('Error loading recipes:', err));
    }
  }, [isOpen]);

  // Dynamic Real-time Aggregate Macronutrient Calculations
  const calculatedTotals = draftIngredients.reduce(
    (acc, ing) => {
      const factor = ing.quantity / (ing.base_serving_size || 100);
      return {
        calories: acc.calories + ing.base_calories_kcal * factor,
        protein: acc.protein + ing.base_protein_g * factor,
        carbs: acc.carbs + ing.base_carbs_g * factor,
        fat: acc.fat + ing.base_fat_g * factor,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const roundedTotals = {
    calories: Math.round(calculatedTotals.calories),
    protein: Math.round(calculatedTotals.protein * 10) / 10,
    carbs: Math.round(calculatedTotals.carbs * 10) / 10,
    fat: Math.round(calculatedTotals.fat * 10) / 10,
  };

  const handleBatchSelectIngredients = (items: SelectedBatchItem[]) => {
    const newIngredients: DraftIngredient[] = items.map(({ food, quantity, unit }, index) => ({
      id: `ing_${Date.now()}_${index}`,
      food_item_id: food.food_item_id || food.id,
      name: food.name,
      category: food.category,
      quantity,
      unit,
      base_serving_size: food.nutrition?.serving_size || 100,
      base_calories_kcal: food.nutrition?.calories_kcal || 0,
      base_protein_g: food.nutrition?.protein_g || 0,
      base_carbs_g: food.nutrition?.carbohydrates_g || 0,
      base_fat_g: food.nutrition?.fat_g || 0,
    }));

    setDraftIngredients((prev) => [...prev, ...newIngredients]);
    if (!mealName && newIngredients.length > 0) {
      setMealName(newIngredients[0].name);
    }
  };

  const handleSingleSelectIngredient = (food: CatalogFoodItem) => {
    const newIng: DraftIngredient = {
      id: `ing_${Date.now()}`,
      food_item_id: food.food_item_id || food.id,
      name: food.name,
      category: food.category,
      quantity: 100,
      unit: food.default_unit || 'g',
      base_serving_size: food.nutrition?.serving_size || 100,
      base_calories_kcal: food.nutrition?.calories_kcal || 0,
      base_protein_g: food.nutrition?.protein_g || 0,
      base_carbs_g: food.nutrition?.carbohydrates_g || 0,
      base_fat_g: food.nutrition?.fat_g || 0,
    };
    setDraftIngredients((prev) => [...prev, newIng]);
    if (!mealName) setMealName(food.name);
  };

  const handleUpdateIngredientQuantity = (id: string, quantity: number) => {
    setDraftIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, quantity: Math.max(0, quantity) } : ing))
    );
  };

  const handleUpdateIngredientUnit = (id: string, unit: string) => {
    setDraftIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, unit } : ing))
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setDraftIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const handleLoadPresetRecipe = (recipe: RecipeItem) => {
    setMealName(recipe.name);
    setImageUrl(recipe.image_url || '');
    setMealType(recipe.category in { BREAKFAST: 1, LUNCH: 1, DINNER: 1, SNACK: 1, POST_WORKOUT: 1 } ? recipe.category : 'LUNCH');

    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const loaded: DraftIngredient[] = recipe.ingredients.map((ing, idx) => ({
        id: `ing_rec_${Date.now()}_${idx}`,
        food_item_id: ing.food_item_id,
        name: ing.name,
        category: ing.category || 'General',
        quantity: ing.quantity,
        unit: ing.unit || 'g',
        base_serving_size: 100,
        base_calories_kcal: ing.quantity > 0 ? (ing.calories_kcal / ing.quantity) * 100 : ing.calories_kcal,
        base_protein_g: ing.quantity > 0 ? (ing.protein_g / ing.quantity) * 100 : ing.protein_g,
        base_carbs_g: ing.quantity > 0 ? (ing.carbohydrates_g / ing.quantity) * 100 : ing.carbohydrates_g,
        base_fat_g: ing.quantity > 0 ? (ing.fat_g / ing.quantity) * 100 : ing.fat_g,
      }));
      setDraftIngredients(loaded);
    } else {
      setDraftIngredients([
        {
          id: `ing_rec_${Date.now()}`,
          name: recipe.name,
          category: recipe.category,
          quantity: 1,
          unit: 'ración',
          base_serving_size: 1,
          base_calories_kcal: recipe.total_calories_kcal,
          base_protein_g: recipe.total_protein_g,
          base_carbs_g: recipe.total_carbs_g,
          base_fat_g: recipe.total_fat_g,
        },
      ]);
    }

    setActiveTab('BUILDER');
  };

  const handleSubmitMeal = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce Standard Validation
    if (!mealName.trim()) {
      setError('Introduce un nombre para la comida o receta.');
      return;
    }

    if (draftIngredients.length === 0) {
      setError('Añade al menos un ingrediente a la comida.');
      return;
    }

    const invalidQuantities = draftIngredients.some((ing) => ing.quantity <= 0);
    if (invalidQuantities) {
      setError('Todas las cantidades de ingredientes deben ser mayores que 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Persist Logged Meal to Supabase
      const loggedItems = draftIngredients.map((ing) => {
        const factor = ing.quantity / (ing.base_serving_size || 100);
        return {
          food_item_id: ing.food_item_id || null,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          calories_kcal: Math.round(ing.base_calories_kcal * factor),
          protein_g: Math.round(ing.base_protein_g * factor * 10) / 10,
          carbohydrates_g: Math.round(ing.base_carbs_g * factor * 10) / 10,
          fat_g: Math.round(ing.base_fat_g * factor * 10) / 10,
        };
      });

      await logMeal({
        user_id: user?.id || '',
        meal_type: mealType,
        name: mealName.trim(),
        image_url: imageUrl.trim() || undefined,
        total_calories_kcal: roundedTotals.calories,
        total_protein_g: roundedTotals.protein,
        total_carbs_g: roundedTotals.carbs,
        total_fat_g: roundedTotals.fat,
        notes: notes.trim() || undefined,
        items: loggedItems,
      });

      // 2. Optional: Save draft as reusable Recipe in Supabase
      if (saveAsRecipe && user?.id) {
        await saveRecipe({
          user_id: user.id,
          name: mealName.trim(),
          description: notes.trim() || 'Receta guardada desde el ensamblador',
          category: mealType,
          servings: 1,
          prep_time_minutes: 15,
          total_calories_kcal: roundedTotals.calories,
          total_protein_g: roundedTotals.protein,
          total_carbs_g: roundedTotals.carbs,
          total_fat_g: roundedTotals.fat,
          image_url: imageUrl.trim() || undefined,
          is_preset: false,
          ingredients: loggedItems.map((ing) => ({
            food_item_id: ing.food_item_id || undefined,
            name: ing.name || 'Ingrediente',
            quantity: ing.quantity,
            unit: ing.unit,
            calories_kcal: ing.calories_kcal,
            protein_g: ing.protein_g,
            carbohydrates_g: ing.carbohydrates_g,
            fat_g: ing.fat_g,
          })),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to log meal:', err);
      setError(err.message || 'Error guardando la comida en Supabase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Ensamblador de Comidas y Recetas"
        subtitle="Calcula macros deterministas en tiempo real según tus ingredientes."
        icon={<Utensils className="w-5 h-5 text-[#C1622B]" />}
        maxWidth="680px"
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('BUILDER')}
            style={{
              flex: 1,
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeTab === 'BUILDER' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(18, 22, 32, 0.6)',
              color: activeTab === 'BUILDER' ? '#00E676' : 'var(--ink-muted)',
              border: `1px solid ${activeTab === 'BUILDER' ? '#00E676' : 'var(--glass-border)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Layers className="w-4 h-4" /> Crear Comida / Receta
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRESETS')}
            style={{
              flex: 1,
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeTab === 'PRESETS' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(18, 22, 32, 0.6)',
              color: activeTab === 'PRESETS' ? '#FF6B35' : 'var(--ink-muted)',
              border: `1px solid ${activeTab === 'PRESETS' ? '#FF6B35' : 'var(--glass-border)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <BookOpen className="w-4 h-4" /> Recetas Guardadas ({recipes.length})
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(178, 58, 72, 0.2)',
              border: '1px solid #B23A48',
              color: '#FF8A95',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {activeTab === 'BUILDER' ? (
          <form onSubmit={handleSubmitMeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Meal Metadata Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
              <div>
                <label
                  htmlFor="meal-builder-name"
                  style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.3rem' }}
                >
                  Nombre de la Comida / Receta *
                </label>
                <input
                  id="meal-builder-name"
                  type="text"
                  required
                  placeholder="Ej: Almuerzo Deportivo Pechuga + Arroz"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--ink-chalk)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="meal-builder-slot"
                  style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.3rem' }}
                >
                  Momento de Ingesta
                </label>
                <select
                  id="meal-builder-slot"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--ink-chalk)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="BREAKFAST">Desayuno</option>
                  <option value="LUNCH">Almuerzo / Comida</option>
                  <option value="DINNER">Cena</option>
                  <option value="SNACK">Snack / Merienda</option>
                  <option value="POST_WORKOUT">Post-Entrenamiento</option>
                </select>
              </div>
            </div>

            {/* Optional Image URL Input with Fallback Preview */}
            <div style={{ background: 'rgba(18, 22, 32, 0.5)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <FoodImageFallback imageUrl={imageUrl} foodName={mealName || 'Comida'} category={mealType} size="md" />
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="meal-builder-image"
                  style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.2rem' }}
                >
                  URL de Imagen (Opcional con Fallback Automático)
                </label>
                <div style={{ position: 'relative' }}>
                  <ImageIcon className="w-4 h-4" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
                  <input
                    id="meal-builder-image"
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.45rem 0.65rem 0.45rem 2.2rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Real-time Dynamic Aggregate Macro Summary Scoreboard */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(18, 22, 32, 0.95) 0%, rgba(10, 13, 20, 0.95) 100%)',
                border: '1.5px solid var(--accent-ember)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Flame className="w-4 h-4 text-[#FF6B35]" /> Total Nutricional en Tiempo Real ({draftIngredients.length} ingrediente{draftIngredients.length !== 1 ? 's' : ''})
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-ember)' }}>
                  {roundedTotals.calories} <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>kcal</span>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', textAlign: 'center' }}>
                <div style={{ background: 'rgba(0, 230, 118, 0.12)', border: '1px solid rgba(0, 230, 118, 0.3)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Proteína</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#00E676' }}>{roundedTotals.protein}g</div>
                </div>

                <div style={{ background: 'rgba(255, 107, 53, 0.12)', border: '1px solid rgba(255, 107, 53, 0.3)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Carbohidratos</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FF6B35' }}>{roundedTotals.carbs}g</div>
                </div>

                <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Grasas</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#A855F7' }}>{roundedTotals.fat}g</div>
                </div>
              </div>
            </div>

            {/* Interactive Draft Ingredients List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                  Composición de Ingredientes:
                </label>
                <button
                  type="button"
                  onClick={() => setIsSelectorOpen(true)}
                  style={{
                    background: 'rgba(0, 230, 118, 0.15)',
                    border: '1px solid #00E676',
                    color: '#00E676',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir ingrediente
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  paddingRight: '0.2rem',
                }}
              >
                {draftIngredients.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(18, 22, 32, 0.4)', borderRadius: 'var(--radius-sm)', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                    No has añadido ningún ingrediente todavía. Haz clic en &quot;Añadir ingrediente&quot;.
                  </div>
                ) : (
                  draftIngredients.map((ing) => {
                    const factor = ing.quantity / (ing.base_serving_size || 100);
                    const cal = Math.round(ing.base_calories_kcal * factor);
                    const prot = Math.round(ing.base_protein_g * factor * 10) / 10;

                    return (
                      <div
                        key={ing.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(18, 22, 32, 0.85)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.45rem 0.75rem',
                          gap: '0.6rem',
                        }}
                      >
                        <FoodImageFallback foodName={ing.name} category={ing.category} size="sm" />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ing.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', display: 'flex', gap: '0.4rem' }}>
                            <span style={{ color: 'var(--accent-ember)', fontWeight: 700 }}>+{cal} kcal</span>
                            <span>•</span>
                            <span style={{ color: '#00E676', fontWeight: 700 }}>+{prot}g prot</span>
                          </div>
                        </div>

                        {/* Quantity and Unit Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input
                            type="number"
                            min="1"
                            value={ing.quantity}
                            onChange={(e) => handleUpdateIngredientQuantity(ing.id, Number.parseFloat(e.target.value) || 0)}
                            style={{
                              width: '65px',
                              background: '#0A0D14',
                              border: '1px solid var(--glass-border-bright)',
                              color: '#FFFFFF',
                              padding: '0.35rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              textAlign: 'center',
                            }}
                          />
                          <input
                            type="text"
                            value={ing.unit}
                            onChange={(e) => handleUpdateIngredientUnit(ing.id, e.target.value)}
                            style={{
                              width: '45px',
                              background: '#0A0D14',
                              border: '1px solid var(--glass-border-bright)',
                              color: 'var(--ink-muted)',
                              padding: '0.35rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              textAlign: 'center',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(ing.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#FF6B7A',
                              padding: '0.35rem',
                              cursor: 'pointer',
                              borderRadius: '4px',
                            }}
                            title="Eliminar ingrediente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Optional Notes Input */}
            <div>
              <label
                htmlFor="meal-builder-notes"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.2rem' }}
              >
                Notas / Observaciones (Opcional)
              </label>
              <input
                id="meal-builder-notes"
                type="text"
                placeholder="Ej: Cocinado a la plancha con poco aceite..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-court)',
                  border: '1px solid var(--line-heavy)',
                  color: 'var(--ink-chalk)',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Checkbox Save as Reusable Recipe */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--ink-chalk)' }}>
              <input
                type="checkbox"
                checked={saveAsRecipe}
                onChange={(e) => setSaveAsRecipe(e.target.checked)}
                style={{ accentColor: '#00E676', width: '16px', height: '16px' }}
              />
              <span>Guardar también como Receta Reutilizable en mi catálogo de recetas</span>
            </label>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-scoreboard secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-scoreboard" disabled={loading}>
                <Check className="w-4 h-4" /> {loading ? 'Registrando...' : 'Registrar Comida'}
              </button>
            </div>
          </form>
        ) : (
          /* Presets / Saved Recipes Tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              Selecciona una receta guardada o predefinida para cargar sus ingredientes en el ensamblador o registrarla directamente.
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '0.2rem',
              }}
            >
              {recipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-muted)', background: 'rgba(18, 22, 32, 0.4)', borderRadius: 'var(--radius-md)' }}>
                  No hay recetas guardadas disponibles. Crea una desde la pestaña &quot;Crear Comida / Receta&quot;.
                </div>
              ) : (
                recipes.map((rec) => {
                  return (
                    <div
                      key={rec.id}
                      style={{
                        background: 'rgba(18, 22, 32, 0.85)',
                        border: '1px solid var(--glass-border-bright)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                      }}
                    >
                      <FoodImageFallback imageUrl={rec.image_url} foodName={rec.name} category={rec.category} size="md" />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink-chalk)' }}>
                            {rec.name}
                          </span>
                          {rec.is_preset ? (
                            <span style={{ background: 'rgba(0, 230, 118, 0.2)', color: '#00E676', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              PRESET ATLETICO
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              MI RECETA
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--accent-ember)', fontWeight: 700 }}>{rec.total_calories_kcal} kcal</span>
                          <span>•</span>
                          <span style={{ color: '#00E676', fontWeight: 700 }}>{rec.total_protein_g}g prot</span>
                          <span>•</span>
                          <span style={{ color: '#FF6B35', fontWeight: 700 }}>{rec.total_carbs_g}g carb</span>
                          <span>•</span>
                          <span style={{ color: '#A855F7', fontWeight: 700 }}>{rec.total_fat_g}g grasa</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLoadPresetRecipe(rec)}
                        className="btn-scoreboard"
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', flexShrink: 0 }}
                      >
                        Usar Receta ➔
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </BaseModal>

      {/* Catalog Selector Modal */}
      <FoodSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        catalog={catalog}
        multiSelect={true}
        onBatchSelect={handleBatchSelectIngredients}
        onSelect={handleSingleSelectIngredient}
      />
    </>
  );
};
