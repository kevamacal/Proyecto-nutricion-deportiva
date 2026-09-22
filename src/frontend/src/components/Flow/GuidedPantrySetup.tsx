import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchFoodCatalog, addPantryItemsBatch, type CatalogFoodItem } from '../../services/supabaseApi';
import { FoodSelectorModal, type SelectedBatchItem } from '../Food/FoodSelectorModal';
import { ShoppingBag, Plus, Sparkles } from 'lucide-react';

interface GuidedPantrySetupProps {
  userId: string;
  onItemAdded: () => void;
}

export const GuidedPantrySetup: React.FC<GuidedPantrySetupProps> = ({ userId, onItemAdded }) => {
  const [catalog, setCatalog] = useState<CatalogFoodItem[]>([]);
  const [showSelectorModal, setShowSelectorModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchFoodCatalog()
      .then((items) => {
        setCatalog(items);
      })
      .catch((err) => console.error('Error fetching catalog:', err));
  }, []);

  const handleBatchSelect = async (selectedItems: SelectedBatchItem[]) => {
    if (selectedItems.length === 0) return;

    setLoading(true);
    try {
      const payloads = selectedItems.map((item) => ({
        user_id: userId,
        food_item_id: item.food.food_item_id || item.food.id || '',
        quantity: item.quantity,
        unit: item.unit,
      }));

      await addPantryItemsBatch(payloads);
      onItemAdded();
    } catch (err) {
      console.error('Error adding guided batch pantry items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDefaultStaples = async () => {
    if (catalog.length === 0) return;
    setLoading(true);
    try {
      // Pick up to 3 common staples if available in catalog
      const staples = catalog.slice(0, 3);
      const payloads = staples.map((food) => ({
        user_id: userId,
        food_item_id: food.food_item_id || food.id || '',
        quantity: food.default_unit === 'unidades' ? 6 : 500,
        unit: food.default_unit || 'g',
      }));

      await addPantryItemsBatch(payloads);
      onItemAdded();
    } catch (err) {
      console.error('Error adding default staples:', err);
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
          maxWidth: '620px',
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

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
          Inicializa tu Despensa Deportiva
        </h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Selecciona varios alimentos en lote o añade tus básicos iniciales para activar el marcador macro en tiempo real y las recomendaciones nutricionales.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            className="btn-scoreboard emerald"
            style={{
              padding: '1.1rem 1.5rem',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
            onClick={() => setShowSelectorModal(true)}
            disabled={loading}
          >
            <Sparkles className="w-5 h-5" /> Abrir Selector Lote de Alimentos ({catalog.length} disponibles)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            className="btn-scoreboard secondary"
            style={{
              padding: '0.85rem 1.25rem',
              justifyContent: 'center',
              fontSize: '0.9rem',
            }}
            onClick={handleAddDefaultStaples}
            disabled={loading || catalog.length === 0}
          >
            <Plus className="w-4 h-4" /> Cargar Básicos de Despensa Rápidos (Arroz, Pechuga, Huevos)
          </motion.button>
        </div>
      </motion.div>

      {showSelectorModal && (
        <FoodSelectorModal
          isOpen={showSelectorModal}
          onClose={() => setShowSelectorModal(false)}
          catalog={catalog}
          multiSelect={true}
          userId={userId}
          onBatchSelect={handleBatchSelect}
          onCustomFoodCreated={(newFood) => setCatalog((prev) => [...prev, newFood])}
        />
      )}
    </div>
  );
};
