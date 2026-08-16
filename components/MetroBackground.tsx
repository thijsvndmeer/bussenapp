import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

// ─── Configuration ───────────────────────────────────────────────
const CONFIG = {
  speed: 0.08,
  stationPauseDuration: 450,
  lineDelay: 500,
  colors: ['#2b7a78', '#9a3652', '#bda15d', '#3d7254', '#8a624a', '#5068a8'],
};

const MAX_ACTIVE_LINES = 3;
const MAX_RECENT_ROUTES = 8;
const ROUTE_ATTEMPTS = 10;
const SVG_NS = 'http://www.w3.org/2000/svg';

const CENTER_AVOID_RADIUS = 0.18;
const CENTER_WEIGHT_EXPONENT = 3;
const MIN_EDGE_WEIGHT = 0.04;
const MAX_CENTER_ROUTE_POINTS = 1;
const MAX_CENTER_ROUTE_SEGMENTS = 0;
const MAX_ROUTE_ATTEMPTS = 18;

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
  pathEl: SVGPathElement | null;
  pathLength: number;
  route: GridPoint[];
  stations: { x: number, y: number, lengthVal: number }[];
  stationEls: SVGGElement[];
  stationLengths: number[];
  stationTriggered: boolean[];
  totalMathLength: number;
  _p?: number;
  pauseTimer?: number;
  isErasing?: boolean;
  isDrawn?: boolean;
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

function pointIsInCenterZone(point: { x: number; y: number }, grid: GridConfig) {
  return centerPenalty(point.x, point.y, grid) < CENTER_AVOID_RADIUS;
}

function segmentCrossesCenterZone(
  start: { x: number; y: number },
  end: { x: number; y: number },
  grid: GridConfig,
) {
  const vx = end.x - start.x;
  const vy = end.y - start.y;
  const lengthSquared = vx * vx + vy * vy;

  if (lengthSquared === 0) {
    return pointIsInCenterZone(start, grid);
  }

  const centerProjection =
    ((grid.centerX - start.x) * vx + (grid.centerY - start.y) * vy) / lengthSquared;
  const t = Math.min(1, Math.max(0, centerProjection));
  const closestPoint = {
    x: start.x + vx * t,
    y: start.y + vy * t,
  };

  return pointIsInCenterZone(closestPoint, grid);
}

function routeAvoidsCenter(points: { x: number; y: number }[], grid: GridConfig) {
  const centerPointCount = points.filter((point) => pointIsInCenterZone(point, grid)).length;
  const centerSegmentCount = points.slice(1).filter((point, index) =>
    segmentCrossesCenterZone(points[index], point, grid),
  ).length;

  return (
    centerPointCount <= MAX_CENTER_ROUTE_POINTS &&
    centerSegmentCount <= MAX_CENTER_ROUTE_SEGMENTS
  );
}


function isInBufferZone(x: number, y: number, grid: GridConfig) {
  return centerPenalty(x, y, grid) < CENTER_AVOID_RADIUS;
}

function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isPointOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const minX = Math.min(ax, bx);
  const maxX = Math.max(ax, bx);
  const minY = Math.min(ay, by);
  const maxY = Math.max(ay, by);
  const eps = 0.1;
  if (px < minX - eps || px > maxX + eps || py < minY - eps || py > maxY + eps) return false;
  if (Math.abs(ay - by) < eps) return Math.abs(py - ay) < eps;
  if (Math.abs(ax - bx) < eps) return Math.abs(px - ax) < eps;
  return Math.abs(Math.abs(px - ax) - Math.abs(py - ay)) < eps;
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
  const routeStr = route.map(routeKey).join('-');
  return recentRoutes.some(recent => recent.map(routeKey).join('-') === routeStr);
}

function routeIsTooClose(route: GridPoint[], activeLines: LineObject[]) {
  const spawnCol = route[0].col;
  const spawnRow = route[0].row;
  
  return activeLines.some(line => {
    if (!line.route || line.route.length === 0) return false;
    const activeCol = line.route[0].col;
    const activeRow = line.route[0].row;
    
    if (spawnCol === activeCol && spawnCol === -1) {
      return Math.abs(spawnRow - activeRow) < 2;
    }
    if (spawnRow === activeRow && spawnRow === -1) {
      return Math.abs(spawnCol - activeCol) < 2;
    }
    return false;
  });
}

