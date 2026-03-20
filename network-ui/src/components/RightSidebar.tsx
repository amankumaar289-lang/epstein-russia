import { useState, useEffect } from 'react';
import { fetchPerson } from '../api';
import type { PersonDetail, DocumentRecord, RelationType } from '../types';
import { RELATION_TYPE_CONFIG } from '../types';
import RelationIcon from './RelationIcon';

interface RightSidebarProps {
  personId: string;
  onClose: () => void;
  onOpenDocument: (doc: DocumentRecord) => void;
  onPersonSelect: (personId: string) => void;
}

export default function RightSidebar({ personId, onClose, onOpenDocument, onPersonSelect }: RightSidebarProps) {
  const [data, setData] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPerson(personId)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [personId]);

  if (loading) {
    return (
      <div className="w-96 bg-[#16181d] border-l border-[#2d3139] flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fbbf24]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-96 bg-[#16181d] border-l border-[#2d3139] flex items-center justify-center h-full">
        <div className="text-gray-500">Персона не найдена</div>
      </div>
    );
  }

  const { person, relations, documents, connected_persons } = data;

  return (
    <div className="w-96 bg-[#16181d] border-l border-[#2d3139] flex flex-col h-screen overflow-hidden shadow-2xl">
      {/* Заголовок с фото */}
      <div className="p-6 border-b border-[#2d3139] bg-gradient-to-b from-[#1a1c22] to-[#16181d]">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4 flex-1">
            {/* Фото — крупное */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#2d3139] flex-shrink-0 border-2 border-[#fbbf24]/40 shadow-lg shadow-black/50">
              {person.photo_url ? (
                <img
                  src={person.photo_url}
                  alt={person.name_ru}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#334155] to-[#1e293b]">
                  <span className="text-2xl font-bold text-gray-400">{person.name_ru.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Досье фигуранта</div>
              <h2 className="text-lg font-bold text-white leading-tight">{person.name_ru}</h2>
              <div className="text-xs text-[#fbbf24] font-medium mt-1">{person.role}</div>
              {person.first_year > 0 && (
                <div className="text-[10px] text-gray-500 mt-1">Фигурирует с {person.first_year} г.</div>
              )}
              {/* Mentions badge */}
              {person.mentions > 0 && person.mentions < 9999 && (
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-[#0c0d10] border border-[#2d3139] rounded text-[10px] text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {person.mentions} упоминаний
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors p-1 text-lg flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Bio */}
        {person.bio_short && (
          <p className="text-xs text-gray-400 leading-relaxed mt-4 italic border-l-2 border-[#fbbf24]/30 pl-3">
            {person.bio_short}
          </p>
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto">
        {/* Связи */}
        <div className="p-4 border-b border-[#2d3139]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Связи ({relations.length})
          </h3>
          {relations.length === 0 ? (
            <div className="text-sm text-gray-500">Связи не найдены</div>
          ) : (
            <div className="space-y-2">
              {relations.map(rel => {
                const config = RELATION_TYPE_CONFIG[rel.type as RelationType];
                return (
                  <div
                    key={rel.id}
                    className="bg-[#0c0d10]/50 rounded-lg p-3"
                    style={{ borderLeft: `3px solid ${config?.color || '#4b5563'}` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <RelationIcon type={rel.type} size={16} />
                      <span className="text-xs font-medium" style={{ color: config?.color || '#e2e8f0' }}>
                        {config?.label || rel.type}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-auto">
                        {'●'.repeat(rel.strength)}{'○'.repeat(4 - rel.strength)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{rel.description_ru}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] text-gray-500">{rel.date || 'Дата не указана'}</span>
                      {rel.source.split(',').map((src, idx) => {
                        const trimmed = src.trim();
                        const isEfta = trimmed.toLowerCase().includes('efta');
                        return (
                          <span
                            key={idx}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${isEfta ? 'bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20' : 'text-gray-600'}`}
                          >
                            {trimmed}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Документы */}
        {documents.length > 0 && (
          <div className="p-4 border-b border-[#2d3139]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Документы ({documents.length})
            </h3>
            <div className="space-y-2">
              {documents.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => onOpenDocument(doc)}
                  className="w-full text-left bg-[#0c0d10]/50 rounded-lg p-3 hover:bg-[#1e293b] transition-colors group"
                >
                  <div className="text-sm font-medium text-[#06b6d4] group-hover:text-[#22d3ee] transition-colors">{doc.title_ru}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{doc.date}</div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">{doc.excerpt_ru}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Связанные персоны — кликабельные */}
        {connected_persons.length > 0 && (
          <div className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Связанные персоны ({connected_persons.length})
            </h3>
            <div className="space-y-1">
              {connected_persons.map(cp => (
                <button
                  key={cp.id}
                  onClick={() => onPersonSelect(cp.id)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-[#1e293b] transition-colors group text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2d3139] overflow-hidden flex-shrink-0 border border-[#3d4149] group-hover:border-[#fbbf24]/30 transition-colors">
                    {cp.photo_url ? (
                      <img
                        src={cp.photo_url}
                        alt={cp.name_ru}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold">
                        {cp.name_ru.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white group-hover:text-[#fbbf24] transition-colors truncate">{cp.name_ru}</div>
                    <div className="text-[10px] text-gray-500 truncate">{cp.role}</div>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
