import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type { GraphData, RelationType } from '../types';
import { RELATION_TYPE_CONFIG } from '../types';

interface NetworkGraphProps {
  graphData: GraphData;
  selectedPersonId: string | null;
  onPersonClick: (personId: string) => void;
  activeRelationTypes: Set<RelationType>;
  graphRef?: React.MutableRefObject<any>;
}

export default function NetworkGraph({
  graphData,
  selectedPersonId,
  onPersonClick,
  activeRelationTypes,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  // Фильтруем данные графа
  const filteredData = useMemo(() => {
    let links = graphData.links.filter(link => activeRelationTypes.has(link.type));
    const activeNodeIds = new Set<string>();
    activeNodeIds.add('epstein');

    links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
      activeNodeIds.add(s);
      activeNodeIds.add(t);
    });

    const finalNodes = graphData.nodes.filter(n => activeNodeIds.has(n.id));
    const finalLinks = links.filter(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return activeNodeIds.has(s) && activeNodeIds.has(t);
    });

    return { nodes: finalNodes, links: finalLinks };
  }, [graphData, activeRelationTypes]);

  useEffect(() => {
    if (!svgRef.current || filteredData.nodes.length === 0) return;

    const svgEl = svgRef.current;
    const width = svgEl.clientWidth || window.innerWidth;
    const height = svgEl.clientHeight || window.innerHeight;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('class', 'main-container');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.6));

    // Simulation Data
    const nodes = filteredData.nodes.map(n => ({ ...n }));
    const links = filteredData.links.map(l => ({
      ...l,
      source: typeof l.source === 'string' ? l.source : (l.source as any).id,
      target: typeof l.target === 'string' ? l.target : (l.target as any).id
    }));

    // Radii scaling
    const minRadius = 40;
    const maxRadius = 85;
    const epsteinRadius = 110;

    const maxConns = Math.max(...nodes.map(n => n.connectionCount || 0), 1);
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxConns])
      .range([minRadius, maxRadius]);

    const getRadius = (d: any) => {
      if (d.id === 'epstein' || d.isEpstein) return epsteinRadius;
      return radiusScale(d.connectionCount || 0);
    };

    // Defs для обрезки фото (clipPath)
    const defs = svg.append('defs');
    nodes.forEach(node => {
      defs.append('clipPath')
        .attr('id', `clip-${node.id}`)
        .append('circle')
        .attr('r', getRadius(node) - 2) // Slightly smaller than the border
        .attr('cx', 0)
        .attr('cy', 0);

      if (node.photo_url) {
        defs.append('pattern')
          .attr('id', `pattern-${node.id}`)
          .attr('height', '1')
          .attr('width', '1')
          .attr('patternContentUnits', 'objectBoundingBox')
          .append('image')
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .attr('href', node.photo_url)
          .attr('width', '1')
          .attr('height', '1')
          .attr('x', 0)
          .attr('y', 0);
      }
    });

    // Glow filter
    const glow = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
    glow.append('feFlood').attr('flood-color', '#fbbf24').attr('flood-opacity', '0.4').attr('result', 'color');
    glow.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Forces Tuning (Expanded Layout)
    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink<any, any>(links)
        .id(d => d.id)
        .distance(d => {
          const isEpsteinLink = (d.source.id === 'epstein' || d.target.id === 'epstein');
          return isEpsteinLink ? 650 : 550; // Increased spacing
        })
        .strength(0.7))
      .force('charge', d3.forceManyBody()
        .strength(d => (d.id === 'epstein' || d.isEpstein ? -45000 : -15000)) // Stronger repulsion
        .distanceMax(4000))
      .force('center', d3.forceCenter(0, 0))
      .force('collide', d3.forceCollide().radius(d => getRadius(d) + 70).iterations(3))
      .force('radial', d3.forceRadial((d: any) => (d.id === 'epstein' || d.isEpstein ? 0 : 600), 0, 0).strength(0.1));
    // Larger ring, weaker pull

    simulationRef.current = simulation;

    // Links
    const linkElements = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: any) => RELATION_TYPE_CONFIG[d.type as RelationType]?.color || '#4b5563')
      .attr('stroke-width', (d: any) => (d.strength || 1) * 3)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-linecap', 'round');

    // Nodes
    const nodeElements = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onPersonClick(d.id);
      })
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }) as any);

    // Node Rendering
    nodeElements.each(function (d) {
      const el = d3.select(this);
      const r = getRadius(d);

      // Shadow/Glow circle
      el.append('circle')
        .attr('class', 'outer-circle')
        .attr('r', r + 5)
        .attr('fill', (d.id === 'epstein' || d.isEpstein) ? '#dc262622' : 'transparent')
        .attr('stroke', (d.id === 'epstein' || d.isEpstein) ? '#ef4444' : '#334155')
        .attr('stroke-width', (d.id === 'epstein' || d.isEpstein) ? 3 : 1)
        .style('filter', (d.id === 'epstein' || d.isEpstein) ? 'url(#glow)' : 'none');

      // Main circle with pattern background or fallback
      el.append('circle')
        .attr('class', 'main-circle')
        .attr('r', r)
        .attr('fill', d.photo_url ? `url(#pattern-${d.id})` : '#0f172a')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1.5)
        .on('error', function () {
          // If pattern fails (e.g. image 404), fallback to dark fill
          d3.select(this).attr('fill', '#0f172a');
        });

      // Fallback text if no photo
      if (!d.photo_url) {
        el.append('text')
          .attr('class', 'initials')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('fill', '#94a3b8')
          .attr('font-size', r * 0.6 + 'px')
          .attr('font-weight', 'bold')
          .text(d.name_ru?.[0] || d.id[0].toUpperCase());
      }
    });

    // Labels
    nodeElements.append('text')
      .text(d => d.name_ru)
      .attr('y', d => getRadius(d) + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', d => (d.id === 'epstein' ? '22px' : '15px'))
      .attr('font-weight', 'bold')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,1)');

    nodeElements.append('text')
      .text(d => d.role || '')
      .attr('y', d => getRadius(d) + 48)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,1)');

    // Tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredData, onPersonClick]);

  // Handle selection state
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll('.node-group').attr('opacity', (d: any) => {
      if (!selectedPersonId) return 1;
      if (d.id === selectedPersonId) return 1;

      const isConnected = filteredData.links.some(l => {
        const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
        return (s === selectedPersonId && t === d.id) || (t === selectedPersonId && s === d.id);
      });
      return isConnected ? 1 : 0.15;
    });

    svg.selectAll('line').attr('stroke-opacity', (d: any) => {
      if (!selectedPersonId) return 0.4;
      const s = typeof d.source === 'string' ? d.source : (d.source as any).id;
      const t = typeof d.target === 'string' ? d.target : (d.target as any).id;
      return (s === selectedPersonId || t === selectedPersonId) ? 0.9 : 0.05;
    });
  }, [selectedPersonId, filteredData]);

  return (
    <div className="relative w-full h-full bg-[#07080a]">
      <svg ref={svgRef} className="w-full h-full overflow-visible" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-8 px-6 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/5 text-[11px] text-gray-400 uppercase tracking-widest pointer-events-none shadow-2xl">
        <span className="flex items-center gap-2">🖱️ Клик: детали</span>
        <span className="flex items-center gap-2">🔍 Зум: скролл</span>
        <span className="flex items-center gap-2">🖐️ Драг: обзор</span>
      </div>
    </div>
  );
}
