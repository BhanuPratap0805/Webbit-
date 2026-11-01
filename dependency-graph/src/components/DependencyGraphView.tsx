/**
 * DependencyGraphView — reusable, self-contained graph component.
 *
 * Props:
 *   nodes:        { id: string }[]   — one per file
 *   edges:        { source, target }[] — one per import relationship
 *   onNodeSelect: callback when a node is clicked / deselected
 *
 * Your teammate can import this component directly:
 *
 *   import { DependencyGraphView } from './components/DependencyGraphView';
 *   <DependencyGraphView nodes={data.nodes} edges={data.edges} onNodeSelect={fn} />
 */
import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import G6 from '@antv/g6';
import type { GraphNode, GraphEdge } from '../types';

/* ─── Public API ─── */

export interface DependencyGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect?: (nodeId: string | null) => void;
  className?: string;
}

export interface DependencyGraphViewRef {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  resetSelection: () => void;
}

/* ─── Helpers ─── */

const EXT_COLORS: Record<string, string> = {
  '.tsx': '#61dafb', '.jsx': '#61dafb',
  '.ts': '#3178c6',
  '.js': '#f7df1e', '.mjs': '#f7df1e', '.cjs': '#f7df1e',
  '.py': '#3776ab',
  '.css': '#264de4', '.scss': '#cc6699',
  '.json': '#5b9a2f', '.html': '#e44d26',
};

function extColor(filePath: string): string {
  const dot = filePath.lastIndexOf('.');
  if (dot === -1) return '#64748b';
  return EXT_COLORS[filePath.slice(dot).toLowerCase()] || '#64748b';
}

function fileName(filePath: string): string {
  return filePath.split('/').pop() || filePath;
}

function nodeWidth(filePath: string): number {
  return Math.max(fileName(filePath).length * 7.5 + 50, 130);
}

const NODE_HEIGHT = 38;

/* ─── Custom G6 renderers (registered once) ─── */

let _registered = false;

