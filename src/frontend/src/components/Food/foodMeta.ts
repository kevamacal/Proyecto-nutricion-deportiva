// Visual Mapping Helper for Food Images, Emojis, Macro Density, and Category Identifiers

export interface FoodMeta {
  emoji: string;
  badge: string;
  color: string;
  image: string;
}

export interface CategoryMeta {
  badge: string;
  color: string;
  emoji: string;
  background: string;
}

interface FoodRule {
  keywords: string[];
  getMeta: (name: string) => FoodMeta;
}

const CARBS_IMAGE_ARROZ = 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=80';
const CARBS_IMAGE_PASTA = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80';
const FATS_IMAGE_AVOCADO = 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80';
const FATS_IMAGE_NUTS = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80';
const PROTEIN_IMAGE_POULTRY = 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80';
const DEFAULT_IMAGE_SALAD = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80';

export interface CategoryRule {
  keywords: string[];
  meta: CategoryMeta;
}
const CATEGORY_RULES: CategoryRule[] = [
  {
    keywords: ['carne', 'prote'],
    meta: { badge: 'PROTEÍNAS', color: '#00E676', emoji: '🥩', background: 'rgba(0, 230, 118, 0.15)' },
  },
  {
    keywords: ['pescado', 'marisco'],
    meta: { badge: 'PESCADO Y MARISCO', color: '#00E5FF', emoji: '🐟', background: 'rgba(0, 229, 255, 0.15)' },
  },
  {
    keywords: ['carb', 'grano', 'cereal', 'pasta', 'arroz', 'tuber', 'tubérculo'],
    meta: { badge: 'CARBOHIDRATOS', color: '#FF6B35', emoji: '🌾', background: 'rgba(255, 107, 53, 0.15)' },
  },
  {
    keywords: ['grasa', 'aceite', 'fruto seco', 'seed'],
    meta: { badge: 'GRASAS SALUDABLES', color: '#A855F7', emoji: '🥑', background: 'rgba(168, 85, 247, 0.15)' },
  },
  {
    keywords: ['lacteo', 'lácteo', 'leche', 'yogur', 'queso'],
    meta: { badge: 'LÁCTEOS', color: '#00E5FF', emoji: '🥛', background: 'rgba(0, 229, 255, 0.15)' },
  },
  {
    keywords: ['fruta', 'verdura', 'vegetal'],
    meta: { badge: 'FRUTAS Y VERDURAS', color: '#FFD700', emoji: '🍎', background: 'rgba(255, 215, 0, 0.15)' },
  },
  {
    keywords: ['suplement'],
    meta: { badge: 'SUPLEMENTACIÓN', color: '#38BDF8', emoji: '🥤', background: 'rgba(56, 189, 248, 0.15)' },
  },
];

// Declarative Rule Map for Low Cognitive Complexity
const NAME_RULES: FoodRule[] = [
  {
    keywords: ['pollo', 'pavo', 'ternera', 'carne', 'pechuga'],
    getMeta: () => ({
      emoji: '🍗',
      badge: 'PROTEÍNA ALTA',
      color: '#00E676',
      image: PROTEIN_IMAGE_POULTRY,
    }),
  },
  {
    keywords: ['atún', 'salmón', 'pescado', 'merluza'],
    getMeta: () => ({
      emoji: '🐟',
      badge: 'PROTEÍNA Y OMEGA-3',
      color: '#00E5FF',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80',
    }),
  },
  {
    keywords: ['huevo'],
    getMeta: () => ({
      emoji: '🥚',
      badge: 'PROTEÍNA / GRASA',
      color: '#00E676',
      image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80',
    }),
  },
  {
    keywords: ['arroz', 'pasta', 'pan', 'quinoa', 'patata', 'batata'],
    getMeta: (name: string) => {
      let emoji = '🍝';
      if (name.includes('arroz')) emoji = '🍚';
      else if (name.includes('patata')) emoji = '🥔';

      const image = name.includes('arroz') ? CARBS_IMAGE_ARROZ : CARBS_IMAGE_PASTA;
      return { emoji, badge: 'CARBOHIDRATOS', color: '#FF6B35', image };
    },
  },
  {
    keywords: ['avena', 'cereales', 'copos'],
    getMeta: () => ({
      emoji: '🌾',
      badge: 'CARBO DE ASIMILACIÓN LENTA',
      color: '#FF8C00',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    }),
  },
  {
    keywords: ['aceite', 'aguacate', 'almendras', 'nueces', 'cacahuete'],
    getMeta: (name: string) => {
      let emoji = '🥜';
      if (name.includes('aceite')) emoji = '🫒';
      else if (name.includes('aguacate')) emoji = '🥑';

      const image = name.includes('aguacate') ? FATS_IMAGE_AVOCADO : FATS_IMAGE_NUTS;
      return { emoji, badge: 'GRASAS SALUDABLES', color: '#A855F7', image };
    },
  },
  {
    keywords: ['plátano', 'manzana', 'fruta', 'arándanos', 'fresa'],
    getMeta: (name: string) => ({
      emoji: name.includes('plátano') ? '🍌' : '🍎',
      badge: 'FRUTA',
      color: '#FFD700',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    }),
  },
  {
    keywords: ['leche', 'yogur', 'queso', 'lácteo'],
    getMeta: () => ({
      emoji: '🥛',
      badge: 'LÁCTEO',
      color: '#00E5FF',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    }),
  },
  {
    keywords: ['proteína', 'whey', 'suplemento', 'creatina'],
    getMeta: () => ({
      emoji: '🥤',
      badge: 'SUPLEMENTACIÓN',
      color: '#00E676',
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=400&q=80',
    }),
  },
];

const CATEGORY_FALLBACKS: FoodRule[] = [
  {
    keywords: ['prote', 'carne', 'pescado'],
    getMeta: () => ({ emoji: '🥩', badge: 'PROTEÍNAS', color: '#00E676', image: PROTEIN_IMAGE_POULTRY }),
  },
  {
    keywords: ['carb', 'grano'],
    getMeta: () => ({ emoji: '🌾', badge: 'CARBOHIDRATOS', color: '#FF6B35', image: CARBS_IMAGE_ARROZ }),
  },
  {
    keywords: ['grasa', 'fruto'],
    getMeta: () => ({ emoji: '🥑', badge: 'GRASAS SALUDABLES', color: '#A855F7', image: FATS_IMAGE_AVOCADO }),
  },
];

export function getFoodMeta(foodName: string, category: string): FoodMeta {
  const name = foodName.toLowerCase();
  const cat = category.toLowerCase();

  for (const rule of NAME_RULES) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return rule.getMeta(name);
    }
  }

  for (const rule of CATEGORY_FALLBACKS) {
    if (rule.keywords.some((kw) => cat.includes(kw))) {
      return rule.getMeta(name);
    }
  }

  return {
    emoji: '🥗',
    badge: 'ALIMENTO NUTRICIONAL',
    color: '#00E676',
    image: DEFAULT_IMAGE_SALAD,
  };
}

export function getCategoryMeta(categoryName: string): CategoryMeta {
  const cat = (categoryName || '').toLowerCase();
  const matchedRule = CATEGORY_RULES.find((rule) =>
    rule.keywords.some((kw) => cat.includes(kw))
  );
  return (
    matchedRule?.meta || {
      badge: categoryName ? categoryName.toUpperCase() : 'GENERAL',
      color: '#94A3B8',
      emoji: '🥗',
      background: 'rgba(148, 163, 184, 0.15)',
    }
  );
}

