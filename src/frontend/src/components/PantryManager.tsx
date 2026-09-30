import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Activity, Plus, Trash2, Utensils } from 'lucide-react';
import type { PantryItem } from '../types';
import { fetchFoodCatalog, addPantryItemsBatch, type CatalogFoodItem } from '../services/supabaseApi';
import { FoodSelectorModal, type SelectedBatchItem } from './Food/FoodSelectorModal';
import { getFoodMeta, getCategoryMeta } from './Food/foodMeta';
import { DENSITY_CLASS_LABELS } from '../utils/enumMappers';
import { ConfirmDeleteModal } from './Common/ConfirmDeleteModal';

interface PantryManagerProps {
  items: PantryItem[];
  userId: string;
  onRefresh: () => void;
  onQuickWorkout: () => void;
  onDeleteItem: (itemId: string) => void;
  /** Opens the shared meal builder so "Registrar comida" means one thing across the app. */
  onOpenMeal: () => void;
}

export const PantryManager: React.FC<PantryManagerProps> = ({
  items,
  userId,
  onRefresh,
  onQuickWorkout,
  onDeleteItem,
  onOpenMeal,
}) => {
  const [showBatchAddModal, setShowBatchAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PantryItem | null>(null);
  const [catalog, setCatalog] = useState<CatalogFoodItem[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);

  const handleOpenAddModal = async () => {
    setBatchError(null);
    setShowBatchAddModal(true);
    if (catalog.length === 0) {
      try {
        const cat = await fetchFoodCatalog();
        setCatalog(cat);
      } catch (err) {
        console.error('Error loading catalog:', err);
        setBatchError('No hemos podido cargar el catálogo de alimentos. Inténtalo de nuevo.');
      }
    }
  };

  const handleBatchAddSubmit = async (selectedItems: SelectedBatchItem[]) => {
    if (selectedItems.length === 0) return;

    setBatchError(null);
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
      setBatchError('No hemos podido guardar esos alimentos. Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  const itemCountLabel = `${items.length} ${items.length === 1 ? 'alimento' : 'alimentos'}`;

  return (
    <section className="panel-card" style={{ borderTop: '3px solid var(--accent-ember)' }}>
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="panel-title">
          <Package className="w-5 h-5 text-[#C1622B]" />
          Tu despensa
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
            {itemCountLabel}
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-scoreboard"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={handleOpenAddModal}
          >
            <Plus className="w-3.5 h-3.5" /> Añadir alimentos
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-scoreboard lake"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={onOpenMeal}
          >
            <Utensils className="w-3.5 h-3.5" /> Registrar comida
          </motion.button>
        </div>
      </div>

      <div className="panel-body">
        {batchError && (
          <div
            role="alert"
            style={{
              background: 'rgba(178, 58, 72, 0.2)',
              border: '1px solid var(--accent-crimson)',
              color: '#FF8A95',
              padding: '0.7rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {batchError}
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink-chalk)', marginBottom: '0.25rem' }}>
              Tu despensa está vacía
            </div>
            <div style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1rem' }}>
              Añade lo que tengas en casa y te diremos qué comer con ello para llegar a tus objetivos de hoy.
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-action-pill primary"
              style={{ justifyContent: 'center' }}
              onClick={handleOpenAddModal}
            >
              <Plus className="w-4 h-4" /> Añadir alimentos
            </motion.button>
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
                Registrar entrenamiento
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                Suma las calorías que quemas en el entrenamiento para que el marcador refleje tu día real.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-scoreboard"
              onClick={onQuickWorkout}
            >
              <Activity className="w-4 h-4" /> Registrar entrenamiento
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
