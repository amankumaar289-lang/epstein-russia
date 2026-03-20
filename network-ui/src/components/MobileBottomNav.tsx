import { useState } from 'react';
import type { Person, TimelineEvent, DocumentRecord, Stats, RelationType } from '../types';
import DocumentModal from './DocumentModal';

interface MobileBottomNavProps {
  stats?: Stats | null;
  persons: Person[];
  timeline: TimelineEvent[];
  documents: DocumentRecord[];
  selectedPersonId: string | null;
  onPersonSelect: (id: string | null) => void;
  enabledRelationTypes?: Set<RelationType>;
  onToggleRelationType?: (type: RelationType) => void;
}

type Tab = 'search' | 'timeline' | 'documents';

export default function MobileBottomNav({
  persons,
  timeline,
  documents,
  selectedPersonId,
  onPersonSelect,
}: MobileBottomNavProps) {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  // Фильтрация персон по поисковому запросу
  const filteredPersons = searchQuery.trim().length >= 2
    ? persons.filter(p =>
      p.name_ru.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : persons;

  return (
    <>
      {/* Развёрнутая панель */}
      {activeTab && (
        <div className="fixed inset-x-0 bottom-16 bg-[#16181d] border-t border-[#2d3139] max-h-[70vh] overflow-y-auto z-40">
          {/* Кнопка закрытия */}
          <button
            onClick={() => setActiveTab(null)}
            className="absolute top-3 right-3 p-2 text-gray-500 hover:text-white transition-colors z-10"
          >
            ✕
          </button>

          {/* Поиск */}
          {activeTab === 'search' && (
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск фигурантов..."
                className="w-full px-4 py-3 bg-[#0c0d10] border border-[#2d3139] rounded text-white focus:outline-none focus:border-[#b91c1c] transition-all placeholder:text-gray-600 mb-4"
                autoFocus
              />

              {selectedPersonId && (
                <div className="mb-4 bg-[#b91c1c]/20 border border-[#b91c1c]/40 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5">Выбран:</div>
                    <div className="font-medium text-white">
                      {persons.find(p => p.id === selectedPersonId)?.name_ru || selectedPersonId}
                    </div>
                  </div>
                  <button
                    onClick={() => onPersonSelect(null)}
                    className="px-3 py-1 bg-[#b91c1c] hover:bg-[#991b1b] rounded text-sm text-white"
                  >
                    Очистить
                  </button>
                </div>
              )}

              <div className="space-y-1">
                {filteredPersons.map(person => (
                  <button
                    key={person.id}
                    onClick={() => {
                      onPersonSelect(person.id);
                      setActiveTab(null);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${selectedPersonId === person.id
                      ? 'bg-[#b91c1c]/20 border border-[#b91c1c]/30'
                      : 'hover:bg-[#1e293b]'
                      }`}
                  >
                    {person.photo_url ? (
                      <img src={person.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-xs text-gray-500">
                        {person.name_ru.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white text-sm">{person.name_ru}</div>
                      <div className="text-[10px] text-gray-500">{person.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Хронология */}
          {activeTab === 'timeline' && (
            <div className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#fbbf24] mb-4">
                Хронология ({timeline.length} событий)
              </h3>
              {timeline.length > 0 ? (
                <div className="space-y-3">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="border-l-2 border-[#b91c1c] pl-4 py-2">
                      <div className="text-sm font-bold text-[#fbbf24] mb-1">{event.year}</div>
                      <p className="text-sm text-gray-300 leading-relaxed">{event.event_ru}</p>
                      {event.related_people.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.related_people.map((pid, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                onPersonSelect(pid);
                                setActiveTab(null);
                              }}
                              className="px-2 py-0.5 bg-[#0c0d10] border border-[#2d3139] rounded text-[10px] text-gray-400 hover:text-[#fbbf24] transition-colors"
                            >
                              {persons.find(p => p.id === pid)?.name_ru || pid}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Нет событий</div>
              )}
            </div>
          )}

          {/* Документы */}
          {activeTab === 'documents' && (
            <div className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#fbbf24] mb-4">
                Документы ({documents.length})
              </h3>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="w-full text-left bg-[#0c0d10]/50 rounded-lg p-3 hover:bg-[#1e293b] transition-colors"
                    >
                      <div className="text-sm font-medium text-[#06b6d4]">{doc.title_ru}</div>
                      <div className="text-[10px] text-gray-500 mt-1">{doc.date} • {doc.source}</div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{doc.excerpt_ru}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Нет документов</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Панель навигации */}
      <div className="fixed inset-x-0 bottom-0 bg-[#16181d] border-t border-[#2d3139] z-50">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab(activeTab === 'search' ? null : 'search')}
            className={`flex-1 py-4 flex flex-col items-center border-t-2 transition-all ${activeTab === 'search' ? 'text-[#fbbf24] border-[#fbbf24] bg-[#fbbf24]/5' : 'text-gray-500 border-transparent'
              }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Поиск</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'timeline' ? null : 'timeline')}
            className={`flex-1 py-4 flex flex-col items-center border-t-2 transition-all ${activeTab === 'timeline' ? 'text-[#b91c1c] border-[#b91c1c] bg-[#b91c1c]/5' : 'text-gray-500 border-transparent'
              }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Хронология</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'documents' ? null : 'documents')}
            className={`flex-1 py-4 flex flex-col items-center border-t-2 transition-all ${activeTab === 'documents' ? 'text-[#06b6d4] border-[#06b6d4] bg-[#06b6d4]/5' : 'text-gray-500 border-transparent'
              }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider">Документы</span>
          </button>
        </div>
      </div>

      {/* Document Modal */}
      {selectedDoc && (
        <DocumentModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </>
  );
}
