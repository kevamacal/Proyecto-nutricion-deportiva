import React, { useState } from 'react';
import { Search, Utensils, Filter, Check, Trash2, Plus, ShoppingBag, PlusCircle, ArrowLeft } from 'lucide-react';
import { createCustomFoodItem, type CatalogFoodItem, type CreateCustomFoodPayload } from '../../services/supabaseApi';
import { getFoodMeta, getCategoryMeta } from './foodMeta';
import { BaseModal } from '../Common/BaseModal';

import type { PantryItem } from '../../types';

export interface SelectedBatchItem {
  food: CatalogFoodItem;
  quantity: number;
  unit: string;
}

interface FoodSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogFoodItem[];
  pantryItems?: PantryItem[];
  onSelect?: (food: CatalogFoodItem) => void;
  onBatchSelect?: (items: SelectedBatchItem[]) => void;
  onCustomFoodCreated?: (newFood: CatalogFoodItem) => void;
  userId?: string;
  selectedFoodId?: string;
  multiSelect?: boolean;
}

const CATEGORY_OPTIONS = [
  'Carnes',
  'Cereales y Derivados',
  'Lácteos y Huevos',
  'Frutas',
  'Pescados y Mariscos',
  'Aceites y Grasas',
  'Tubérculos',
  'Carnes Procesadas',
  'Suplementación',
  'General',
];

