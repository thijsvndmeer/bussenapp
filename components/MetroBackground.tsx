import React, { useEffect, useRef, useCallback, useState } from 'react';

// ─── Configuration ───────────────────────────────────────────────
const CONFIG = {
  speed: 0.08,               // Draw/erase speed (px per ms)
  stationPauseDuration: 450, // Shorter pause for denser grid
  lineDelay: 500,
  colors: ['#2b7a78', '#9a3652', '#bda15d', '#3d7254', '#8a624a', '#5068a8'],
};

interface GridConfig {
  spacing: number;
  offsetX: number;
  offsetY: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
  buffer: { minX: number; maxX: number; minY: number; maxY: number };
  xValues: number[];
  yValues: number[];
}

function getGridConfig(width: number, height: number): GridConfig {
  const spacing = 75;
  const cols = Math.max(3, Math.floor((width - 80) / spacing));
  const rows = Math.max(3, Math.floor((height - 80) / spacing));
  const offsetX = (width - (cols - 1) * spacing) / 2;
  const offsetY = (height - (rows - 1) * spacing) / 2;
  
  const bufferWidth = Math.min(width * 0.75, 340);
  const bufferHeight = Math.min(height * 0.7, 420);
  const buffer = {
    minX: width / 2 - bufferWidth / 2,
    maxX: width / 2 + bufferWidth / 2,
    minY: height / 2 - bufferHeight / 2,
    maxY: height / 2 + bufferHeight / 2,
  };

  const xValues = [-50];
  for (let c = 0; c < cols; c++) {
    xValues.push(Math.round(offsetX + c * spacing));
  }
  xValues.push(width + 50);

  const yValues = [-50];
  for (let r = 0; r < rows; r++) {
    yValues.push(Math.round(offsetY + r * spacing));
  }
  yValues.push(height + 50);

  return {
    spacing,
    offsetX,
    offsetY,
    cols,
    rows,
    width,
    height,
    buffer,
    xValues,
    yValues,
  };
}

function isInBufferZone(x: number, y: number, buffer: GridConfig['buffer']): boolean {
  return x >= buffer.minX && x <= buffer.maxX &&
         y >= buffer.minY && y <= buffer.maxY;
}

// ─── Types ───────────────────────────────────────────────────────
interface Station {
  point: { x: number; y: number };
  lengthVal: number;
  triggered: boolean;
  erased: boolean;
  element: SVGGElement | null;
}

interface LineData {
  d: string;
  color: string;
  stations: Station[];
  totalLength: number;
  unitSegments: string[];
  pathEl: SVGPathElement | null;
  pathLength: number;
}

interface SystemState {
  phase: 'drawing' | 'erasing' | 'delay';
  currentLength: number;
  isPaused: boolean;
  pauseStartTime: number;
  phaseStartTime: number;
  nextPhase?: 'spawn' | 'erase';
}

// ─── Helpers ─────────────────────────────────────────────────────
function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getGridPoint(col: number, row: number, grid: GridConfig) {
  return {
    x: grid.offsetX + col * grid.spacing,
    y: grid.offsetY + row * grid.spacing,
  };
}

function getSegmentKey(x1: number, y1: number, x2: number, y2: number) {
  const sx1 = Math.min(x1, x2).toFixed(0);
  const sy1 = Math.min(y1, y2).toFixed(0);
  const sx2 = Math.max(x1, x2).toFixed(0);
  const sy2 = Math.max(y1, y2).toFixed(0);
  return `${sx1},${sy1}-${sx2},${sy2}`;
}

