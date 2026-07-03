import sys

with open("components/MetroBackground.tsx") as f:
    lines = f.read().split('\n')

start = -1
end = -1
for i, line in enumerate(lines):
    if line.startswith("function buildWeightedGrid(grid: GridConfig): WeightedGrid {"):
        start = i
    if line.startswith("export default function MetroBackground() {"):
        end = i
        break

replacement = """function buildWeightedGrid(grid: GridConfig): WeightedGrid {
  const points: GridPoint[] = [];
  const weights: number[] = [];

  for (let c = 0; c < grid.cols; c++) {
    for (let r = 0; r < grid.rows; r++) {
      const p = getPoint(c, r, grid);
      const penalty = centerPenalty(p.x, p.y, grid);
      const weight = Math.max(
        MIN_EDGE_WEIGHT,
        Math.pow(Math.max(0, penalty - CENTER_AVOID_RADIUS), CENTER_WEIGHT_EXPONENT)
      );
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

function pickEdgePoint(grid: GridConfig, forcedSide = Math.floor(Math.random() * 4)) {
  const side = forcedSide;
  const lastCol = grid.cols - 1;
  const lastRow = grid.rows - 1;
  let col = 0;
  let row = 0;

  switch (side) {
    case 0: col = Math.floor(Math.random() * grid.cols); row = 0; break;
    case 1: col = lastCol; row = Math.floor(Math.random() * grid.rows); break;
    case 2: col = Math.floor(Math.random() * grid.cols); row = lastRow; break;
    default: col = 0; row = Math.floor(Math.random() * grid.rows); break;
  }
  return { ...getPoint(col, row, grid), col, row };
}

function pickEdgeRoute(grid: GridConfig) {
  const side = Math.floor(Math.random() * 4);
  return [
    pickEdgePoint(grid, side),
    pickEdgePoint(grid, side),
    pickEdgePoint(grid, side),
    pickEdgePoint(grid, side),
  ];
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

function createRoute(weightedGrid: WeightedGrid, recentRoutes: GridPoint[][], grid: GridConfig) {
  let fallbackRoute: GridPoint[] | null = null;

  for (let attempt = 0; attempt < MAX_ROUTE_ATTEMPTS; attempt++) {
    const route = [
      pickPoint(weightedGrid),
      pickPoint(weightedGrid),
      pickPoint(weightedGrid),
      pickPoint(weightedGrid),
    ];
    fallbackRoute = fallbackRoute ?? route;
    
    if (routeAvoidsCenter(route, grid) && !routeIsRecent(route, recentRoutes)) {
      return route;
    }
  }
  
  if (fallbackRoute && !routeAvoidsCenter(fallbackRoute, grid)) {
     return pickEdgeRoute(grid);
  }

  return fallbackRoute ?? pickEdgeRoute(grid);
}

function createLineObject(color: string, weightedGrid: WeightedGrid, recentRoutes: GridPoint[][], grid: GridConfig): LineObject {
  const route = createRoute(weightedGrid, recentRoutes, grid);
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
"""

new_lines = lines[:start] + replacement.split('\n') + lines[end:]
with open("components/MetroBackground.tsx", "w") as f:
    f.write('\n'.join(new_lines))
