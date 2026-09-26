import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Activity, Plus, Trash2, Utensils, X } from 'lucide-react';
import type { PantryItem } from '../types';
import { fetchFoodCatalog, addPantryItemsBatch, logMeal, type CatalogFoodItem } from '../services/api';
import { FoodSelectorModal, type SelectedBatchItem } from './Food/FoodSelectorModal';
import { getFoodMeta, getCategoryMeta } from './Food/foodMeta';
import { DENSITY_CLASS_LABELS, MEAL_TYPE_LABELS } from '../utils/enumMappers';
import { ConfirmDeleteModal } from './Common/ConfirmDeleteModal';

interface PantryManagerProps {
  items: PantryItem[];
  userId: string;
  onRefresh: () => void;
  onQuickWorkout: () => void;
  onDeleteItem: (itemId: string) => void;
  onMealLogged: () => void;
}

export const PantryManager: React.FC<PantryManagerProps> = ({
  items,
  userId,
  onRefresh,
  onQuickWorkout,
  onDeleteItem,
  onMealLogged,
}) => {
  const [showBatchAddModal, setShowBatchAddModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PantryItem | null>(null);
  const [catalog, setCatalog] = useState<CatalogFoodItem[]>([]);

  // Form states for Meal (stores exact PostgreSQL Enum values)
  const [mealType, setMealType] = useState('POST_WORKOUT');
  const [mealFoodId, setMealFoodId] = useState('');
  const [mealQuantity, setMealQuantity] = useState(200);

  const handleOpenAddModal = async () => {
    setShowBatchAddModal(true);
    if (catalog.length === 0) {
      try {
        const cat = await fetchFoodCatalog();
        setCatalog(cat);
      } catch (err) {
        console.error('Error loading catalog:', err);
      }
    }
  };

  const handleOpenMealModal = async () => {
    setShowMealModal(true);
    if (catalog.length === 0) {
      try {
        const cat = await fetchFoodCatalog();
        setCatalog(cat);
        if (cat.length > 0) {
          setMealFoodId(cat[0].food_item_id);
        }
      } catch (err) {
        console.error('Error loading catalog:', err);
      }
    } else if (!mealFoodId && catalog.length > 0) {
      setMealFoodId(catalog[0].food_item_id);
    }
  };

  const handleBatchAddSubmit = async (selectedItems: SelectedBatchItem[]) => {
    if (selectedItems.length === 0) return;

    try {
      const payloads = selectedItems.map((item) => ({
        user_id: userId,
        food_item_id: item.food.food_item_id || item.food.id || '',
        quantity: item.quantity,
        unit: item.unit,
      }));

      await addPantryItemsBatch(payloads);
      setShowBatchAddModal(false);
      onRefresh();
    } catch (err) {
      console.error('Error batch adding items to pantry:', err);
      alert('Error al añadir los alimentos a la despensa');
    }
  };

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealFoodId) return;

    try {
      await logMeal({
        user_id: userId,
        meal_type: mealType,
        total_calories_kcal: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        items: [
          {
            food_item_id: mealFoodId,
            quantity: Number(mealQuantity),
            unit: 'g',
            calories_kcal: 0,
            protein_g: 0,
            carbohydrates_g: 0,
            fat_g: 0,
          },
        ],
      });

      setShowMealModal(false);
      onMealLogged();
      onRefresh();
    } catch (err) {
      console.error('Error logging meal item:', err);
      alert('Error al registrar la comida consumida');
    }
  };

  return (
    <section className="panel-card" style={{ borderTop: '3px solid var(--accent-ember)' }}>
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="panel-title">
          <Package className="w-5 h-5 text-[#C1622B]" />
          Despensa e Inventario Disponible
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
            {items.length} Alimentos Registrados
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-scoreboard"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#000', fontWeight: 800 }}
            onClick={handleOpenAddModal}
          >
            <Plus className="w-3.5 h-3.5" /> <span className='hidden sm:inline text-white'>Añadir Alimentos</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-scoreboard lake"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={handleOpenMealModal}
          >
            <Utensils className="w-3.5 h-3.5" /> Registrar Comida
          </motion.button>
        </div>
      </div>

      <div className="panel-body">
        {items.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
            No hay alimentos en tu despensa. ¡Haz clic en "+ Añadir Alimentos en Lote" para seleccionar tus ingredientes!
          </div>
        ) : (
          <div className="pantry-grid">
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const foodMeta = getFoodMeta(item.name, item.category);
                const catMeta = getCategoryMeta(item.category);

                return (
                  <motion.div
                    key={item.inventory_item_id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="pantry-card"
                    style={{
                      borderLeft: `3px solid ${catMeta.color}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="pantry-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{foodMeta.emoji}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        <span className={`pantry-tag ${item.density_class}`}>
                          {DENSITY_CLASS_LABELS[item.density_class] || item.density_class}
                        </span>
                        <span
                          className="pantry-tag"
                          style={{
                            background: catMeta.background,
                            color: catMeta.color,
                            borderColor: catMeta.color,
                            fontWeight: 700,
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <div className="pantry-quantity" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                        {item.available_quantity} {item.unit}
                      </div>
                      <button
                        onClick={() => setItemToDelete(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ink-muted)',
                          cursor: 'pointer',
                          padding: '0.2rem',
                        }}
                        title="Eliminar de la despensa"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#B23A48]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--line-graphite)', paddingTop: '1.25rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="panel-title" style={{ fontSize: '1.05rem' }}>
                ⚡ Registrar Entrenamiento
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                ¿Acabas de hacer ejercicio? Registra tu sesión para ajustar tu balance energético diario.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-scoreboard"
              onClick={onQuickWorkout}
            >
              <Activity className="w-4 h-4" /> Registrar Entreno
            </motion.button>
          </div>
        </div>
      </div>

      {/* Multi-Item Selector Modal for Batch Adding Pantry Items */}
      {showBatchAddModal && (
        <FoodSelectorModal
          isOpen={showBatchAddModal}
          onClose={() => setShowBatchAddModal(false)}
          catalog={catalog}
          multiSelect={true}
          userId={userId}
          onBatchSelect={handleBatchAddSubmit}
          onCustomFoodCreated={(newFood) => setCatalog((prev) => [...prev, newFood])}
        />
      )}

      {/* Modal Registrar Comida */}
      <AnimatePresence>
        {showMealModal && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="modal-content"
            >
              <div className="panel-header">
                <h3 className="panel-title" style={{ fontSize: '1.2rem' }}>Registrar Comida Consumida</h3>
                <button
                  onClick={() => setShowMealModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleMealSubmit} className="panel-body">
                <label htmlFor="pantry-meal-type" style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                  Tipo de Comida:
                </label>
                <select
                  id="pantry-meal-type"
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
                  {Object.entries(MEAL_TYPE_LABELS).map(([enumValue, label]) => (
                    <option key={enumValue} value={enumValue} style={{ background: '#121620', color: '#FFFFFF' }}>
                      {label}
                    </option>
                  ))}
                </select>

                <label htmlFor="pantry-meal-food" style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
                  Alimento Consumido:
                </label>
                <select
                  id="pantry-meal-food"
                  value={mealFoodId}
                  onChange={(e) => setMealFoodId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--ink-chalk)',
                    padding: '0.85rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {catalog.map((c) => (
                    <option key={c.food_item_id} value={c.food_item_id} style={{ background: '#121620', color: '#FFFFFF' }}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>

                <label htmlFor="pantry-meal-qty" style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
                  Cantidad Gramos/Porción:
                </label>
                <input
                  id="pantry-meal-qty"
                  type="number"
                  value={mealQuantity}
                  onChange={(e) => setMealQuantity(Number(e.target.value))}
                  min="1"
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-scoreboard secondary" onClick={() => setShowMealModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-scoreboard lake">
                    Registrar Comida
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal for Pantry Item */}
      <ConfirmDeleteModal
        isOpen={Boolean(itemToDelete)}
        title="Eliminar Alimento de la Despensa"
        itemName={itemToDelete ? `${itemToDelete.name} (${itemToDelete.available_quantity} ${itemToDelete.unit})` : ''}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await onDeleteItem(itemToDelete.inventory_item_id);
          }
        }}
      />
    </section>
  );
};
