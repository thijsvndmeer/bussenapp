import React, { useEffect, useRef, useCallback, useState } from 'react';

// ─── Configuration ───────────────────────────────────────────────
const CONFIG = {
  speed: 0.08,
  stationPauseDuration: 450,
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
  for (let c = 0; c < cols; c++) xValues.push(Math.round(offsetX + c * spacing));
  xValues.push(width + 50);

  const yValues = [-50];
  for (let r = 0; r < rows; r++) yValues.push(Math.round(offsetY + r * spacing));
  yValues.push(height + 50);

  return { spacing, offsetX, offsetY, cols, rows, width, height, buffer, xValues, yValues };
}

function isInBufferZone(x: number, y: number, buffer: GridConfig['buffer']): boolean {
  return x >= buffer.minX && x <= buffer.maxX && y >= buffer.minY && y <= buffer.maxY;
}

// ─── Helpers ─────────────────────────────────────────────────────
function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getGridPoint(col: number, row: number, grid: GridConfig) {
  return { x: grid.offsetX + col * grid.spacing, y: grid.offsetY + row * grid.spacing };
}

function createLineObject(color: string, index: number, usedSegments: Set<string>, grid: GridConfig) {
  const flow = index % 2;
  let attempts = 0;

  while (attempts < 100) {
    attempts++;
    const points: { x: number; y: number }[] = [];

    if (flow === 0) {
      const r0 = randomRange(0, grid.rows - 1);
      const c1 = randomRange(0, 1);

      const startCol = randomRange(0, grid.cols - 1);
      const startRow = randomRange(0, grid.rows - 1);
      const start = getGridPoint(startCol, startRow, grid);
      if (isInBufferZone(start.x, start.y, grid.buffer)) continue;

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

      const endCol = randomRange(0, grid.cols - 1);
      const endRow = randomRange(0, grid.rows - 1);
      const end = getGridPoint(endCol, endRow, grid);
      if (isInBufferZone(end.x, end.y, grid.buffer)) continue;

      points.push(start, getGridPoint(c1, r0, grid), getGridPoint(c2, r2, grid), getGridPoint(grid.cols - 1, r2, grid), end);
    } else {
      const c0 = randomRange(0, grid.cols - 1);
      const r1 = randomRange(0, 1);

      const startCol = randomRange(0, grid.cols - 1);
      const startRow = randomRange(0, grid.rows - 1);
      const start = getGridPoint(startCol, startRow, grid);
      if (isInBufferZone(start.x, start.y, grid.buffer)) continue;

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

      const endCol = randomRange(0, grid.cols - 1);
      const endRow = randomRange(0, grid.rows - 1);
      const end = getGridPoint(endCol, endRow, grid);
      if (isInBufferZone(end.x, end.y, grid.buffer)) continue;

      points.push(start, getGridPoint(c0, r1, grid), getGridPoint(c2, r2, grid), getGridPoint(c2, grid.rows - 1, grid), end);
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;

    return {
      d,
      color,
      stations: [],
      totalLength: 0,
      unitSegments: [],
      pathEl: null,
      pathLength: 0,
    };
  }

  return null;
}

export default function MetroBackground() {
  return null;
}