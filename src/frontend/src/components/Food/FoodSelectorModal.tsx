import React, { useState } from 'react';
import { Search, X, Flame, Sparkles, Filter, Check } from 'lucide-react';
import type { CatalogFoodItem } from '../../services/supabaseApi';
import { getFoodMeta } from './foodMeta';

interface FoodSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogFoodItem[];
  onSelect: (food: CatalogFoodItem) => void;
  selectedFoodId?: string;
}

export const FoodSelectorModal: React.FC<FoodSelectorModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onSelect,
  selectedFoodId,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  // Extract unique categories
  const categories = Array.from(new Set(catalog.map((f) => f.category))).filter(Boolean);

  // Filter food items
  const filteredCatalog = catalog.filter((food) => {
    const matchesSearch =
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' ||
      food.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1200 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-selector-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 id="food-selector-modal-title" className="glass-card-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              <Sparkles className="w-5 h-5 text-[#FF6B35]" /> Catálogo de Alimentos e Ingredientes
            </h3>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Selecciona un alimento para consultar sus aportes macronutricionales por 100g.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de alimentos"
            style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre de alimento o ingrediente (ej: pechuga, arroz, atún)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#121620',
              border: '1px solid var(--glass-border-bright)',
              color: 'var(--ink-primary)',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
            }}
          />
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`btn-action-pill ${selectedCategory === 'ALL' ? 'primary' : ''}`}
            style={{
              fontSize: '0.8rem',
              padding: '0.4rem 0.85rem',
              background: selectedCategory === 'ALL' ? undefined : 'rgba(18, 22, 32, 0.6)',
              borderColor: selectedCategory === 'ALL' ? undefined : 'var(--glass-border)',
              color: selectedCategory === 'ALL' ? '#FFF' : 'var(--ink-secondary)',
            }}
          >
            <Filter className="w-3.5 h-3.5" /> Todos ({catalog.length})
          </button>

          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn-action-pill ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'primary' : ''}`}
              style={{
                fontSize: '0.8rem',
                padding: '0.4rem 0.85rem',
                background: selectedCategory.toLowerCase() === cat.toLowerCase() ? undefined : 'rgba(18, 22, 32, 0.6)',
                borderColor: selectedCategory.toLowerCase() === cat.toLowerCase() ? undefined : 'var(--glass-border)',
                color: selectedCategory.toLowerCase() === cat.toLowerCase() ? '#FFF' : 'var(--ink-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Visual Cards Grid Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
            paddingRight: '0.25rem',
          }}
        >
          {filteredCatalog.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-muted)' }}>
              No se encontraron alimentos que coincidan con &quot;{searchTerm}&quot;.
            </div>
          ) : (
            filteredCatalog.map((food) => {
              const meta = getFoodMeta(food.name, food.category);
              const isSelected = food.id === selectedFoodId;

              return (
                <div
                  key={food.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelect(food);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(food);
                      onClose();
                    }
                  }}
                  style={{
                    background: isSelected ? 'rgba(0, 230, 118, 0.12)' : 'rgba(18, 22, 32, 0.7)',
                    border: `1px solid ${isSelected ? 'var(--accent-emerald)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--glass-border-bright)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Photo Thumbnail Banner with Overlay Emoji */}
                  <div style={{ height: '110px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={meta.image}
                      alt={food.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.75)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        background: 'rgba(10, 13, 20, 0.8)',
                        backdropFilter: 'blur(8px)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <span>{meta.emoji}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: meta.color }}>{meta.badge}</span>
                    </div>

                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: 'var(--accent-emerald)',
                          color: '#000',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={16} />
                      </div>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-primary)', marginBottom: '0.2rem' }}>
                        {food.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: '0.6rem' }}>
                        {food.category}
                      </div>
                    </div>

                    {food.nutrition && (
                      <div
                        style={{
                          background: 'rgba(10, 13, 20, 0.6)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.4rem 0.6rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                        }}
                      >
                        <span style={{ color: 'var(--accent-ember)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Flame className="w-3.5 h-3.5" /> {food.nutrition.calories_kcal} kcal
                        </span>
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                          {food.nutrition.protein_g}g prot
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
