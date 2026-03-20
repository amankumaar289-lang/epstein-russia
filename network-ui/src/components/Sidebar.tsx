import { useState, useCallback } from 'react';
import type { Stats, Person, TimelineEvent, RelationType } from '../types';
import { RELATION_TYPE_CONFIG, RELATION_CATEGORY_CONFIG, getRelationCategory } from '../types';
import type { RelationCategory } from '../types';
import { searchAll } from '../api';


interface SidebarProps {
  stats: Stats | null;
  persons: Person[];
  timeline: TimelineEvent[];
  selectedPersonId: string | null;
  onPersonSelect: (personId: string | null) => void;
  enabledRelationTypes: Set<RelationType>;
  onToggleRelationType: (type: RelationType) => void;
  onResetFilters: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  minYear?: number;
  maxYear?: number;
}

const MIN_YEAR = 2009;
const MAX_YEAR = 2018;

export default function Sidebar({
  stats,
  persons,
  timeline,
  selectedPersonId,
  onPersonSelect,
  enabledRelationTypes,
  onToggleRelationType,
  onResetFilters,
  searchQuery,
  onSearchQueryChange,
  selectedYear,
  onYearChange,
}: SidebarProps) {
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [personsExpanded, setPersonsExpanded] = useState(true);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  // Поиск с дебаунсом
  const handleSearch = useCallback(async (query: string) => {
    onSearchQueryChange(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const result = await searchAll(query);
      setSearchResults(result.persons);
    } catch (err) {
      console.error('Ошибка поиска:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchQueryChange]);

  return (
    <div className="w-80 bg-[#16181d] border-r border-[#2d3139] flex flex-col h-screen overflow-hidden shadow-2xl">
      {/* Заголовок */}
      <div className="px-6 py-5 border-b border-[#2d3139] flex-shrink-0 bg-gradient-to-b from-[#1a1c22] to-[#16181d]">
        <h1 className="font-bold text-[#fbbf24] tracking-tight" style={{ fontSize: '22px' }}>
          ЭПШТЕЙН
        </h1>
        <div className="text-[10px] text-[#b91c1c] font-bold uppercase tracking-[0.2em] mt-1">
          Российский след
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="p-4 border-b border-[#2d3139] flex-shrink-0 bg-[#0c0d10]/30">
          <div className="space-y-2 text-[11px] uppercase tracking-wider font-medium">
            <div className="flex justify-between">
              <span className="text-gray-500">Персон:</span>
              <span className="text-[#fbbf24]">{stats.totalPersons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Связей:</span>
              <span className="text-[#b91c1c]">{stats.totalRelations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Документов:</span>
              <span className="text-gray-300">{stats.totalDocuments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Событий:</span>
              <span className="text-gray-300">{stats.totalTimelineEvents}</span>
            </div>
          </div>
        </div>
      )}

      {/* Выбранная персона */}
      {selectedPersonId && (
        <div className="p-4 border-b border-[#2d3139] flex-shrink-0 bg-[#b91c1c]/10">
          <div className="flex items-center justify-between border border-[#b91c1c]/30 rounded p-3">
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Выбранная персона:</div>
              <div className="font-semibold text-[#e2e8f0] text-sm">
                {persons.find(p => p.id === selectedPersonId)?.name_ru || selectedPersonId}
              </div>
            </div>
            <button
              onClick={() => onPersonSelect(null)}
              className="p-2 hover:bg-[#b91c1c]/20 rounded transition-colors text-[#b91c1c]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Слайдер таймлайна */}
      <div className="p-4 border-b border-[#2d3139] flex-shrink-0 bg-[#0c0d10]/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">📅 Период</span>
          {selectedYear !== null && (
            <button
              onClick={() => onYearChange(null)}
              className="text-[9px] text-gray-500 hover:text-[#fbbf24] border border-[#2d3139] hover:border-[#fbbf24]/40 px-2 py-0.5 rounded transition-all"
            >
              ↻ Все годы
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-600 w-8 tabular-nums">{MIN_YEAR}</span>
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={selectedYear ?? MAX_YEAR}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full cursor-pointer"
            style={{ accentColor: '#dc2626' }}
          />
          <span className="text-[10px] text-gray-600 w-8 tabular-nums text-right">{MAX_YEAR}</span>
        </div>
        <div className="text-center mt-1.5">
          <span className="text-sm font-bold" style={{ color: selectedYear !== null ? '#fbbf24' : '#4b5563' }}>
            {selectedYear !== null ? `до ${selectedYear} г.` : 'Все годы'}
          </span>
        </div>
      </div>

      {/* Скроллируемый контент */}
      <div className="flex-1 overflow-y-auto">
        {/* Поиск */}
        <div className="p-4 border-b border-[#2d3139]">
          <label className="block text-sm text-gray-400 mb-2">
            <svg className="inline w-4 h-4 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>Поиск по имени:
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="напр., Чуркин, Лавров..."
            className="w-full px-3 py-2 bg-[#0c0d10] border border-[#2d3139] rounded text-sm focus:outline-none focus:border-[#b91c1c] transition-all placeholder:text-gray-600"
          />
          {/* Результаты поиска */}
          {searchQuery.trim().length >= 2 && (
            <div className="mt-2 bg-[#0c0d10] border border-[#2d3139] rounded max-h-40 overflow-y-auto">
              {isSearching ? (
                <div className="px-3 py-2 text-sm text-gray-500">Поиск...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(person => (
                  <button
                    key={person.id}
                    onClick={() => {
                      onPersonSelect(person.id);
                      onSearchQueryChange('');
                      setSearchResults([]);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[#2d3139] transition-colors border-b border-[#2d3139] last:border-b-0"
                  >
                    <div className="font-medium text-white">{person.name_ru}</div>
                    <div className="text-xs text-gray-500">{person.role}</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">Не найдено</div>
              )}
            </div>
          )}
        </div>




        <div className="p-4 border-b border-[#2d3139]">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest mb-3 text-gray-400 hover:text-[#fbbf24] transition-colors"
          >
            <span>Типы связей</span>
            <span>{filtersExpanded ? '−' : '+'}</span>
          </button>
          {filtersExpanded && (
            <>
              <div className="space-y-4">
                {(Object.entries(RELATION_CATEGORY_CONFIG) as [RelationCategory, { label: string; color: string; symbol: string }][]).map(([cat, catCfg]) => {
                  const typesInCategory = (Object.entries(RELATION_TYPE_CONFIG) as [RelationType, any][]).filter(
                    ([type]) => getRelationCategory(type) === cat
                  );

                  if (typesInCategory.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center gap-2 px-1 mb-1.5 opacity-60">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">{catCfg.label}</span>
                        <div className="h-px flex-1 bg-[#2d3139]"></div>
                      </div>
                      {typesInCategory.map(([type, config]) => {
                        const isEnabled = enabledRelationTypes.has(type);
                        const count = stats?.categories.find(c => c.category === type)?.count || 0;
                        return (
                          <button
                            key={type}
                            onClick={() => onToggleRelationType(type)}
                            className={`w-full flex items-center justify-between rounded px-3 py-1.5 text-xs transition-all ${isEnabled
                              ? 'bg-[#0c0d10] text-white border border-white/10'
                              : 'bg-[#0c0d10]/30 text-gray-500 border border-transparent opacity-60 hover:opacity-100'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{config.emoji}</span>
                              <span className="leading-none">{config.label}</span>
                            </div>
                            {count > 0 && (
                              <span className="font-mono text-[10px] text-gray-600">{count}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Сброс фильтров */}
              {enabledRelationTypes.size < Object.keys(RELATION_TYPE_CONFIG).length && (
                <button
                  onClick={onResetFilters}
                  className="w-full mt-2 py-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-[#fbbf24] border border-[#2d3139] hover:border-[#fbbf24]/30 rounded transition-all"
                >
                  ↻ Сбросить фильтры
                </button>
              )}
            </>
          )}
        </div>

        {/* Список персон */}
        <div className="p-4 border-b border-[#2d3139]">
          <button
            onClick={() => setPersonsExpanded(!personsExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest mb-3 text-gray-400 hover:text-[#fbbf24] transition-colors"
          >
            <span>Все фигуранты ({persons.length})</span>
            <span>{personsExpanded ? '−' : '+'}</span>
          </button>
          {personsExpanded && (
            <div className="space-y-1">
              {[...persons].sort((a, b) => (b.connectionCount || 0) - (a.connectionCount || 0)).map(person => {
                const isEpstein = person.id === 'epstein';
                const connections = person.connectionCount || 0;
                return (
                  <button
                    key={person.id}
                    onClick={() => onPersonSelect(person.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all ${selectedPersonId === person.id
                      ? 'bg-[#b91c1c]/20 border border-[#b91c1c]/30 text-white'
                      : 'hover:bg-[#0c0d10]/50 text-gray-300'
                      }`}
                  >
                    <div className="relative flex-shrink-0">
                      {person.photo_url ? (
                        <img
                          src={person.photo_url}
                          alt={person.name_ru}
                          className={`w-8 h-8 rounded-full object-cover ${isEpstein ? 'border-2 border-[#dc2626]' : 'border border-[#2d3139]'}`}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                          {person.name_ru.charAt(0)}
                        </div>
                      )}
                      {connections > 0 && (
                        <span className="absolute -top-1 -right-0.5 bg-[#b91c1c] text-white text-[8px] font-bold px-1 rounded-full border border-[#16181d]">
                          {connections}
                        </span>
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium truncate">{person.name_ru}</div>
                      <div className="text-[10px] text-gray-500 truncate leading-tight">{person.role}</div>
                    </div>
                    {isEpstein && (
                      <span className="text-[8px] px-1 py-0.5 bg-[#b91c1c]/30 text-[#ef4444] rounded font-bold uppercase border border-[#b91c1c]/20">ЦУ</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>



        {/* Таймлайн */}
        <div className="p-4">
          <button
            onClick={() => setTimelineExpanded(!timelineExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest mb-3 text-gray-400 hover:text-[#fbbf24] transition-colors"
          >
            <span>Хронология ({timeline.length})</span>
            <span>{timelineExpanded ? '−' : '+'}</span>
          </button>
          {timelineExpanded && (
            <div className="space-y-3">
              {[...timeline].sort((a, b) => a.year - b.year).map((event, idx) => (
                <div
                  key={idx}
                  className="border-l-2 border-[#b91c1c] pl-4 py-2"
                >
                  <div className="text-xs font-bold text-[#fbbf24] mb-1">
                    {event.year}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {event.event_ru}
                  </p>
                  {event.related_people.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.related_people.map((personId, i) => (
                        <button
                          key={i}
                          onClick={() => onPersonSelect(personId)}
                          className="px-2 py-0.5 bg-[#0c0d10] border border-[#2d3139] rounded text-xs text-gray-400 hover:text-[#fbbf24] hover:border-[#fbbf24]/30 transition-colors"
                        >
                          {persons.find(p => p.id === personId)?.name_ru || personId}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