function decomposeToUnitSegments(points: { x: number; y: number }[], grid: GridConfig): string[] {
  const keys: string[] = [];
  for (let i = 1; i < points.length; i++) {
    const pA = points[i - 1];
    const pB = points[i];
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;

    if (dy === 0) {
      const minX = Math.min(pA.x, pB.x);
      const maxX = Math.max(pA.x, pB.x);
      const middleX = grid.xValues.filter((x) => x > minX && x < maxX);
      const segmentXList = [minX, ...middleX, maxX].sort((a, b) => a - b);
      for (let s = 1; s < segmentXList.length; s++) {
        keys.push(getSegmentKey(segmentXList[s - 1], pA.y, segmentXList[s], pA.y));
      }
    } else if (dx === 0) {
      const minY = Math.min(pA.y, pB.y);
      const maxY = Math.max(pA.y, pB.y);
      const middleY = grid.yValues.filter((y) => y > minY && y < maxY);
      const segmentYList = [minY, ...middleY, maxY].sort((a, b) => a - b);
      for (let s = 1; s < segmentYList.length; s++) {
        keys.push(getSegmentKey(pA.x, segmentYList[s - 1], pA.x, segmentYList[s]));
      }
    } else {
      const colA = Math.round((pA.x - grid.offsetX) / grid.spacing);
      const rowA = Math.round((pA.y - grid.offsetY) / grid.spacing);
      const colB = Math.round((pB.x - grid.offsetX) / grid.spacing);
      const rowB = Math.round((pB.y - grid.offsetY) / grid.spacing);
      const dCol = colB - colA;
      const dRow = rowB - rowA;
      const numSteps = Math.max(Math.abs(dCol), Math.abs(dRow));
      for (let s = 0; s < numSteps; s++) {
        const c1 = colA + Math.round((s * dCol) / numSteps);
        const r1 = rowA + Math.round((s * dRow) / numSteps);
        const c2 = colA + Math.round(((s + 1) * dCol) / numSteps);
        const r2 = rowA + Math.round(((s + 1) * dRow) / numSteps);
        keys.push(
          getSegmentKey(
            grid.offsetX + c1 * grid.spacing,
            grid.offsetY + r1 * grid.spacing,
            grid.offsetX + c2 * grid.spacing,
            grid.offsetY + r2 * grid.spacing
          )
        );
      }
    }
  }
  return keys;
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

function createLineObject(
  color: string,
  index: number,
  usedSegments: Set<string>,
  grid: GridConfig
): LineData | null {
  const flow = index % 2;
  let attempts = 0;

  while (attempts < 100) {
    attempts++;
    const points: { x: number; y: number }[] = [];

    if (flow === 0) {
      const r0 = randomRange(0, grid.rows - 1);
      const c1 = randomRange(0, 1);
      
      const maxDr = Math.max(1, grid.cols - 2);
      const possibleRows = [];
      for (let r = 0; r < grid.rows; r++) {
        if (r !== r0 && Math.abs(r - r0) <= maxDr) {
          possibleRows.push(r);
        }
      }
      if (possibleRows.length === 0) continue;
      const r2 = possibleRows[randomRange(0, possibleRows.length - 1)];
      const dr = Math.abs(r2 - r0);
      const c2 = c1 + dr;

      if (c2 >= grid.cols) continue;

      points.push(
        { x: -50, y: grid.offsetY + r0 * grid.spacing },
        getGridPoint(c1, r0, grid),
        getGridPoint(c2, r2, grid),
        getGridPoint(grid.cols - 1, r2, grid),
        { x: grid.width + 50, y: grid.offsetY + r2 * grid.spacing }
      );
    } else {
      const c0 = randomRange(0, grid.cols - 1);
      const r1 = randomRange(0, 1);
      
      const maxDr = Math.max(1, grid.cols - 2);
      const possibleRows = [];
      for (let r = r1 + 1; r < grid.rows; r++) {
        if (r - r1 <= maxDr) {
          possibleRows.push(r);
        }
      }
      if (possibleRows.length === 0) continue;
      const r2 = possibleRows[randomRange(0, possibleRows.length - 1)];
      const dr = r2 - r1;

      const dirOptions = [];
      if (c0 + dr < grid.cols) dirOptions.push(1);
      if (c0 - dr >= 0) dirOptions.push(-1);
      if (dirOptions.length === 0) continue;
      const dir = dirOptions[randomRange(0, dirOptions.length - 1)];
      const c2 = c0 + dr * dir;

      if (c2 < 0 || c2 >= grid.cols) continue;

      points.push(
        { x: grid.offsetX + c0 * grid.spacing, y: -50 },
        getGridPoint(c0, r1, grid),
        getGridPoint(c2, r2, grid),
        getGridPoint(c2, grid.rows - 1, grid),
        { x: grid.offsetX + c2 * grid.spacing, y: grid.height + 50 }
      );
    }

    // Reject if any internal waypoint (turn point) lands in the buffer zone.
    let waypointInBuffer = false;
    for (let w = 1; w < points.length - 1; w++) {
      if (isInBufferZone(points[w].x, points[w].y, grid.buffer)) {
        waypointInBuffer = true;
        break;
      }
    }
    if (waypointInBuffer) continue;

    const lineSegments = decomposeToUnitSegments(points, grid);
    let overlap = false;
    for (let i = 0; i < lineSegments.length; i++) {
      if (usedSegments.has(lineSegments[i])) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      lineSegments.forEach((seg) => usedSegments.add(seg));

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }

      const cumulativeLengths = [0];
      let totalLength = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
        cumulativeLengths.push(totalLength);
      }

      const stations: Station[] = [];
      for (let col = 0; col < grid.cols; col++) {
        for (let row = 0; row < grid.rows; row++) {
          const gridPt = getGridPoint(col, row, grid);
          // Skip stations inside the buffer zone
          if (isInBufferZone(gridPt.x, gridPt.y, grid.buffer)) continue;
          for (let i = 1; i < points.length; i++) {
            const pA = points[i - 1];
            const pB = points[i];
            if (isPointOnSegment(gridPt.x, gridPt.y, pA.x, pA.y, pB.x, pB.y)) {
              const dx = gridPt.x - pA.x;
              const dy = gridPt.y - pA.y;
              stations.push({
                point: gridPt,
                lengthVal: cumulativeLengths[i - 1] + Math.sqrt(dx * dx + dy * dy),
                triggered: false,
                erased: false,
                element: null,
              });
              break;
            }
          }
        }
      }
      stations.sort((a, b) => a.lengthVal - b.lengthVal);

      return {
        d,
        color,
        stations,
        totalLength,
        unitSegments: lineSegments,
        pathEl: null,
        pathLength: 0,
      };
    }
  }
  return null;
}

