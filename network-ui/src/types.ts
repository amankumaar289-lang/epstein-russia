// === Типы данных для инфографики «Эпштейн — Российские связи» ===

export interface Person {
  id: string;
  name_en: string;
  name_ru: string;
  type: string;
  role: string;
  mentions: number;
  first_year: number;
  photo_url: string;
  bio_short: string;
  connectionCount?: number;
  isEpstein?: boolean;
}

export interface Relation {
  id: string;
  from: string;
  to: string;
  type: RelationType;
  description_ru: string;
  date: string;
  source: string;
  strength: number; // 1-4
}

export type RelationType =
  | 'meeting'
  | 'intermediary'
  | 'gift'
  | 'contact_attempt'
  | 'business_contact'
  | 'business_deal'
  | 'travel'
  | 'property'
  | 'mentioned_together'
  | 'indirect';

export interface DocumentRecord {
  id: string;
  title_ru: string;
  date: string;
  excerpt_ru: string;
  source: string;
  tags: string[];
}

export interface TimelineEvent {
  year: number;
  event_ru: string;
  related_people: string[];
  related_docs: string[];
}

// D3 graph types — формат от /api/graph
export interface GraphNode {
  id: string;
  name_ru: string;
  name_en: string;
  role: string;
  photo_url: string;
  bio_short: string;
  mentions: number;
  connectionCount: number;
  isEpstein: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: RelationType;
  description_ru: string;
  strength: number;
  date: string;
  id: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Детальная персона (ответ /api/person/:id) — вложенная структура
export interface PersonDetail {
  person: Person;
  relations: Relation[];
  documents: DocumentRecord[];
  connected_persons: Person[];
}

// Ответ /api/stats
export interface Stats {
  totalPersons: number;
  totalRelations: number;
  totalDocuments: number;
  totalTimelineEvents: number;
  relationTypes: { category: string; count: number }[];
  categories: { category: string; count: number }[];
}

// Ответ /api/search
export interface SearchResult {
  persons: Person[];
  documents: DocumentRecord[];
}

// Конфиг типов связей для отображения
export interface RelationTypeConfig {
  label: string;
  color: string;
  // SVG path для иконки (viewBox="0 0 16 16")
  svgPath: string;
  emoji: string;
}

export const RELATION_TYPE_CONFIG: Record<RelationType, RelationTypeConfig> = {
  meeting: {
    label: 'Личные встречи',
    color: '#22c55e',
    svgPath: 'M8 1.5a3 3 0 0 1 3 3v1a3 3 0 0 1-6 0v-1a3 3 0 0 1 3-3ZM3 13c0-2.76 2.24-5 5-5s5 2.24 5 5H3Z',
    emoji: '👤',
  },
  intermediary: {
    label: 'Посредничество',
    color: '#a855f7',
    svgPath: 'M4 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM1 12c0-1.66 1.34-3 3-3s3 1.34 3 3H1Zm8 0c0-1.66 1.34-3 3-3s3 1.34 3 3H9ZM5 8h6',
    emoji: '👨‍👩‍👧‍👦',
  },
  gift: {
    label: 'Подарки',
    color: '#f59e0b',
    svgPath: 'M3 7h10v7H3V7Zm0 0h10M8 7v7M5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4C6.88 4 8 5.5 8 7Zm5 0C11.33 7 12 6.33 12 5.5S11.33 4 10.5 4C9.12 4 8 5.5 8 7Z',
    emoji: '🎁',
  },
  contact_attempt: {
    label: 'Попытки контакта',
    color: '#ef4444',
    svgPath: 'M3 2h4l1.5 3L6 7s1.5 2.5 3 4l2-2.5 3 1.5v4c0 .55-.45 1-1 1C6 15 1 10 1 3c0-.55.45-1 1-1h1Z',
    emoji: '📞',
  },
  business_contact: {
    label: 'Деловые контакты',
    color: '#3b82f6',
    svgPath: 'M2 5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5Zm3-3h6v2H5V2Zm0 6h6m-6 3h4',
    emoji: '💼',
  },
  business_deal: {
    label: 'Бизнес-сделки',
    color: '#06b6d4',
    svgPath: 'M8 1v2m0 10v2M1 8h2m10 0h2M4.22 4.22l1.42 1.42m4.72 4.72l1.42 1.42M4.22 11.78l1.42-1.42m4.72-4.72l1.42-1.42M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    emoji: '🤝',
  },
  travel: {
    label: 'Совместные поездки',
    color: '#8b5cf6',
    svgPath: 'M2 12l5-9 3 4 4-6m-1.5 0H14v1.5M2 12h12',
    emoji: '✈️',
  },
  property: {
    label: 'Недвижимость',
    color: '#10b981',
    svgPath: 'M2 14V7l6-5 6 5v7H2Zm4 0v-4h4v4',
    emoji: '🏠',
  },
  mentioned_together: {
    label: 'Совместное упоминание',
    color: '#6b7280',
    svgPath: 'M3 3h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 3h8M4 9h5',
    emoji: '📄',
  },
  indirect: {
    label: 'Косвенная связь',
    color: '#9ca3af',
    svgPath: 'M10 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3 8h4M1 6l2 2-2 2m6 2c0-1.66 1.34-3 3-3s3 1.34 3 3H7Z',
    emoji: '🔗',
  },
};

// Вспомогательная функция для рендера SVG-иконки типа связи
export function getRelationIcon(type: RelationType, size = 16): string {
  const config = RELATION_TYPE_CONFIG[type];
  if (!config) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="${config.color}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="${config.svgPath}"/></svg>`;
}

// Классификация типа связи для легенды
export type RelationCategory = 'direct' | 'attempt' | 'indirect';

export function getRelationCategory(type: RelationType): RelationCategory {
  if (['meeting', 'business_deal', 'gift', 'travel', 'property', 'intermediary', 'business_contact'].includes(type)) return 'direct';
  if (type === 'contact_attempt') return 'attempt';
  return 'indirect';
}

export const RELATION_CATEGORY_CONFIG: Record<RelationCategory, { label: string; color: string; symbol: string }> = {
  direct: { label: 'Прямая связь', color: '#22c55e', symbol: '●' },
  attempt: { label: 'Попытка контакта', color: '#ef4444', symbol: '●' },
  indirect: { label: 'Косвенная связь', color: '#6b7280', symbol: '○' },
};
