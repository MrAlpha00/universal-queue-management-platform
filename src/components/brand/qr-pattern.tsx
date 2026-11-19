import { cn } from "@/lib/utils";

/** Decorative QR-like pattern for marketing illustrations. Not scannable. */
export function QrPattern({ className, size = 84 }: { className?: string; size?: number }) {
  const cells: { x: number; y: number }[] = [];
  const grid = 21;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const inFinder =
        (x < 7 && y < 7) || (x > grid - 8 && y < 7) || (x < 7 && y > grid - 8);
      if (inFinder) continue;
      const seed = (x * 37 + y * 91 + x * y * 13) % 11;
      if (seed < 5) cells.push({ x, y });
    }
  }

  const finder = (fx: number, fy: number) => (
    <g key={`${fx}-${fy}`}>
      <rect x={fx} y={fy} width="7" height="7" rx="1.2" fill="currentColor" />
      <rect x={fx + 1} y={fy + 1} width="5" height="5" rx="0.8" fill="#111931" />
      <rect x={fx + 2} y={fy + 2} width="3" height="3" rx="0.5" fill="currentColor" />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${grid} ${grid}`}
      width={size}
      height={size}
      className={cn("text-white", className)}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <rect width={grid} height={grid} rx="2" fill="#111931" />
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" opacity="0.92" />
      ))}
      {finder(0, 0)}
      {finder(grid - 7, 0)}
      {finder(0, grid - 7)}
    </svg>
  );
}
