import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Dumbbell, Trophy, Plus, Trash2, Utensils, X } from 'lucide-react';
import type { PantryItem } from '../types';
import { fetchFoodCatalog, addPantryItem, logMeal, type CatalogFoodItem } from '../services/supabaseApi';

interface PantryManagerProps {
  items: PantryItem[];
  userId: string;
  onRefresh: () => void;
  onQuickBasketball: () => void;
  onQuickGym: () => void;
  onDeleteItem: (itemId: string) => void;
  onMealLogged: () => void;
}

export const PantryManager: React.FC<PantryManagerProps> = ({
  items,
  userId,
  onRefresh,
  onQuickBasketball,
  onQuickGym,
  onDeleteItem,
  onMealLogged,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [catalog, setCatalog] = useState<CatalogFoodItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Form states for Add Item
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [addQuantity, setAddQuantity] = useState(400);
  const [addUnit, setAddUnit] = useState('g');

  // Form states for Meal
  const [mealType, setMealType] = useState('Comida');
  const [mealFoodId, setMealFoodId] = useState('');
  const [mealQuantity, setMealQuantity] = useState(200);

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    if (catalog.length === 0) {
      setLoadingCatalog(true);
      try {
        const cat = await fetchFoodCatalog();
        setCatalog(cat);
        if (cat.length > 0) {
          setSelectedFoodId(cat[0].food_item_id);
        }
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoadingCatalog(false);
      }
    }
  };

  const handleOpenMealModal = async () => {
    setShowMealModal(true);
    if (catalog.length === 0) {
      setLoadingCatalog(true);
      try {
        const cat = await fetchFoodCatalog();
        setCatalog(cat);
        if (cat.length > 0) {
          setMealFoodId(cat[0].food_item_id);
        }
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoadingCatalog(false);
      }
    } else if (!mealFoodId && catalog.length > 0) {
      setMealFoodId(catalog[0].food_item_id);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodId) return;

    try {
      await addPantryItem({
        user_id: userId,
        food_item_id: selectedFoodId,
        quantity: Number(addQuantity),
        unit: addUnit,
      });
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      alert('Error al añadir alimento a la despensa');
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
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={handleOpenAddModal}
          >
            <Plus className="w-3.5 h-3.5" /> Añadir
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
            No hay alimentos en tu despensa. ¡Haz clic en "+ Añadir" para registrar existencias!
          </div>
        ) : (
          <div className="pantry-grid">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.inventory_item_id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="pantry-card"
                >
                  <div style={{ flex: 1 }}>
                    <div className="pantry-name">{item.name}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                      <span className={`pantry-tag ${item.density_class}`}>
                        {item.density_class}
                      </span>
                      <span className="pantry-tag" style={{ background: 'var(--line-graphite)', color: 'var(--ink-muted)' }}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <div className="pantry-quantity">
                      {item.available_quantity} {item.unit}
                    </div>
                    <button
                      onClick={() => onDeleteItem(item.inventory_item_id)}
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
              ))}
            </AnimatePresence>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--line-graphite)', paddingTop: '1.25rem', marginTop: '1rem' }}>
          <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>
            ⚡ Registro Rápido de Sesiones Deportivas
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-scoreboard" onClick={onQuickBasketball}>
              <Trophy className="w-4 h-4" />
              🏀 Partidazo (90 min Baloncesto)
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-scoreboard lake" onClick={onQuickGym}>
              <Dumbbell className="w-4 h-4" />
              🏋️ Entreno Pesas (60 min Fuerza)
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modal Añadir Alimento */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="modal-content"
            >
              <div className="panel-header">
                <h3 className="panel-title" style={{ fontSize: '1.2rem' }}>Añadir Alimento a la Despensa</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="panel-body">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                  Seleccionar Alimento del Catálogo:
                </label>
                {loadingCatalog ? (
                  <p style={{ color: 'var(--ink-muted)' }}>Cargando catálogo...</p>
                ) : (
                  <select
                    value={selectedFoodId}
                    onChange={(e) => setSelectedFoodId(e.target.value)}
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
                      <option key={c.food_item_id} value={c.food_item_id}>
                        {c.name} ({c.category})
                      </option>
                    ))}
                  </select>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                      Cantidad:
                    </label>
                    <input
                      type="number"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(Number(e.target.value))}
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
                  </div>
                  <div style={{ width: '120px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                      Unidad:
                    </label>
                    <input
                      type="text"
                      value={addUnit}
                      onChange={(e) => setAddUnit(e.target.value)}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-scoreboard secondary" onClick={() => setShowAddModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-scoreboard">
                    Guardar en Despensa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                  Tipo de Comida:
                </label>
                <select
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
                  <option value="Desayuno">Desayuno</option>
                  <option value="Almuerzo">Almuerzo</option>
                  <option value="Comida">Comida</option>
                  <option value="Merienda">Merienda</option>
                  <option value="Cena">Cena</option>
                  <option value="Post-Entreno">Post-Entreno</option>
                </select>

                <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
                  Alimento Consumido:
                </label>
                <select
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
                    <option key={c.food_item_id} value={c.food_item_id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>
                  Cantidad Gramos/Porción:
                </label>
                <input
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
    </section>
  );
};
