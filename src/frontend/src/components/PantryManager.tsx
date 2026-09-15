import React, { useState } from 'react';
import { Package, Dumbbell, Trophy, Plus, Trash2, Utensils, X } from 'lucide-react';
import type { PantryItem } from '../types';
import { fetchFoodCatalog, addPantryItem, type CatalogFoodItem } from '../services/api';

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
          setSelectedFoodId(cat[0].id);
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
          setMealFoodId(cat[0].id);
        }
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoadingCatalog(false);
      }
    } else if (!mealFoodId && catalog.length > 0) {
      setMealFoodId(catalog[0].id);
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
      const res = await fetch('/rest/v1/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          meal_type: mealType,
          items: [
            {
              food_item_id: mealFoodId,
              quantity: Number(mealQuantity),
              unit: 'g',
            },
          ],
        }),
      });

      if (!res.ok) throw new Error('Error logging meal');

      setShowMealModal(false);
      onMealLogged();
      onRefresh();
    } catch (err) {
      alert('Error al registrar la comida consumida');
    }
  };

  return (
    <section className="panel-card">
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="panel-title">
          <Package className="w-5 h-5 text-[#C1622B]" />
          Despensa e Inventario Disponible
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            {items.length} Alimentos Registrados
          </span>
          <button
            className="btn-scoreboard"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={handleOpenAddModal}
          >
            <Plus className="w-3.5 h-3.5" /> Añadir
          </button>
          <button
            className="btn-scoreboard lake"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={handleOpenMealModal}
          >
            <Utensils className="w-3.5 h-3.5" /> Registrar Comida
          </button>
        </div>
      </div>

      <div className="panel-body">
        {items.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
            No hay alimentos en tu despensa. ¡Haz clic en "+ Añadir" para registrar existencias!
          </div>
        ) : (
          <div className="pantry-grid">
            {items.map((item) => (
              <div key={item.inventory_item_id} className="pantry-card">
                <div style={{ flex: 1 }}>
                  <div className="pantry-name">{item.name}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <span className={`pantry-tag ${item.density_class}`}>
                      {item.density_class}
                    </span>
                    <span className="pantry-tag" style={{ background: 'var(--surface-court)', color: 'var(--ink-muted)' }}>
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
                    <Trash2 className="w-3.5 h-3.5 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--line-graphite)', paddingTop: '1.25rem', marginTop: '1rem' }}>
          <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>
            ⚡ Registro Rápido de Sesiones Deportivas
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-scoreboard" onClick={onQuickBasketball}>
              <Trophy className="w-4 h-4" />
              🏀 Partidazo (90 min Baloncesto)
            </button>
            <button className="btn-scoreboard lake" onClick={onQuickGym}>
              <Dumbbell className="w-4 h-4" />
              🏋️ Entreno Pesas (60 min Fuerza)
            </button>
          </div>
        </div>
      </div>

      {/* Modal Añadir Alimento */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Añadir Alimento a la Despensa</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form">
              <label>Seleccionar Alimento del Catálogo:</label>
              {loadingCatalog ? (
                <p>Cargando catálogo...</p>
              ) : (
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                >
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div style={{ width: '100px' }}>
                  <label>Unidad:</label>
                  <input
                    type="text"
                    value={addUnit}
                    onChange={(e) => setAddUnit(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-scoreboard">
                  Guardar en Despensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Comida */}
      {showMealModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Registrar Comida Consumida</h3>
              <button onClick={() => setShowMealModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleMealSubmit} className="modal-form">
              <label>Tipo de Comida:</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Comida">Comida</option>
                <option value="Merienda">Merienda</option>
                <option value="Cena">Cena</option>
                <option value="Post-Entreno">Post-Entreno</option>
              </select>

              <label style={{ marginTop: '0.5rem' }}>Alimento Consumido:</label>
              <select
                value={mealFoodId}
                onChange={(e) => setMealFoodId(e.target.value)}
              >
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>

              <label style={{ marginTop: '0.5rem' }}>Cantidad Gramos/Porción:</label>
              <input
                type="number"
                value={mealQuantity}
                onChange={(e) => setMealQuantity(Number(e.target.value))}
                min="1"
              />

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMealModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-scoreboard lake">
                  Registrar Comida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