function createRoute(recentRoutes: GridPoint[][], grid: GridConfig, activeLines: LineObject[]) {
  let fallbackRoute: GridPoint[] | null = null;
  const flow = Math.floor(Math.random() * 2);

  for (let attempt = 0; attempt < MAX_ROUTE_ATTEMPTS; attempt++) {
    const points: GridPoint[] = [];

    if (flow === 0) {
      const r0 = randomRange(0, grid.rows - 1);
      const c1 = randomRange(0, 1);
      
      const maxDr = Math.max(1, grid.cols - 2);
      const possibleRows = [];
      for (let r = 0; r < grid.rows; r++) {
        if (r !== r0 && Math.abs(r - r0) <= maxDr) possibleRows.push(r);
      }
      if (!possibleRows.length) continue;
      
      const r2 = possibleRows[randomRange(0, possibleRows.length - 1)];
      const dr = Math.abs(r2 - r0);
      const c2 = c1 + dr;
      
      if (c2 >= grid.cols) continue;

      points.push(
        { x: -50, y: grid.offsetY + r0 * grid.spacing, col: -1, row: r0 },
        { ...getPoint(c1, r0, grid), col: c1, row: r0 },
        { ...getPoint(c2, r2, grid), col: c2, row: r2 },
        { ...getPoint(grid.cols - 1, r2, grid), col: grid.cols - 1, row: r2 },
        { x: grid.width + 50, y: grid.offsetY + r2 * grid.spacing, col: grid.cols, row: r2 }
      );
    } else {
      const c0 = randomRange(0, grid.cols - 1);
      const r1 = randomRange(0, 1);
      
      const maxDr = Math.max(1, grid.cols - 2);
      const possibleRows = [];
      for (let r = r1 + 1; r < grid.rows; r++) {
        if (r - r1 <= maxDr) possibleRows.push(r);
      }
      if (!possibleRows.length) continue;
      
      const r2 = possibleRows[randomRange(0, possibleRows.length - 1)];
      const dr = r2 - r1;

      const dirOptions = [];
      if (c0 + dr < grid.cols) dirOptions.push(1);
      if (c0 - dr >= 0) dirOptions.push(-1);
      if (!dirOptions.length) continue;
      
      const dir = dirOptions[randomRange(0, dirOptions.length - 1)];
      const c2 = c0 + dr * dir;
      
      if (c2 < 0 || c2 >= grid.cols) continue;

      points.push(
        { x: grid.offsetX + c0 * grid.spacing, y: -50, col: c0, row: -1 },
        { ...getPoint(c0, r1, grid), col: c0, row: r1 },
        { ...getPoint(c2, r2, grid), col: c2, row: r2 },
        { ...getPoint(c2, grid.rows - 1, grid), col: c2, row: grid.rows - 1 },
        { x: grid.offsetX + c2 * grid.spacing, y: grid.height + 50, col: c2, row: grid.rows }
      );
    }

    fallbackRoute = fallbackRoute ?? points;
    
    if (routeAvoidsCenter(points, grid) && !routeIsRecent(points, recentRoutes) && !routeIsTooClose(points, activeLines)) {
      return points;
    }
  }

  return fallbackRoute ?? [];
}

