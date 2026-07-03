import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

// ─── Configuration ───────────────────────────────────────────────
const CONFIG = {
  speed: 0.08,
  stationPauseDuration: 450,
  lineDelay: 500,
  colors: ['#2b7a78', '#9a3652', '#bda15d', '#3d7254', '#8a624a', '#5068a8'],
};

const MAX_ACTIVE_LINES = 4;
const MAX_RECENT_ROUTES = 8;
const ROUTE_ATTEMPTS = 10;
const SVG_NS = 'http://www.w3.org/2000/svg';

interface GridConfig {
  spacing: number;
  offsetX: number;
  offsetY: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

interface GridPoint {
  x: number;
  y: number;
  col: number;
  row: number;
}

interface WeightedGrid {
  points: GridPoint[];
  weights: number[];
}

interface LineObject {
  d: string;
  color: string;
  stations: never[];
  totalLength: number;
  unitSegments: never[];
  pathEl: SVGPathElement | null;
  pathLength: number;
  route: GridPoint[];
  _p?: number;
}

function getGridConfig(width: number, height: number): GridConfig {
  const spacing = 75;
  const cols = Math.max(3, Math.floor((width - 80) / spacing));
  const rows = Math.max(3, Math.floor((height - 80) / spacing));
  const offsetX = (width - (cols - 1) * spacing) / 2;
  const offsetY = (height - (rows - 1) * spacing) / 2;

  return {
    spacing,
    offsetX,
    offsetY,
    cols,
    rows,
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
  };
}

function getPoint(col: number, row: number, grid: GridConfig) {
  return {
    x: grid.offsetX + col * grid.spacing,
    y: grid.offsetY + row * grid.spacing,
  };
}

function centerPenalty(x: number, y: number, grid: GridConfig) {
  const dx = (x - grid.centerX) / grid.width;
  const dy = (y - grid.centerY) / grid.height;
  return Math.sqrt(dx * dx + dy * dy);
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function buildWeightedGrid(grid: GridConfig): WeightedGrid {
  const points: GridPoint[] = [];
  const weights: number[] = [];

  for (let c = 0; c < grid.cols; c++) {
    for (let r = 0; r < grid.rows; r++) {
      const p = getPoint(c, r, grid);
      const penalty = centerPenalty(p.x, p.y, grid);
      const weight = Math.max(0.25, penalty * 2);
      points.push({ ...p, col: c, row: r });
      weights.push(weight);
    }
  }

  return { points, weights };
}

function pickPoint(weightedGrid: WeightedGrid) {
  const { points, weights } = weightedGrid;
  return weightedRandom(points, weights);
}

function routeKey(point: GridPoint) {
  return `${point.col}:${point.row}`;
}

function routesAreTooSimilar(route: GridPoint[], recentRoute: GridPoint[]) {
  const sameDirectionMatches = route.filter((point, index) => routeKey(point) === routeKey(recentRoute[index])).length;
  const reverseDirectionMatches = route.filter((point, index) => routeKey(point) === routeKey(recentRoute[recentRoute.length - 1 - index])).length;
  const matchThreshold = Math.ceil(route.length * 0.75);

  return sameDirectionMatches >= matchThreshold || reverseDirectionMatches >= matchThreshold;
}

function routeIsRecent(route: GridPoint[], recentRoutes: GridPoint[][]) {
  return recentRoutes.some((recentRoute) => routesAreTooSimilar(route, recentRoute));
}

function createRoute(weightedGrid: WeightedGrid, recentRoutes: GridPoint[][]) {
  let fallbackRoute: GridPoint[] | null = null;

  for (let attempt = 0; attempt < ROUTE_ATTEMPTS; attempt++) {
    const route = [pickPoint(weightedGrid), pickPoint(weightedGrid), pickPoint(weightedGrid), pickPoint(weightedGrid)];
    fallbackRoute ??= route;

    if (!routeIsRecent(route, recentRoutes)) return route;
  }

  return fallbackRoute ?? [pickPoint(weightedGrid), pickPoint(weightedGrid), pickPoint(weightedGrid), pickPoint(weightedGrid)];
}

function createLineObject(color: string, weightedGrid: WeightedGrid, recentRoutes: GridPoint[][]): LineObject {
  const route = createRoute(weightedGrid, recentRoutes);
  const [start, mid1, mid2, end] = route;

  const d = `M ${start.x} ${start.y} L ${mid1.x} ${mid1.y} L ${mid2.x} ${mid2.y} L ${end.x} ${end.y}`;

  return {
    d,
    color,
    stations: [],
    totalLength: 0,
    unitSegments: [],
    pathEl: null as SVGPathElement | null,
    pathLength: 0,
    route,
  };
}

export default function MetroBackground() {
  const svgRef = useRef<SVGSVGElement>(null);
  const linesRef = useRef<SVGGElement>(null);
  const animRef = useRef<number>(0);
  const pathPoolRef = useRef<SVGPathElement[]>([]);

  const [dim, setDim] = useState({ width: 1000, height: 600 });

  const state = useRef({
    lines: [] as LineObject[],
    recentRoutes: [] as GridPoint[][],
    colorIndex: 0,
    last: 0,
  });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setDim({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });

    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  const grid = useMemo(() => getGridConfig(dim.width, dim.height), [dim.width, dim.height]);
  const weightedGrid = useMemo(() => buildWeightedGrid(grid), [grid]);

  const acquirePathElement = useCallback((lines: SVGGElement) => {
    const pooled = pathPoolRef.current.pop();
    const el = pooled ?? document.createElementNS(SVG_NS, 'path');

    el.style.display = '';
    if (!el.parentNode) lines.appendChild(el);

    return el;
  }, []);

  const releasePathElement = useCallback((el: SVGPathElement) => {
    el.style.display = 'none';
    el.style.strokeDasharray = '';
    el.style.strokeDashoffset = '';
    el.removeAttribute('d');
    pathPoolRef.current.push(el);
  }, []);

  const spawnLine = useCallback(() => {
    const lines = linesRef.current;
    if (!lines) return;
    if (state.current.lines.length >= MAX_ACTIVE_LINES) return;

    const color = CONFIG.colors[state.current.colorIndex++ % CONFIG.colors.length];
    const line = createLineObject(color, weightedGrid, state.current.recentRoutes);

    const el = acquirePathElement(lines);
    el.setAttribute('d', line.d);
    el.setAttribute('stroke', line.color);
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke-width', '3');
    el.setAttribute('stroke-linecap', 'round');

    line.pathEl = el;
    line.pathLength = el.getTotalLength();

    el.style.strokeDasharray = `${line.pathLength}`;
    el.style.strokeDashoffset = `${line.pathLength}`;

    state.current.lines.push(line);
    state.current.recentRoutes = [line.route, ...state.current.recentRoutes].slice(0, MAX_RECENT_ROUTES);
  }, [acquirePathElement, weightedGrid]);

  useEffect(() => {
    const loop = (t: number) => {
      if (!state.current.last) state.current.last = t;
      const dt = t - state.current.last;
      state.current.last = t;

      state.current.lines = state.current.lines.filter((line) => {
        if (!line.pathEl) return false;

        const el = line.pathEl;
        const len = line.pathLength;
        const speed = CONFIG.speed * dt;

        const current = Math.min(len, (line._p = (line._p || 0) + speed));
        el.style.strokeDashoffset = `${len - current}`;

        if (current >= len) {
          releasePathElement(el);
          line.pathEl = null;
          return false;
        }

        return true;
      });

      if (state.current.lines.length < MAX_ACTIVE_LINES && Math.random() < 0.025) spawnLine();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [releasePathElement, spawnLine]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.35]">
      <svg ref={svgRef} viewBox={`0 0 ${dim.width} ${dim.height}`} style={{ width: '100%', height: '100%' }}>
        <g ref={linesRef} />
      </svg>
    </div>
  );
}
