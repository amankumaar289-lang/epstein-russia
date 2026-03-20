import { RELATION_TYPE_CONFIG } from '../types';
import type { RelationType } from '../types';

interface GraphControlsProps {
    graphRef: React.MutableRefObject<any>;
    onResetSelection: () => void;
    selectedPersonId: string | null;
    visibleNodes: number;
    visibleLinks: number;
    densityThreshold: number;
    onDensityChange: (val: number) => void;
}

export default function GraphControls({
    graphRef,
    onResetSelection,
    selectedPersonId,
    visibleNodes,
    visibleLinks,
    densityThreshold,
    onDensityChange
}: GraphControlsProps) {
    const handleCenter = () => {
        if (!graphRef.current) return;
        // В новой D3 SVG версии метод может называться иначе или быть не реализован пока
        // Но оставим вызов для будущего
        if (graphRef.current.zoomToFit) {
            graphRef.current.zoomToFit(1000);
        }
    };

    return (
        <div
            className="absolute top-4 right-4 flex flex-col gap-2 z-10"
            style={{ pointerEvents: 'all' }}
        >
            {/* Счётчик */}
            <div className="glass-panel px-3 py-2 text-center min-w-[110px]">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Активная Сеть</div>
                <div className="text-sm font-bold text-[#fbbf24]">{visibleNodes} участников</div>
                <div className="text-[10px] text-gray-600">{visibleLinks} связей</div>
            </div>

            {/* Порог плотности */}
            <div className="glass-panel p-3 min-w-[180px]">
                <div className="flex justify-between items-center mb-1">
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Фильтр сложности</div>
                    <div className="text-[10px] text-[#fbbf24] font-bold">{densityThreshold}%</div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={densityThreshold}
                    onChange={(e) => onDensityChange(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#fbbf24]"
                />
            </div>

            <div className="flex gap-2">
                {/* Кнопка центрировать */}
                <button
                    onClick={handleCenter}
                    title="Центрировать граф"
                    className="glass-panel p-2.5 hover:bg-white/10 transition-colors group flex-1"
                >
                    <svg
                        className="w-4 h-4 mx-auto text-gray-400 group-hover:text-[#fbbf24] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                        />
                    </svg>
                </button>

                {/* Сброс выделения */}
                {selectedPersonId && (
                    <button
                        onClick={onResetSelection}
                        title="Снять выделение"
                        className="glass-panel p-2.5 hover:bg-[#b91c1c]/20 transition-colors group flex-1"
                    >
                        <svg
                            className="w-4 h-4 mx-auto text-[#b91c1c] group-hover:text-red-400 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Легенда */}
            <div className="glass-panel p-3 min-w-[180px]">
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-2.5 font-bold">
                    Типы связей
                </div>
                <div className="space-y-1.5 opacity-80">
                    {(Object.entries(RELATION_TYPE_CONFIG) as [RelationType, { label: string; color: string; svgPath: string }][]).map(
                        ([type, cfg]) => (
                            <div key={type} className="flex items-center gap-2">
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke={cfg.color}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="flex-shrink-0"
                                >
                                    <path d={cfg.svgPath} />
                                </svg>
                                <span className="text-[10px] text-gray-400 leading-tight">{cfg.label}</span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
