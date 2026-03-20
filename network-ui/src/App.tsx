import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import NetworkGraph from './components/NetworkGraph';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import GraphControls from './components/GraphControls';
import MobileBottomNav from './components/MobileBottomNav';
import { WelcomeModal } from './components/WelcomeModal';
import DocumentModal from './components/DocumentModal';
import { fetchStats, fetchGraph, fetchPersons, fetchTimeline, fetchDocuments } from './api';
import type { Stats, GraphData, Person, TimelineEvent, DocumentRecord, RelationType } from './types';
import { RELATION_TYPE_CONFIG } from './types';

const MIN_YEAR = 2009;
const MAX_YEAR = 2018;

function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [activeRelationTypes, setActiveRelationTypes] = useState<Set<RelationType>>(
    new Set(Object.keys(RELATION_TYPE_CONFIG) as RelationType[])
  );
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [densityThreshold, setDensityThreshold] = useState(0); // 0-100%

  const graphRef = useRef<any>(null);

  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('epstein_welcome_seen');
  });

  // Загрузка всех данных при старте
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsData, graphRes, personsData, timelineData, docsData] = await Promise.all([
          fetchStats().catch(() => null),
          fetchGraph().catch(() => null),
          fetchPersons().catch(() => []),
          fetchTimeline().catch(() => []),
          fetchDocuments().catch(() => []),
        ]);

        if (statsData) setStats(statsData);
        if (graphRes) setGraphData(graphRes);
        setPersons(personsData);
        setTimeline(timelineData);
        setDocuments(docsData);

        // Включаем все типы связей по умолчанию
        const types = statsData?.relationTypes || statsData?.categories || [];
        if (types.length > 0) {
          setActiveRelationTypes(new Set(types.map(rt => rt.category as RelationType)));
        } else {
          setActiveRelationTypes(new Set(Object.keys(RELATION_TYPE_CONFIG) as RelationType[]));
        }

        if (!graphRes) {
          setError('Не удалось загрузить данные графа. Проверьте соединение с API-сервером.');
        }
      } catch {
        setError('Не удалось загрузить данные. Проверьте соединение с API-сервером.');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Фильтрация graphData по выбранному году и порогу плотности
  const filteredGraphData = useMemo<GraphData | null>(() => {
    if (!graphData) return null;

    // 1. Фильтр по годам
    let filteredLinks = graphData.links;
    if (selectedYear !== null) {
      filteredLinks = filteredLinks.filter(link => {
        if (!link.date || link.date === 'unknown') return true;
        const yearMatch = link.date.match(/^(\d{4})/);
        if (!yearMatch) return true;
        const startYear = parseInt(yearMatch[1]);
        return startYear <= selectedYear;
      });
    }

    // 2. Фильтр по связям (активные типы)
    filteredLinks = filteredLinks.filter(l => activeRelationTypes.has(l.type as RelationType));

    // 3. Собираем ноды
    const activeNodeIds = new Set<string>();
    filteredLinks.forEach(link => {
      const srcId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const tgtId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      activeNodeIds.add(srcId);
      activeNodeIds.add(tgtId);
    });

    // Добавляем Эпштейна
    activeNodeIds.add('epstein');

    // 4. Порог плотности (Connection Density)
    const maxConns = Math.max(...graphData.nodes.map(n => n.connectionCount || 0), 1);
    const thresholdVal = (densityThreshold / 100) * maxConns;

    const nodes = graphData.nodes.filter(n => {
      if (n.id === 'epstein') return true;
      if (!activeNodeIds.has(n.id)) return false;
      // Фильтр по плотности
      return (n.connectionCount || 0) >= thresholdVal;
    }).map(n => ({ ...n }));

    const finalNodeIds = new Set(nodes.map(n => n.id));
    const finalLinks = filteredLinks.filter(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return finalNodeIds.has(s) && finalNodeIds.has(t);
    }).map(l => ({ ...l }));

    return { nodes, links: finalLinks };
  }, [graphData, selectedYear, densityThreshold, activeRelationTypes]);

  const handlePersonSelect = useCallback((personId: string | null) => {
    setSelectedPersonId(prev => prev === personId ? null : personId);
  }, []);

  const handleToggleRelationType = useCallback((type: RelationType) => {
    setActiveRelationTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveRelationTypes(new Set(Object.keys(RELATION_TYPE_CONFIG) as RelationType[]));
  }, []);

  const handleCloseWelcome = useCallback(() => {
    localStorage.setItem('epstein_welcome_seen', 'true');
    setShowWelcome(false);
  }, []);

  const handleOpenDocument = useCallback((doc: DocumentRecord) => {
    setSelectedDocument(doc);
  }, []);

  const handleCloseDocument = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  // Подсчёт видимых нод и связей
  const visibleNodes = filteredGraphData?.nodes.length || 0;
  const visibleLinks = filteredGraphData?.links.length || 0;

  return (
    <div className="flex h-screen bg-[#0c0d10] text-[#e2e8f0] overflow-hidden">
      {/* Левая панель — Sidebar */}
      <div className="hidden lg:block z-10 relative">
        <Sidebar
          stats={stats}
          persons={persons}
          timeline={timeline}
          selectedPersonId={selectedPersonId}
          onPersonSelect={handlePersonSelect}
          enabledRelationTypes={activeRelationTypes}
          onToggleRelationType={handleToggleRelationType}
          onResetFilters={handleResetFilters}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>

      {/* Центральная область — Граф */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-red-900/10 border border-red-900/30 rounded-lg max-w-md">
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <h2 className="text-lg font-bold text-white mb-2">Ошибка подключения</h2>
              <p className="text-sm text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded transition-colors"
              >
                Обновить страницу
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fbbf24] mx-auto mb-4" />
              <p className="text-xs text-gray-500 uppercase tracking-widest">Инициализация сети...</p>
            </div>
          </div>
        ) : filteredGraphData ? (
          <>
            <NetworkGraph
              graphData={filteredGraphData}
              selectedPersonId={selectedPersonId}
              onPersonClick={handlePersonSelect}
              activeRelationTypes={activeRelationTypes}
              graphRef={graphRef}
            />

            {/* Контролы поверх графа */}
            <div className="absolute top-4 left-4 z-20">
              <GraphControls
                graphRef={graphRef}
                onResetSelection={() => setSelectedPersonId(null)}
                selectedPersonId={selectedPersonId}
                visibleNodes={visibleNodes}
                visibleLinks={visibleLinks}
                densityThreshold={densityThreshold}
                onDensityChange={setDensityThreshold}
              />
            </div>

            {/* Правая панель — Выплывает поверх графа */}
            {selectedPersonId && (
              <div className="absolute top-0 right-0 h-full w-96 z-40 shadow-[-20px_0_40px_rgba(0,0,0,0.6)]">
                <RightSidebar
                  personId={selectedPersonId}
                  onClose={() => setSelectedPersonId(null)}
                  onOpenDocument={handleOpenDocument}
                  onPersonSelect={handlePersonSelect}
                />
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Мобильная навигация */}
      <div className="lg:hidden text-[#e2e8f0]">
        <MobileBottomNav
          stats={stats}
          persons={persons}
          timeline={timeline}
          documents={documents}
          selectedPersonId={selectedPersonId}
          onPersonSelect={handlePersonSelect}
          enabledRelationTypes={activeRelationTypes}
          onToggleRelationType={handleToggleRelationType}
        />
      </div>

      {/* Модалки */}
      {selectedDocument && (
        <DocumentModal doc={selectedDocument} onClose={handleCloseDocument} />
      )}
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} stats={stats} />
    </div>
  );
}

export default App;