interface CustomFoodFormSectionProps {
  customName: string;
  setCustomName: (val: string) => void;
  customCategory: string;
  setCustomCategory: (val: string) => void;
  customUnit: string;
  setCustomUnit: (val: string) => void;
  customKcal: number;
  setCustomKcal: (val: number) => void;
  customProtein: number;
  setCustomProtein: (val: number) => void;
  customCarbs: number;
  setCustomCarbs: (val: number) => void;
  customFat: number;
  setCustomFat: (val: number) => void;
  isSubmittingCustom: boolean;
  customError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const CustomFoodFormSection: React.FC<CustomFoodFormSectionProps> = ({
  customName,
  setCustomName,
  customCategory,
  setCustomCategory,
  customUnit,
  setCustomUnit,
  customKcal,
  setCustomKcal,
  customProtein,
  setCustomProtein,
  customCarbs,
  setCustomCarbs,
  customFat,
  setCustomFat,
  isSubmittingCustom,
  customError,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {customError && (
        <div style={{ background: 'rgba(178, 58, 72, 0.2)', border: '1px solid #B23A48', color: '#FF8A95', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
          {customError}
        </div>
      )}

      <div>
        <label
          htmlFor="custom-food-name"
          style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}
        >
          Nombre del Alimento *
        </label>
        <input
          id="custom-food-name"
          type="text"
          required
          placeholder="Ej: Batido Proteína Caseína, Pan Centeno..."
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          style={{
            width: '100%',
            background: '#0A0D14',
            border: '1px solid var(--glass-border-bright)',
            color: '#FFFFFF',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label
            htmlFor="custom-food-category"
            style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}
          >
            Categoría
          </label>
          <select
            id="custom-food-category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            style={{
              width: '100%',
              background: '#0A0D14',
              border: '1px solid var(--glass-border-bright)',
              color: '#FFFFFF',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat} style={{ background: '#121620', color: '#FFFFFF' }}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="custom-food-unit"
            style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}
          >
            Unidad Habitual
          </label>
          <select
            id="custom-food-unit"
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            style={{
              width: '100%',
              background: '#0A0D14',
              border: '1px solid var(--glass-border-bright)',
              color: '#FFFFFF',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          >
            <option value="g" style={{ background: '#121620', color: '#FFFFFF' }}>Gramos (g)</option>
            <option value="ml" style={{ background: '#121620', color: '#FFFFFF' }}>Mililitros (ml)</option>
            <option value="unidades" style={{ background: '#121620', color: '#FFFFFF' }}>Unidades</option>
            <option value="porción" style={{ background: '#121620', color: '#FFFFFF' }}>Porción</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'rgba(18, 22, 32, 0.6)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
            Valores Nutricionales (por 100g / 100ml / porción):
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <div>
            <label htmlFor="custom-food-kcal" style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Kcal
            </label>
            <input
              id="custom-food-kcal"
              type="number"
              min="0"
              value={customKcal}
              onChange={(e) => setCustomKcal(Number(e.target.value))}
              style={{ width: '100%', background: '#0A0D14', border: '1px solid var(--glass-border)', color: '#FF6B35', padding: '0.4rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="custom-food-protein" style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Prot
            </label>
            <input
              id="custom-food-protein"
              type="number"
              min="0"
              step="0.1"
              value={customProtein}
              onChange={(e) => {
                const p = Number(e.target.value);
                setCustomProtein(p);
                setCustomKcal(Math.round(p * 4 + customCarbs * 4 + customFat * 9));
              }}
              style={{ width: '100%', background: '#0A0D14', border: '1px solid var(--glass-border)', color: '#00E676', padding: '0.4rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="custom-food-carbs" style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Carb
            </label>
            <input
              id="custom-food-carbs"
              type="number"
              min="0"
              step="0.1"
              value={customCarbs}
              onChange={(e) => {
                const c = Number(e.target.value);
                setCustomCarbs(c);
                setCustomKcal(Math.round(customProtein * 4 + c * 4 + customFat * 9));
              }}
              style={{ width: '100%', background: '#0A0D14', border: '1px solid var(--glass-border)', color: '#FF8C00', padding: '0.4rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="custom-food-fat" style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Grasa
            </label>
            <input
              id="custom-food-fat"
              type="number"
              min="0"
              step="0.1"
              value={customFat}
              onChange={(e) => {
                const f = Number(e.target.value);
                setCustomFat(f);
                setCustomKcal(Math.round(customProtein * 4 + customCarbs * 4 + f * 9));
              }}
              style={{ width: '100%', background: '#0A0D14', border: '1px solid var(--glass-border)', color: '#A855F7', padding: '0.4rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
        <button
          type="button"
          className="btn-scoreboard secondary"
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          onClick={onCancel}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al Catálogo
        </button>
        <button
          type="submit"
          disabled={isSubmittingCustom}
          className="btn-scoreboard"
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', opacity: isSubmittingCustom ? 0.7 : 1 }}
        >
          <Plus className="w-4 h-4" /> {isSubmittingCustom ? 'Guardando...' : 'Guardar y Seleccionar'}
        </button>
      </div>
    </form>
  );
};

interface FoodItemRowProps {
  food: CatalogFoodItem;
  isSelected: boolean;
  pantryStock?: { quantity: number; unit: string };
  onToggle: (food: CatalogFoodItem) => void;
}

const FoodItemRow: React.FC<FoodItemRowProps> = ({ food, isSelected, pantryStock, onToggle }) => {
  const meta = getFoodMeta(food.name, food.category);
  const catMeta = getCategoryMeta(food.category);

  return (
    <button
      type="button"
      onClick={() => onToggle(food)}
      style={{
        background: isSelected ? 'rgba(0, 230, 118, 0.12)' : 'rgba(18, 22, 32, 0.75)',
        border: `1.5px solid ${isSelected ? 'var(--accent-emerald)' : 'var(--glass-border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.55rem 0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        gap: '0.6rem',
        width: '100%',
        textAlign: 'left',
        color: 'inherit',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: catMeta.background,
          border: `1px solid ${catMeta.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0,
        }}
      >
        {meta.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {food.name}
          </span>
          {pantryStock && (
            <span style={{ background: 'rgba(0, 230, 118, 0.2)', color: '#00E676', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
              📦 DISPONIBLE: {pantryStock.quantity} {pantryStock.unit}
            </span>
          )}
          {food.is_custom && (
            <span style={{ background: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
              PERSONALIZADO
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>
          <span style={{ color: catMeta.color, fontWeight: 600 }}>{food.category}</span>
          {food.nutrition && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--accent-ember)', fontWeight: 700 }}>
                {food.nutrition.calories_kcal} kcal
              </span>
              <span>•</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                {food.nutrition.protein_g}g prot
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {isSelected ? (
          <div
            style={{
              background: 'var(--accent-emerald)',
              color: '#0A0D14',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={16} strokeWidth={3} />
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--glass-border-bright)',
              color: 'var(--ink-muted)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={14} />
          </div>
        )}
      </div>
    </button>
  );
};

export const FoodSelectorModal: React.FC<FoodSelectorModalProps> = ({
  isOpen,
  onClose,
  catalog,
  pantryItems,
  onSelect,
  onBatchSelect,
  onCustomFoodCreated,
  userId,
  selectedFoodId,
  multiSelect = true,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBatchMap, setSelectedBatchMap] = useState<Record<string, SelectedBatchItem>>({});
  const [activeTab, setActiveTab] = useState<'pantry' | 'catalog' | 'create'>(
    pantryItems && pantryItems.length > 0 ? 'pantry' : 'catalog'
  );

  // Custom Food Form State
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('General');
  const [customUnit, setCustomUnit] = useState<string>('g');
  const [customKcal, setCustomKcal] = useState<number>(100);
  const [customProtein, setCustomProtein] = useState<number>(10);
  const [customCarbs, setCustomCarbs] = useState<number>(0);
  const [customFat, setCustomFat] = useState<number>(2);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Map of available pantry stock
  const pantryStockMap = new Map<string, { quantity: number; unit: string }>();
  (pantryItems || []).forEach((item) => {
    if (item.food_item_id && item.available_quantity > 0) {
      pantryStockMap.set(item.food_item_id, {
        quantity: item.available_quantity,
        unit: item.unit,
      });
    }
  });

  const catalogCategories = Array.from(new Set(catalog.map((f) => f.category))).filter(Boolean);

  const filteredCatalog = catalog.filter((food) => {
    const foodId = food.food_item_id || food.id || '';

    // If on 'pantry' tab, strictly require item to exist in available pantry stock
    if (activeTab === 'pantry' && !pantryStockMap.has(foodId)) {
      return false;
    }

    const matchesSearch =
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' ||
      food.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const selectedCount = Object.keys(selectedBatchMap).length;

  const handleToggleItem = (food: CatalogFoodItem) => {
    const foodId = food.food_item_id || food.id || food.name;
    if (!foodId) return;

    if (!multiSelect) {
      if (onSelect) onSelect(food);
      onClose();
      return;
    }

    setSelectedBatchMap((prev) => {
      const next = { ...prev };
      if (next[foodId]) {
        delete next[foodId];
      } else {
        const normalizedUnit = (food.default_unit || 'g').toLowerCase();
        const isUnitBased = ['unit', 'unidad', 'unidades', 'porción', 'porcion'].includes(normalizedUnit);
        const defaultQty = isUnitBased ? (food.nutrition?.serving_size && food.nutrition.serving_size < 50 ? food.nutrition.serving_size : 1) : (food.nutrition?.serving_size || 100);

        next[foodId] = {
          food,
          quantity: defaultQty,
          unit: food.default_unit || 'g',
        };
      }
      return next;
    });
  };

  const handleUpdateQuantity = (foodId: string, quantity: number) => {
    setSelectedBatchMap((prev) => {
      if (!prev[foodId]) return prev;
      return {
        ...prev,
        [foodId]: {
          ...prev[foodId],
          quantity: Math.max(1, quantity),
        },
      };
    });
  };

  const handleUpdateUnit = (foodId: string, unit: string) => {
    setSelectedBatchMap((prev) => {
      if (!prev[foodId]) return prev;
      return {
        ...prev,
        [foodId]: {
          ...prev[foodId],
          unit,
        },
      };
    });
  };

  const handleRemoveFromBatch = (foodId: string) => {
    setSelectedBatchMap((prev) => {
      const next = { ...prev };
      delete next[foodId];
      return next;
    });
  };

  const handleConfirmBatch = () => {
    const items = Object.values(selectedBatchMap);
    if (items.length > 0 && onBatchSelect) {
      onBatchSelect(items);
      setSelectedBatchMap({});
      onClose();
    }
  };

  const handleOpenCustomForm = (prefillName?: string) => {
    setCustomName(prefillName || searchTerm || '');
    setCustomError(null);
    setActiveTab('create');
  };

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setCustomError('Por favor introduce un nombre para el alimento.');
      return;
    }

    setIsSubmittingCustom(true);
    setCustomError(null);

    try {
      const payload: CreateCustomFoodPayload = {
        user_id: userId,
        name: customName.trim(),
        category: customCategory,
        default_unit: customUnit,
        serving_size: 100,
        calories_kcal: Number(customKcal) || 0,
        protein_g: Number(customProtein) || 0,
        carbohydrates_g: Number(customCarbs) || 0,
        fat_g: Number(customFat) || 0,
      };

      const newFood = await createCustomFoodItem(payload);

      if (onCustomFoodCreated) {
        onCustomFoodCreated(newFood);
      }

      handleToggleItem(newFood);
      setActiveTab('catalog');
      setSearchTerm('');
    } catch (err: any) {
      console.error('Error creating custom food item:', err);
      setCustomError(err.message || 'Error al guardar el alimento personalizado');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  // Resolve modal title and subtitle cleanly without nested ternaries
  let modalTitle = 'Catálogo de Alimentos';
  let modalSubtitle = 'Consulta los aportes macronutricionales.';
  let modalIcon = <Utensils className="w-5 h-5 text-[#FF6B35]" />;

  if (activeTab === 'create') {
    modalTitle = 'Crear Alimento Personalizado';
    modalSubtitle = 'Registra un alimento nuevo con sus macronutrientes.';
    modalIcon = <PlusCircle className="w-5 h-5 text-[#FF6B35]" />;
  } else if (multiSelect) {
    modalTitle = 'Selección Múltiple de Alimentos';
    modalSubtitle = 'Selecciona ingredientes para tu despensa o comidas.';
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={modalIcon}
      maxWidth="760px"
    >
      {/* Top Header Tabs / Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {pantryItems && pantryItems.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('pantry')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeTab === 'pantry' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(18, 22, 32, 0.6)',
              color: activeTab === 'pantry' ? '#00E676' : 'var(--ink-muted)',
              border: `1px solid ${activeTab === 'pantry' ? '#00E676' : 'var(--glass-border)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <ShoppingBag className="w-4 h-4 text-[#00E676]" /> Mi Almacén ({pantryStockMap.size})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 700,
            background: activeTab === 'catalog' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(18, 22, 32, 0.6)',
            color: activeTab === 'catalog' ? '#38BDF8' : 'var(--ink-muted)',
            border: `1px solid ${activeTab === 'catalog' ? '#38BDF8' : 'var(--glass-border)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <Utensils className="w-4 h-4 text-[#38BDF8]" /> Catálogo Completo
        </button>

        <button
          type="button"
          onClick={() => handleOpenCustomForm()}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 700,
            background: activeTab === 'create' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(18, 22, 32, 0.6)',
            color: activeTab === 'create' ? '#FF6B35' : 'var(--ink-muted)',
            border: `1px solid ${activeTab === 'create' ? '#FF6B35' : 'var(--glass-border)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <PlusCircle className="w-4 h-4 text-[#FF6B35]" /> Crear Nuevo
        </button>
      </div>

      {activeTab === 'create' ? (
        <CustomFoodFormSection
          customName={customName}
          setCustomName={setCustomName}
          customCategory={customCategory}
          setCustomCategory={setCustomCategory}
          customUnit={customUnit}
          setCustomUnit={setCustomUnit}
          customKcal={customKcal}
          setCustomKcal={setCustomKcal}
          customProtein={customProtein}
          setCustomProtein={setCustomProtein}
          customCarbs={customCarbs}
          setCustomCarbs={setCustomCarbs}
          customFat={customFat}
          setCustomFat={setCustomFat}
          isSubmittingCustom={isSubmittingCustom}
          customError={customError}
          onSubmit={handleCreateCustomFood}
          onCancel={() => setActiveTab('catalog')}
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search
                className="w-4 h-4"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }}
              />
              <label htmlFor="catalog-search-input" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                Buscar alimento
              </label>
              <input
                id="catalog-search-input"
                type="text"
                placeholder="Buscar alimento (ej: pollo, arroz, atún)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: '#121620',
                  border: '1px solid var(--glass-border-bright)',
                  color: 'var(--ink-primary)',
                  padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter className="w-4 h-4 text-[#FF6B35]" />
              <label htmlFor="catalog-category-filter" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                Filtrar por categoría
              </label>
              <select
                id="catalog-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  flex: 1,
                  background: '#121620',
                  border: '1px solid var(--glass-border)',
                  color: '#FFFFFF',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <option value="ALL" style={{ background: '#121620', color: '#FFFFFF' }}>
                  Todas las categorías ({catalog.length})
                </option>
                {catalogCategories.map((cat) => (
                  <option key={cat} value={cat} style={{ background: '#121620', color: '#FFFFFF' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              maxHeight: multiSelect && selectedCount > 0 ? '38vh' : '52vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              paddingRight: '0.2rem',
              transition: 'max-height 0.3s ease',
            }}
          >
            {filteredCatalog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--ink-muted)', background: 'rgba(18, 22, 32, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  No se encontraron alimentos que coincidan con &quot;{searchTerm}&quot;.
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCustomForm(searchTerm)}
                  className="btn-scoreboard"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                >
                  <PlusCircle className="w-4 h-4" /> Crear &quot;{searchTerm}&quot; como alimento personalizado
                </button>
              </div>
            ) : (
              filteredCatalog.map((food) => {
                const foodId = food.food_item_id || food.id || food.name;
                const isBatchSelected = multiSelect && !!selectedBatchMap[foodId];
                const isSingleSelected = !multiSelect && food.id === selectedFoodId;
                const isSelected = isBatchSelected || isSingleSelected;

                return (
                  <FoodItemRow
                    key={foodId}
                    food={food}
                    isSelected={isSelected}
                    pantryStock={pantryStockMap.get(foodId)}
                    onToggle={handleToggleItem}
                  />
                );
              })
            )}
          </div>

          {multiSelect && selectedCount > 0 && (
            <div
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--glass-border-bright)',
                background: '#0D111A',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShoppingBag className="w-4 h-4 text-[#00E676]" />
                  Lote Seleccionado ({selectedCount})
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                  Ajusta cantidades
                </span>
              </div>

              <div
                style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  marginBottom: '0.75rem',
                }}
              >
                {Object.values(selectedBatchMap).map(({ food, quantity, unit }) => {
                  const foodId = food.food_item_id || food.id || food.name;
                  const meta = getFoodMeta(food.name, food.category);

                  return (
                    <div
                      key={foodId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(18, 22, 32, 0.85)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.35rem 0.6rem',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '1rem' }}>{meta.emoji}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {food.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <label htmlFor={`batch-qty-${foodId}`} className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                          Cantidad para {food.name}
                        </label>
                        <input
                          id={`batch-qty-${foodId}`}
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => handleUpdateQuantity(foodId, Number(e.target.value))}
                          style={{
                            width: '65px',
                            background: '#0A0D14',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--accent-emerald)',
                            padding: '0.2rem 0.35rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        />

                        <label htmlFor={`batch-unit-${foodId}`} className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                          Unidad para {food.name}
                        </label>
                        <select
                          id={`batch-unit-${foodId}`}
                          value={unit}
                          onChange={(e) => handleUpdateUnit(foodId, e.target.value)}
                          style={{
                            background: '#0A0D14',
                            border: '1px solid var(--glass-border)',
                            color: '#FFFFFF',
                            padding: '0.2rem 0.35rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <option value="g" style={{ background: '#121620', color: '#FFFFFF' }}>g</option>
                          <option value="ml" style={{ background: '#121620', color: '#FFFFFF' }}>ml</option>
                          <option value="unidades" style={{ background: '#121620', color: '#FFFFFF' }}>unidades</option>
                          <option value="unidad" style={{ background: '#121620', color: '#FFFFFF' }}>unidad</option>
                          <option value="porción" style={{ background: '#121620', color: '#FFFFFF' }}>porción</option>
                          {food.default_unit && !['g', 'ml', 'unidades', 'unidad', 'porción'].includes(food.default_unit.toLowerCase()) && (
                            <option value={food.default_unit} style={{ background: '#121620', color: '#FFFFFF' }}>{food.default_unit}</option>
                          )}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromBatch(foodId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#B23A48',
                            cursor: 'pointer',
                            padding: '0.15rem',
                          }}
                          title="Quitar del lote"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-scoreboard secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  onClick={() => setSelectedBatchMap({})}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  className="btn-scoreboard"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 1.1rem' }}
                  onClick={handleConfirmBatch}
                >
                  <Plus className="w-4 h-4" /> Guardar {selectedCount} Alimento{selectedCount > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </BaseModal>
  );
};
