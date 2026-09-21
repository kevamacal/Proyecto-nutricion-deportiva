// Visual Mapping Helper for Food Images, Emojis, and Macro Density

export interface FoodMeta {
  emoji: string;
  badge: string;
  color: string;
  image: string;
}

export function getFoodMeta(foodName: string, category: string): FoodMeta {
  const name = foodName.toLowerCase();
  const cat = category.toLowerCase();

  if (name.includes('pollo') || name.includes('pavo') || name.includes('ternera') || name.includes('carne') || name.includes('pechuga')) {
    return {
      emoji: '🍗',
      badge: 'PROTEÍNA ALTA',
      color: '#00E676',
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80',
    };
  }
  if (name.includes('atún') || name.includes('salmón') || name.includes('pescado') || name.includes('merluza')) {
    return {
      emoji: '🐟',
      badge: 'PROTEÍNA Y OMEGA-3',
      color: '#00E5FF',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80',
    };
  }
  if (name.includes('huevo')) {
    return {
      emoji: '🥚',
      badge: 'PROTEÍNA / GRASA',
      color: '#00E676',
      image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80',
    };
  }
  if (name.includes('arroz') || name.includes('pasta') || name.includes('pan') || name.includes('quinoa') || name.includes('patata') || name.includes('batata')) {
    return {
      emoji: name.includes('arroz') ? '🍚' : name.includes('patata') ? '🥔' : '🍝',
      badge: 'CARBOHIDRATOS',
      color: '#FF6B35',
      image: name.includes('arroz')
        ? 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
    };
  }
  if (name.includes('avena') || name.includes('cereales') || name.includes('copos')) {
    return {
      emoji: '🌾',
      badge: 'CARBO DE ASIMILACIÓN LENTA',
      color: '#FF8C00',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    };
  }
  if (name.includes('aceite') || name.includes('aguacate') || name.includes('almendras') || name.includes('nueces') || name.includes('cacahuete')) {
    return {
      emoji: name.includes('aceite') ? '🫒' : name.includes('aguacate') ? '🥑' : '🥜',
      badge: 'GRASAS SALUDABLES',
      color: '#A855F7',
      image: name.includes('aguacate')
        ? 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    };
  }
  if (name.includes('plátano') || name.includes('manzana') || name.includes('fruta') || name.includes('arándanos') || name.includes('fresa')) {
    return {
      emoji: name.includes('plátano') ? '🍌' : '🍎',
      badge: 'FRUTA / GLICEMIA',
      color: '#FFD700',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    };
  }
  if (name.includes('leche') || name.includes('yogur') || name.includes('queso') || name.includes('lacteo')) {
    return {
      emoji: '🥛',
      badge: 'LÁCTEO / CASEÍNA',
      color: '#00E5FF',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    };
  }
  if (name.includes('proteína') || name.includes('whey') || name.includes('suplemento')) {
    return {
      emoji: '🥤',
      badge: 'SUPLEMENTACIÓN WHEY',
      color: '#00E676',
      image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=400&q=80',
    };
  }

  // Fallback by category
  if (cat.includes('prote') || cat.includes('carne') || cat.includes('pescado')) {
    return { emoji: '🥩', badge: 'PROTEÍNAS', color: '#00E676', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80' };
  }
  if (cat.includes('carb') || cat.includes('grano')) {
    return { emoji: '🌾', badge: 'CARBOHIDRATOS', color: '#FF6B35', image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=80' };
  }
  if (cat.includes('grasa') || cat.includes('fruto')) {
    return { emoji: '🥑', badge: 'GRASAS SALUDABLES', color: '#A855F7', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80' };
  }

  return { emoji: '🥗', badge: 'ALIMENTO NUTRICIONAL', color: '#00E676', image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80' };
}
