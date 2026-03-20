import type { Stats, RelationType } from '../types';
import { RELATION_TYPE_CONFIG } from '../types';
import RelationIcon from './RelationIcon';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: Stats | null;
}

export function WelcomeModal({ isOpen, onClose, stats }: WelcomeModalProps) {
  if (!isOpen) return null;

  // Ключевые типы связей для отображения
  const keyTypes: { type: RelationType; desc: string }[] = [
    { type: 'meeting', desc: 'подтверждённые контакты' },
    { type: 'intermediary', desc: 'через финансовых помощников' },
    { type: 'business_contact', desc: 'бизнес-связи' },
    { type: 'contact_attempt', desc: 'неосуществлённые' },
    { type: 'mentioned_together', desc: 'в контексте дела' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#16181d] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#2d3139]">
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-2 text-[#b91c1c] font-serif uppercase tracking-tight">
            Российский след в файлах Эпштейна
          </h2>
          <p className="text-sm text-[#fbbf24] mb-6 font-medium uppercase tracking-wider">
            Интерактивная карта связей
          </p>

          <div className="space-y-4 text-gray-300">
            <p className="text-lg font-medium text-white border-b border-[#2d3139] pb-3">
              {stats ? `${stats.totalRelations} подтверждённых связей` : '18 подтверждённых связей'}, касающихся России.
              <span className="block text-xs text-gray-500 mt-1 font-normal">
                {stats ? `${stats.totalPersons} фигурантов · ${stats.totalDocuments} документов · ${stats.totalTimelineEvents} событий` : '16 фигурантов · 22 документа · 10 событий'}
              </span>
            </p>

            <p className="text-sm leading-relaxed text-gray-400">
              Данные извлечены из электронных писем и документов, предоставленных Комитетом по надзору
              Палаты представителей США. Выделены только те цепочки, которые ведут к российским гражданам,
              компаниям или чиновникам.
            </p>

            <div className="bg-[#0c0d10] border border-[#2d3139] rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-[#fbbf24] mb-3 uppercase text-[10px] tracking-widest">Инструкция по работе:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <span><span className="text-white font-medium">Поиск:</span> Введите имя в левой панели (напр. Чуркин, Лавров)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                  <span><span className="text-white font-medium">Граф:</span> Нажмите на узел для изучения связей фигуранта</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span><span className="text-white font-medium">Хронология:</span> Раскройте секцию «Хронология» в левой панели</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  <span><span className="text-white font-medium">Фильтры:</span> Включайте/выключайте типы связей для фокусировки</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span><span className="text-white font-medium">Документы:</span> Нажмите на документ для просмотра выдержки</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#b91c1c]/10 border border-[#b91c1c]/30 rounded-lg p-4 mt-2">
              <h3 className="font-semibold text-[#ef4444] mb-2 uppercase text-[10px] tracking-widest">Статус связей:</h3>
              <div className="space-y-1.5 text-xs">
                {keyTypes.map(({ type, desc }) => {
                  const config = RELATION_TYPE_CONFIG[type];
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span style={{ color: config.color }} className="font-bold">●</span>
                      <RelationIcon type={type} size={14} />
                      <span>{config.label} — {desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#b91c1c] text-white rounded-lg hover:bg-[#991b1b] 
                       transition-colors font-bold uppercase tracking-widest text-sm shadow-lg shadow-red-900/30"
            >
              Начать исследование
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