// ─── Component ───────────────────────────────────────────────────
const MetroBackground: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const linesGroupRef = useRef<SVGGElement>(null);
  const stationsGroupRef = useRef<SVGGElement>(null);
  const animFrameRef = useRef<number>(0);
  
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  // Persistent mutable state across animation frames
  const stateRef = useRef({
    activeLines: [] as LineData[],
    usedSegments: new Set<string>(),
    colorIndex: 0,
    lastTime: 0,
    system: {
      phase: 'drawing',
      currentLength: 0,
      isPaused: false,
      pauseStartTime: 0,
      phaseStartTime: 0,
    } as SystemState,
  });

  const mountLine = useCallback((lineData: LineData) => {
    const linesGroup = linesGroupRef.current;
    const stationsGroup = stationsGroupRef.current;
    if (!linesGroup || !stationsGroup) return;

    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', lineData.d);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', lineData.color);
    pathEl.setAttribute('stroke-width', '3.5');
    pathEl.setAttribute('stroke-linecap', 'round');
    pathEl.setAttribute('stroke-linejoin', 'round');
    linesGroup.appendChild(pathEl);

    const browserLength = pathEl.getTotalLength();
    lineData.pathEl = pathEl;
    lineData.pathLength = browserLength;

    const scaleFactor = browserLength / lineData.totalLength;
    pathEl.style.strokeDasharray = `${browserLength} ${browserLength}`;
    pathEl.style.strokeDashoffset = `${browserLength}`;

    lineData.stations.forEach((station) => {
      station.lengthVal *= scaleFactor;
      const x = station.point.x;
      const y = station.point.y;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.opacity = '0';
      g.style.transform = 'scale(0)';
      g.style.transformOrigin = `${x}px ${y}px`;
      g.style.transition =
        'opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';

      const outer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outer.setAttribute('cx', `${x}`);
      outer.setAttribute('cy', `${y}`);
      outer.setAttribute('r', '5.5');
      outer.setAttribute('fill', 'transparent');
      outer.setAttribute('stroke', lineData.color);
      outer.setAttribute('stroke-width', '1.8');

      const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      inner.setAttribute('cx', `${x}`);
      inner.setAttribute('cy', `${y}`);
      inner.setAttribute('r', '2');
      inner.setAttribute('fill', lineData.color);

      g.appendChild(outer);
      g.appendChild(inner);
      stationsGroup.appendChild(g);
      station.element = g;
    });
  }, []);

  const generateNextLine = useCallback((grid: GridConfig) => {
    const s = stateRef.current;
    const color = CONFIG.colors[s.colorIndex % CONFIG.colors.length];
    s.colorIndex++;

    const lineData = createLineObject(color, s.colorIndex, s.usedSegments, grid);
    if (lineData) {
      mountLine(lineData);
      s.activeLines.push(lineData);
    }
  }, [mountLine]);

  const activateStation = (g: SVGGElement) => {
    g.style.opacity = '1';
    g.style.transform = 'scale(1)';
  };
  const deactivateStation = (g: SVGGElement) => {
    g.style.opacity = '0';
    g.style.transform = 'scale(0)';
  };

  // Modern ResizeObserver hook for bulletproof dimension measurements on startup & resize
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(svgEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const grid = getGridConfig(dimensions.width, dimensions.height);
    const s = stateRef.current;
    
    // Reset state
    s.activeLines = [];
    s.usedSegments.clear();
    s.colorIndex = 0;
    s.lastTime = 0;
    s.system = {
      phase: 'drawing',
      currentLength: 0,
      isPaused: false,
      pauseStartTime: 0,
      phaseStartTime: 0,
    };

    if (linesGroupRef.current) linesGroupRef.current.innerHTML = '';
    if (stationsGroupRef.current) stationsGroupRef.current.innerHTML = '';

    generateNextLine(grid);

    const loop = (timestamp: number) => {
      if (!s.lastTime) {
        s.lastTime = timestamp;
        s.system.phaseStartTime = timestamp;
      }

      const dt = timestamp - s.lastTime;
      s.lastTime = timestamp;
      const sys = s.system;

      if (sys.phase === 'drawing') {
        const currentLine = s.activeLines[s.activeLines.length - 1];
        if (!currentLine) {
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        if (sys.isPaused) {
          if (timestamp - sys.pauseStartTime >= CONFIG.stationPauseDuration) {
            sys.isPaused = false;
            s.lastTime = timestamp;
          }
        } else {
          sys.currentLength += CONFIG.speed * dt;

          for (const station of currentLine.stations) {
            if (!station.triggered && sys.currentLength >= station.lengthVal) {
              station.triggered = true;
              if (station.element) activateStation(station.element);
              sys.currentLength = station.lengthVal;
              sys.isPaused = true;
              sys.pauseStartTime = timestamp;
              break;
            }
          }

          const currentLen = Math.min(sys.currentLength, currentLine.pathLength);
          if (currentLine.pathEl) {
            currentLine.pathEl.style.strokeDashoffset = `${currentLine.pathLength - currentLen}`;
          }

          if (sys.currentLength >= currentLine.pathLength && !sys.isPaused) {
            if (s.activeLines.length < 3) {
              sys.phase = 'delay';
              sys.phaseStartTime = timestamp;
              sys.nextPhase = 'spawn';
            } else {
              sys.phase = 'delay';
              sys.phaseStartTime = timestamp;
              sys.nextPhase = 'erase';
            }
          }
        }
      } else if (sys.phase === 'erasing') {
        const oldestLine = s.activeLines[0];
        if (!oldestLine) {
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        if (sys.isPaused) {
          if (timestamp - sys.pauseStartTime >= CONFIG.stationPauseDuration) {
            sys.isPaused = false;
            s.lastTime = timestamp;
          }
        } else {
          sys.currentLength += CONFIG.speed * dt;

          for (const station of oldestLine.stations) {
            if (!station.erased && sys.currentLength >= station.lengthVal) {
              station.erased = true;
              if (station.element) deactivateStation(station.element);
              sys.currentLength = station.lengthVal;
              sys.isPaused = true;
              sys.pauseStartTime = timestamp;
              break;
            }
          }

          const eraseLen = Math.min(sys.currentLength, oldestLine.pathLength);
          if (oldestLine.pathEl) {
            oldestLine.pathEl.style.strokeDashoffset = `${-eraseLen}`;
          }

          if (sys.currentLength >= oldestLine.pathLength && !sys.isPaused) {
            oldestLine.pathEl?.remove();
            oldestLine.stations.forEach((st) => st.element?.remove());
            oldestLine.unitSegments.forEach((seg) => s.usedSegments.delete(seg));
            s.activeLines.shift();

            sys.phase = 'delay';
            sys.phaseStartTime = timestamp;
            sys.nextPhase = 'spawn';
          }
        }
      } else if (sys.phase === 'delay') {
        if (timestamp - sys.phaseStartTime >= CONFIG.lineDelay) {
          if (sys.nextPhase === 'spawn') {
            generateNextLine(grid);
            sys.phase = 'drawing';
            sys.currentLength = 0;
            sys.isPaused = false;
          } else if (sys.nextPhase === 'erase') {
            sys.phase = 'erasing';
            sys.currentLength = 0;
            sys.isPaused = false;
          }
          s.lastTime = timestamp;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [dimensions, generateNextLine]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-[0.35]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{ width: '100%', height: '100%' }}
      >
        <g ref={linesGroupRef} />
        <g ref={stationsGroupRef} />
      </svg>
    </div>
  );
};

export default MetroBackground;
