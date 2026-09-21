import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchFoodCatalog, addPantryItem, type CatalogFoodItem } from '../../services/supabaseApi';
import { ShoppingBag, Plus } from 'lucide-react';

interface GuidedPantrySetupProps {
  userId: string;
  onItemAdded: () => void;
}

export const GuidedPantrySetup: React.FC<GuidedPantrySetupProps> = ({ userId, onItemAdded }) => {
  const [catalog, setCatalog] = useState<CatalogFoodItem[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(500);
  const [unit, setUnit] = useState<string>('g');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchFoodCatalog()
      .then((items) => {
        setCatalog(items);
        if (items.length > 0) setSelectedFoodId(items[0].food_item_id);
      })
      .catch((err) => console.error('Error fetching catalog:', err));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodId) return;

    setLoading(true);
    try {
      await addPantryItem({
        user_id: userId,
        food_item_id: selectedFoodId,
        quantity,
        unit,
      });
      onItemAdded();
    } catch (err) {
      console.error('Error adding guided pantry item:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-court)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        color: 'var(--ink-chalk)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="panel-card"
        style={{
          maxWidth: '580px',
          width: '100%',
          padding: '2.5rem',
          border: '1px solid var(--line-heavy)',
          borderTop: '3px solid var(--accent-ember)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <ShoppingBag className="w-5 h-5 text-[#C1622B]" />
          <span className="brand-badge">Paso Guiado 03 de 03</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
          Añade tus Primeros Alimentos
        </h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Tu despensa está vacía. Registra al menos un ingrediente para activar el marcador en tiempo real y las recomendaciones del asistente IA.
        </p>

        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="guided-food-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
              Selecciona un Alimento del Catálogo:
            </label>
            <select
              id="guided-food-select"
              value={selectedFoodId}
              onChange={(e) => setSelectedFoodId(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-court)',
                border: '1px solid var(--line-heavy)',
                color: 'var(--ink-chalk)',
                padding: '0.85rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
              }}
            >
              {catalog.map((food) => (
                <option key={food.food_item_id} value={food.food_item_id}>
                  {food.name} ({food.category})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="guided-food-qty" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                Cantidad en Stock:
              </label>
              <input
                id="guided-food-qty"
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
              <label htmlFor="guided-food-unit" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                Unidad:
              </label>
              <input
                id="guided-food-unit"
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
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="btn-scoreboard"
            style={{
              marginTop: '1rem',
              padding: '1rem',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
            disabled={loading}
          >
            {loading ? 'Añadiendo...' : <>Añadir & Activar Dashboard <Plus size={20} /></>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