function createLineObject(color: string, recentRoutes: GridPoint[][], grid: GridConfig, activeLines: LineObject[]): LineObject {
  const route = createRoute(recentRoutes, grid, activeLines);
  
  let d = '';
  let totalMathLength = 0;
  const stations: { x: number, y: number, lengthVal: number }[] = [];

  if (route.length > 0) {
    d = `M ${route[0].x} ${route[0].y}`;
    for (let i = 1; i < route.length; i++) {
      const pA = route[i - 1];
      const pB = route[i];
      d += ` L ${pB.x} ${pB.y}`;

      for (let col = 0; col < grid.cols; col++) {
        for (let row = 0; row < grid.rows; row++) {
          const gridPt = getPoint(col, row, grid);
          if (isInBufferZone(gridPt.x, gridPt.y, grid)) continue;
          
          if (isPointOnSegment(gridPt.x, gridPt.y, pA.x, pA.y, pB.x, pB.y)) {
            const dx = gridPt.x - pA.x;
            const dy = gridPt.y - pA.y;
            const len = totalMathLength + Math.sqrt(dx * dx + dy * dy);
            // Avoid duplicate stations exactly at the corners
            if (!stations.some(s => Math.abs(s.lengthVal - len) < 0.1)) {
              stations.push({ x: gridPt.x, y: gridPt.y, lengthVal: len });
            }
          }
        }
      }
      
      const segDx = pB.x - pA.x;
      const segDy = pB.y - pA.y;
      totalMathLength += Math.sqrt(segDx * segDx + segDy * segDy);
    }
    
    stations.sort((a, b) => a.lengthVal - b.lengthVal);
  }

  return {
    d,
    color,
    pathEl: null as SVGPathElement | null,
    pathLength: 0,
    route,
    stations,
    stationEls: [],
    stationLengths: [],
    stationTriggered: [],
    totalMathLength,
  };
}

