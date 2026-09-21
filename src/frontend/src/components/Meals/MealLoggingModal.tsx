import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, X, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchFoodCatalog, logMeal } from '../../services/supabaseApi';
import type { CatalogFoodItem } from '../../services/supabaseApi';
import { FoodSelectorModal, getFoodMeta } from '../Food/FoodSelectorModal';

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
  const [mealType, setMealType] = useState<string>('LUNCH');
  const [catalog, setCatalog] = useState<CatalogFoodItem[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(150);
  const [unit, setUnit] = useState<string>('g');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFoodCatalog()
        .then((items) => {
          setCatalog(items);
          if (items.length > 0 && !selectedFoodId) {
            setSelectedFoodId(items[0].food_item_id || items[0].id || '');
          }
        })
        .catch((err) => console.error('Error fetching food catalog:', err));
    }
  }, [isOpen, selectedFoodId]);

  const selectedFood = catalog.find((f) => f.food_item_id === selectedFoodId || f.id === selectedFoodId);
  const selectedMeta = selectedFood ? getFoodMeta(selectedFood.name, selectedFood.category) : { emoji: '🥗', badge: '', color: '', image: '' };

  const calcCal = selectedFood && selectedFood.nutrition ? Math.round((quantity / 100) * selectedFood.nutrition.calories_kcal) : 0;
  const calcProt = selectedFood && selectedFood.nutrition ? Math.round((quantity / 100) * selectedFood.nutrition.protein_g) : 0;
  const calcCarbs = selectedFood && selectedFood.nutrition ? Math.round((quantity / 100) * selectedFood.nutrition.carbohydrates_g) : 0;
  const calcFat = selectedFood && selectedFood.nutrition ? Math.round((quantity / 100) * selectedFood.nutrition.fat_g) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodId) {
      setError('Selecciona un alimento del catálogo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await logMeal({
        user_id: user?.id || '',
        meal_type: mealType,
        total_calories_kcal: calcCal,
        total_protein_g: calcProt,
        total_carbs_g: calcCarbs,
        total_fat_g: calcFat,
        items: [
          {
            food_item_id: selectedFoodId,
            quantity,
            unit,
            calories_kcal: calcCal,
            protein_g: calcProt,
            carbohydrates_g: calcCarbs,
            fat_g: calcFat,
          },
        ],
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to log meal:', err);
      setError('Error guardando la comida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className="modal-overlay"
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '540px' }}
            >
              <div className="panel-header">
                <h3 className="panel-title" style={{ fontSize: '1.2rem' }}>
                  <Utensils className="w-5 h-5 text-[#C1622B]" />
                  Registrar Comida / Ingesta Calórica
                </h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="panel-body">
                {error && (
                  <div style={{ background: 'rgba(178, 58, 72, 0.15)', border: '1px solid var(--accent-flag)', color: '#FF6B7A', padding: '0.75rem', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="meal-type-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                    Momento de la Ingesta:
                  </label>
                  <select
                    id="meal-type-select"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.85rem',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <option value="BREAKFAST">Desayuno</option>
                    <option value="LUNCH">Almuerzo / Comida Principal</option>
                    <option value="DINNER">Cena</option>
                    <option value="SNACK">Snack / Merienda</option>
                    <option value="POST_WORKOUT">Post-Entrenamiento</option>
                  </select>
                </div>

                {/* Visual Food Selection Button */}
                <div>
                  <label htmlFor="meal-food-btn" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                    Alimento del Catálogo:
                  </label>
                  <button
                    id="meal-food-btn"
                    type="button"
                    onClick={() => setIsSelectorOpen(true)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: selectedFood ? 'var(--ink-chalk)' : 'var(--ink-muted)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{selectedMeta.emoji}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-chalk)' }}>
                          {selectedFood ? selectedFood.name : 'Seleccionar alimento...'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                          {selectedFood ? `${selectedFood.category} • ${selectedFood.nutrition?.calories_kcal || 0} kcal/100g` : 'Haz clic para abrir el catálogo visual'}
                        </div>
                      </div>
                    </div>

                    <span className="btn-action-pill" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                      Catálogo ➔
                    </span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label htmlFor="meal-quantity-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                      Cantidad Consumida:
                    </label>
                    <input
                      id="meal-quantity-input"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseFloat(e.target.value) || 0)}
                      required
                      style={{
                        width: '100%',
                        background: 'var(--bg-court)',
                        border: '1px solid var(--line-heavy)',
                        color: 'var(--ink-chalk)',
                        padding: '0.85rem',
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="meal-unit-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                      Unidad:
                    </label>
                    <input
                      id="meal-unit-input"
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-court)',
                        border: '1px solid var(--line-heavy)',
                        color: 'var(--ink-chalk)',
                        padding: '0.85rem',
                        fontFamily: 'var(--font-body)',
                      }}
                    />
                  </div>
                </div>

                {/* Live Calculated Macro Preview */}
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--line-graphite)', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Flame className="w-4 h-4 text-[#C1622B]" /> Aporte Nutricional Estimado:
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-ember)' }}>
                    +{calcCal} kcal | +{calcProt}g prot
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-scoreboard secondary" onClick={onClose}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-scoreboard" disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrar Comida'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Visual Food Catalog Modal */}
      <FoodSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        catalog={catalog}
        selectedFoodId={selectedFoodId}
        onSelect={(food) => setSelectedFoodId(food.food_item_id || food.id || '')}
      />
    </>
  );
};