function registerRenderers() {
  if (_registered) return;
  _registered = true;

  /* — Glass Node — */
  G6.registerNode(
    'glass-node',
    {
      draw(cfg: any, group: any) {
        const id: string = cfg.id;
        const label = fileName(id);
        const color = extColor(id);
        const w = nodeWidth(id);
        const h = NODE_HEIGHT;

        const keyShape = group.addShape('rect', {
          attrs: {
            x: -w / 2, y: -h / 2, width: w, height: h,
            radius: 10,
            fill: 'rgba(12,18,34,0.75)',
            stroke: 'rgba(99,179,237,0.22)',
            lineWidth: 1,
            shadowColor: 'rgba(34,211,238,0.1)',
            shadowBlur: 10,
            cursor: 'pointer',
          },
          name: 'bg',
          draggable: true,
        });

        // top-edge highlight
        group.addShape('rect', {
          attrs: {
            x: -w / 2 + 1, y: -h / 2,
            width: w - 2, height: 1,
            fill: 'rgba(255,255,255,0.04)',
          },
          name: 'shine',
          draggable: true,
        });

        // extension colour badge
        group.addShape('circle', {
          attrs: {
            x: -w / 2 + 18, y: 0, r: 4,
            fill: color,
            shadowColor: color, shadowBlur: 6,
            opacity: 0.9,
          },
          name: 'badge',
          draggable: true,
        });

        // label
        group.addShape('text', {
          attrs: {
            text: label,
            x: -w / 2 + 30, y: 1,
            fontSize: 12,
            fill: '#cbd5e1',
            textBaseline: 'middle',
            fontFamily: "'Inter',system-ui,sans-serif",
            cursor: 'pointer',
          },
          name: 'label',
          draggable: true,
        });

        return keyShape;
      },

      setState(name?: string, value?: string | boolean, item?: any) {
        if (!item || !name) return;
        const g = item.getContainer();
        const bg    = g.find((s: any) => s.get('name') === 'bg');
        const label = g.find((s: any) => s.get('name') === 'label');
        const badge = g.find((s: any) => s.get('name') === 'badge');
        if (!bg) return;

        /* Reset first on any `false` */
        const reset = () => {
          bg.attr({ stroke: 'rgba(99,179,237,0.22)', lineWidth: 1,
            shadowColor: 'rgba(34,211,238,0.1)', shadowBlur: 10,
            fill: 'rgba(12,18,34,0.75)', opacity: 1 });
          label?.attr({ fill: '#cbd5e1', fontWeight: 400 });
          badge?.attr({ opacity: 0.9 });
        };

        if (!value) { reset(); return; }

        if (name === 'selected') {
          bg.attr({ stroke: '#22d3ee', lineWidth: 1.5,
            shadowColor: 'rgba(34,211,238,0.45)', shadowBlur: 24,
            fill: 'rgba(12,18,34,0.92)' });
          label?.attr({ fill: '#f0f9ff', fontWeight: 500 });
        } else if (name === 'highlight') {
          bg.attr({ stroke: 'rgba(167,139,250,0.5)', lineWidth: 1.5,
            shadowColor: 'rgba(167,139,250,0.25)', shadowBlur: 16,
            fill: 'rgba(12,18,34,0.85)' });
          label?.attr({ fill: '#e2e8f0' });
        } else if (name === 'dim') {
          bg.attr({ stroke: 'rgba(99,179,237,0.06)', lineWidth: 0.5,
            shadowBlur: 0, fill: 'rgba(12,18,34,0.25)', opacity: 0.3 });
          label?.attr({ fill: 'rgba(148,163,184,0.25)' });
          badge?.attr({ opacity: 0.15 });
        }
      },

      getAnchorPoints() {
        return [[0, 0.5], [1, 0.5], [0.5, 0], [0.5, 1]];
      },
    },
    'single-node',
  );

  /* — Neon Edge with animated particle — */
  G6.registerEdge(
    'neon-edge',
    {
      afterDraw(_cfg: any, group: any) {
        const keyShape = group.get('children')[0];
        if (!keyShape) return;

        const dot = group.addShape('circle', {
          attrs: { r: 2, fill: '#22d3ee', opacity: 0 },
          name: 'particle',
        });

        dot.animate(
          (ratio: number) => {
            const pt = keyShape.getPoint(ratio);
            if (!pt) return {};
            return {
              x: pt.x, y: pt.y,
              opacity: Math.sin(ratio * Math.PI) * 0.55,
            };
          },
          { repeat: true, duration: 2400 + Math.random() * 1200, easing: 'easeCubic' },
        );
      },

      setState(name?: string, value?: string | boolean, item?: any) {
        if (!item || !name) return;
        const ks = item.getKeyShape();
        const g = item.getContainer();
        const dot = g?.find((s: any) => s.get('name') === 'particle');
        if (!ks) return;

        if (name === 'highlight' && value) {
          ks.attr({ stroke: '#22d3ee', lineWidth: 2,
            shadowBlur: 10, shadowColor: 'rgba(34,211,238,0.4)', opacity: 1 });
          dot?.show();
        } else if (name === 'dim' && value) {
          ks.attr({ stroke: 'rgba(34,211,238,0.04)', lineWidth: 0.5,
            shadowBlur: 0, opacity: 0.12 });
          dot?.hide();
        } else if (!value) {
          ks.attr({ stroke: 'rgba(34,211,238,0.18)', lineWidth: 1,
            shadowBlur: 3, shadowColor: 'rgba(34,211,238,0.12)', opacity: 1 });
          dot?.show();
        }
      },
    },
    'quadratic',
  );
}

/* ─── Component ─── */

export const DependencyGraphView = forwardRef<
  DependencyGraphViewRef,
  DependencyGraphViewProps
