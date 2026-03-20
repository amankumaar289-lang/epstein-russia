import type { DocumentRecord } from '../types';

interface DocumentModalProps {
  doc: DocumentRecord;
  onClose: () => void;
}

export default function DocumentModal({ doc, onClose }: DocumentModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#16181d] rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-[#2d3139]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="p-6 border-b border-[#2d3139] bg-gradient-to-r from-[#1a1c22] to-[#16181d] rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                Документ {doc.id}
              </div>
              <h2 className="text-xl font-bold text-[#fbbf24] leading-tight">
                {doc.title_ru}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                {doc.date && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {doc.date}
                  </span>
                )}
                {doc.source && (
                  <span className="flex items-center gap-1 truncate">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> {doc.source}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-500 hover:text-white text-xl leading-none transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          {doc.excerpt_ru ? (
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                {doc.excerpt_ru}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Текст документа недоступен
            </div>
          )}
        </div>

        {/* Футер с тегами */}
        <div className="p-4 border-t border-[#2d3139] flex justify-between items-center">
          <div className="flex flex-wrap gap-1.5">
            {doc.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-[#334155]/50 border border-[#334155] rounded text-[10px] text-gray-400 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded transition-colors text-sm font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