export default function MetroBackground() {
  const svgRef = useRef<SVGSVGElement>(null);
  const linesRef = useRef<SVGGElement>(null);
  const stationsRef = useRef<SVGGElement>(null);
  const animRef = useRef<number>(0);
  const pathPoolRef = useRef<SVGPathElement[]>([]);
  const stationPoolRef = useRef<SVGGElement[]>([]);

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

  const gridDots = useMemo(() => {
    const dots: { x: number; y: number }[] = [];
    for (let c = 0; c < grid.cols; c++) {
      for (let r = 0; r < grid.rows; r++) {
        const pt = getPoint(c, r, grid);
        if (!isInBufferZone(pt.x, pt.y, grid)) {
          dots.push(pt);
        }
      }
    }
    return dots;
  }, [grid]);

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

  const acquireStationElement = useCallback((stationsGroup: SVGGElement, color: string, x: number, y: number) => {
    let el = stationPoolRef.current.pop();
    if (!el) {
      el = document.createElementNS(SVG_NS, 'g');
      
      const outer = document.createElementNS(SVG_NS, 'circle');
      outer.setAttribute('r', '5.5');
      outer.setAttribute('fill', 'transparent');
      outer.setAttribute('stroke-width', '1.8');
      outer.classList.add('station-outer');
      
      const inner = document.createElementNS(SVG_NS, 'circle');
      inner.setAttribute('r', '2');
      inner.classList.add('station-inner');
      
      el.appendChild(outer);
      el.appendChild(inner);
    }

    el.style.display = '';
    el.style.opacity = '0';
    el.style.transform = 'scale(0)';
    el.style.transformOrigin = `${x}px ${y}px`;
    el.style.transition = 'opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';

    const outer = el.querySelector('.station-outer') as SVGCircleElement;
    const inner = el.querySelector('.station-inner') as SVGCircleElement;
    outer.setAttribute('cx', `${x}`);
    outer.setAttribute('cy', `${y}`);
    outer.setAttribute('stroke', color);
    
    inner.setAttribute('cx', `${x}`);
    inner.setAttribute('cy', `${y}`);
    inner.setAttribute('fill', color);

    if (!el.parentNode) stationsGroup.appendChild(el);
    return el;
  }, []);

  const releaseStationElement = useCallback((el: SVGGElement) => {
    el.style.display = 'none';
    el.style.opacity = '0';
    el.style.transform = 'scale(0)';
    stationPoolRef.current.push(el);
  }, []);

  const spawnLine = useCallback(() => {
    const lines = linesRef.current;
    if (!lines) return;
    if (state.current.lines.length >= MAX_ACTIVE_LINES) return;

    const color = CONFIG.colors[state.current.colorIndex++ % CONFIG.colors.length];
    const line = createLineObject(color, state.current.recentRoutes, grid, state.current.lines);

    const el = acquirePathElement(lines);
    el.setAttribute('d', line.d);
    el.setAttribute('stroke', line.color);
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke-width', '3');
    el.setAttribute('stroke-linecap', 'round');

    line.pathEl = el;
    line.pathLength = el.getTotalLength();

    el.style.strokeDasharray = `${line.pathLength} ${line.pathLength}`;
    el.style.strokeDashoffset = `${line.pathLength}`;

    // Normalize station lengths to the browser's exact path length
    const scale = line.pathLength / Math.max(1, line.totalMathLength);
    
    const stationsGroup = stationsRef.current;
    if (stationsGroup) {
      line.stationEls = line.stations.map(st => acquireStationElement(stationsGroup, color, st.x, st.y));
      line.stationLengths = line.stations.map(st => st.lengthVal * scale);
      line.stationTriggered = line.stations.map(() => false);
    }

    state.current.lines.push(line);
    state.current.recentRoutes = [line.route, ...state.current.recentRoutes].slice(0, MAX_RECENT_ROUTES);
  }, [acquirePathElement, acquireStationElement, grid]);

  useEffect(() => {
    const loop = (t: number) => {
      if (!state.current.last) state.current.last = t;
      const dt = t - state.current.last;
      state.current.last = t;

      let isAnimating = false;

      state.current.lines = state.current.lines.filter((line) => {
        if (!line.pathEl) return false;
        
        if (line.isDrawn && !line.isErasing) return true;
        
        isAnimating = true;

        if (line.pauseTimer && line.pauseTimer > 0) {
          line.pauseTimer -= dt;
          return true;
        }

        const el = line.pathEl;
        const len = line.pathLength;
        const speed = CONFIG.speed * dt;

        if (line.isErasing) {
          let nextP = (line._p || 0) + speed;

          for (let i = 0; i < line.stationLengths.length; i++) {
            if (line.stationTriggered[i] && nextP >= line.stationLengths[i]) {
              line.stationTriggered[i] = false;
              nextP = line.stationLengths[i];
              line.pauseTimer = CONFIG.stationPauseDuration;
              
              const stationEl = line.stationEls[i];
              if (stationEl) {
                stationEl.style.opacity = '0';
                stationEl.style.transform = 'scale(0)';
              }
              break;
            }
          }

          line._p = nextP;
          const eraseLen = Math.min(len, line._p);
          el.style.strokeDashoffset = `${-eraseLen}`;

          if (line._p >= len && (!line.pauseTimer || line.pauseTimer <= 0)) {
            releasePathElement(el);
            line.stationEls.forEach(releaseStationElement);
            line.stationEls = [];
            line.pathEl = null;
            return false;
          }
        } else {
          let nextP = (line._p || 0) + speed;

          for (let i = 0; i < line.stationLengths.length; i++) {
            if (!line.stationTriggered[i] && nextP >= line.stationLengths[i]) {
              line.stationTriggered[i] = true;
              nextP = line.stationLengths[i];
              line.pauseTimer = CONFIG.stationPauseDuration;
              
              const stationEl = line.stationEls[i];
              if (stationEl) {
                stationEl.style.opacity = '1';
                stationEl.style.transform = 'scale(1)';
              }
              break;
            }
          }

          line._p = nextP;
          const current = Math.min(len, line._p);
          el.style.strokeDashoffset = `${len - current}`;

          if (current >= len && (!line.pauseTimer || line.pauseTimer <= 0)) {
            line.isDrawn = true;
            line._p = 0; // Reset for erasing phase
          }
        }

        return true;
      });

      if (!isAnimating) {
        if (state.current.lines.length >= MAX_ACTIVE_LINES) {
          const oldestLine = state.current.lines.find(l => !l.isErasing);
          if (oldestLine) oldestLine.isErasing = true;
        } else {
          spawnLine();
        }
      }

      if (!document.hidden) {
        animRef.current = requestAnimationFrame(loop);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (animRef.current) {
          cancelAnimationFrame(animRef.current);
          animRef.current = 0;
        }
      } else {
        state.current.last = 0;
        if (!animRef.current) {
          animRef.current = requestAnimationFrame(loop);
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    animRef.current = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [releasePathElement, spawnLine]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.35]">
      <svg ref={svgRef} viewBox={`0 0 ${dim.width} ${dim.height}`} style={{ width: '100%', height: '100%' }}>
        <g className="grid-dots" fill="currentColor" opacity={0.15}>
          {gridDots.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={1.5} />
          ))}
        </g>
        <g ref={linesRef} />
        <g ref={stationsRef} />
      </svg>
    </div>
  );
}