>(({ nodes, edges, onNodeSelect, className }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);       // G6.Graph instance
  const hasDataRef = useRef(false);
  const onNodeSelectRef = useRef(onNodeSelect);
  onNodeSelectRef.current = onNodeSelect;   // keep fresh without re-init

  /* --- highlight helpers --- */

  const clearHL = useCallback(() => {
    const g = graphRef.current;
    if (!g) return;
    g.getNodes().forEach((n: any) => g.clearItemStates(n));
    g.getEdges().forEach((e: any) => g.clearItemStates(e));
  }, []);

  const highlightNode = useCallback(
    (nodeId: string) => {
      const g = graphRef.current;
      if (!g) return;
      clearHL();

      const connected = new Set<string>([nodeId]);
      g.getEdges().forEach((e: any) => {
        const s = e.getSource().getID();
        const t = e.getTarget().getID();
        if (s === nodeId) connected.add(t);
        if (t === nodeId) connected.add(s);
      });

      g.getNodes().forEach((n: any) => {
        const id = n.getID();
        if (id === nodeId)           g.setItemState(n, 'selected', true);
        else if (connected.has(id))  g.setItemState(n, 'highlight', true);
        else                         g.setItemState(n, 'dim', true);
      });

      g.getEdges().forEach((e: any) => {
        const s = e.getSource().getID();
        const t = e.getTarget().getID();
        if (connected.has(s) && connected.has(t) && (s === nodeId || t === nodeId))
          g.setItemState(e, 'highlight', true);
        else
          g.setItemState(e, 'dim', true);
      });
    },
    [clearHL],
  );

  /* --- imperative ref for Toolbar --- */

  useImperativeHandle(ref, () => ({
    zoomIn()  { graphRef.current?.zoomTo(graphRef.current.getZoom() * 1.25, undefined, true, { duration: 200 }); },
    zoomOut() { graphRef.current?.zoomTo(graphRef.current.getZoom() / 1.25, undefined, true, { duration: 200 }); },
    fitView() { graphRef.current?.fitView(60, undefined, true, { duration: 350 }); },
    resetSelection() { clearHL(); onNodeSelectRef.current?.(null); },
  }), [clearHL]);

  /* --- init graph (runs once per mount) --- */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    registerRenderers();

    const graph = new G6.Graph({
      container: el,
      width: el.clientWidth,
      height: el.clientHeight,
      fitView: true,
      fitViewPadding: 60,
      animate: true,
      animateCfg: { duration: 300, easing: 'easeCubic' },

      modes: { default: ['drag-canvas', 'zoom-canvas', 'drag-node'] },

      layout: {
        type: 'dagre',
        rankdir: 'LR',
        nodesep: 30,
        ranksep: 60,
        controlPoints: false,
        workerEnabled: false,
      },

      defaultNode:  { type: 'glass-node' },
      defaultEdge: {
        type: 'neon-edge',
        style: {
          stroke: 'rgba(34,211,238,0.18)',
          lineWidth: 1,
          shadowColor: 'rgba(34,211,238,0.12)',
          shadowBlur: 3,
          endArrow: { path: G6.Arrow.triangle(5, 6, 0), fill: 'rgba(34,211,238,0.35)', d: 0 },
        },
        curveOffset: 28,
      },

      minZoom: 0.02,
      maxZoom: 5,
    });

    /* interactions */
    graph.on('node:click', (evt: any) => {
      const id = evt.item.getID();
      highlightNode(id);
      onNodeSelectRef.current?.(id);
    });
    graph.on('canvas:click', () => {
      clearHL();
      onNodeSelectRef.current?.(null);
    });
    graph.on('node:mouseenter', (evt: any) => {
      const n = evt.item;
      if (n.hasState('selected') || n.hasState('highlight') || n.hasState('dim')) return;
      const bg = n.getContainer().find((s: any) => s.get('name') === 'bg');
      bg?.attr({ shadowBlur: 18, shadowColor: 'rgba(34,211,238,0.22)', stroke: 'rgba(99,179,237,0.35)' });
    });
    graph.on('node:mouseleave', (evt: any) => {
      const n = evt.item;
      if (n.hasState('selected') || n.hasState('highlight') || n.hasState('dim')) return;
      const bg = n.getContainer().find((s: any) => s.get('name') === 'bg');
      bg?.attr({ shadowBlur: 10, shadowColor: 'rgba(34,211,238,0.1)', stroke: 'rgba(99,179,237,0.22)' });
    });

    graphRef.current = graph;

    /* resize observer */
    let resizeFrame = 0;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0) {
          graph.changeSize(width, height);
          if (hasDataRef.current) {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(() => {
              graph.fitView(60, undefined, true, { duration: 250 });
            });
          }
        }
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(resizeFrame);
      hasDataRef.current = false;
      graph.destroy();
      graphRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- push data into graph whenever props change --- */

  useEffect(() => {
    const g = graphRef.current;
    if (!g || nodes.length === 0) return;

    hasDataRef.current = false;
    g.data({
      nodes: nodes.map(n => ({
        id: n.id,
        label: fileName(n.id),
        size: { width: nodeWidth(n.id), height: NODE_HEIGHT },
      })),
      edges: edges.map((e, i) => ({ id: `e-${i}`, source: e.source, target: e.target })),
    });
    g.updateLayout({
      type: 'dagre',
      rankdir: 'LR',
      nodesep: 30,
      ranksep: 60,
      controlPoints: false,
      workerEnabled: nodes.length > 80,
      onLayoutEnd: () => {
        if (graphRef.current === g) {
          hasDataRef.current = true;
          g.fitView(60, undefined, true, { duration: 500 });
        }
      },
    });
    g.render();
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      className={`dependency-graph-container ${className || ''}`}
    />
  );
});

DependencyGraphView.displayName = 'DependencyGraphView';
