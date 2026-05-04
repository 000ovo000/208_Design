type PixelPupProps = {
  size?: number;
  className?: string;
  variant?: "white" | "pink" | "blue";
  headOnly?: boolean;
};

type PixelUnit = {
  x: number;
  y: number;
  fill: string;
};

const palette = {
  white: {
    fur: "#f4f1e6",
    shade: "#dfe5ea",
    accent: "#cfd7de",
    ear: "#f2cab8",
    patch: "#f7f7f4",
  },
  pink: {
    fur: "#fff1f5",
    shade: "#f4cfda",
    accent: "#e8aabd",
    ear: "#e79eb3",
    patch: "#fff7fa",
  },
  blue: {
    fur: "#eef5ff",
    shade: "#cfe0f4",
    accent: "#97b8df",
    ear: "#84a8d8",
    patch: "#f7fbff",
  },
} as const;

function Pixel({ x, y, fill }: PixelUnit) {
  return <rect x={x} y={y} width="1" height="1" fill={fill} />;
}

function createHeadPixels(variant: PixelPupProps["variant"] = "white") {
  const colors = palette[variant];
  const base: PixelUnit[] = [];

  const add = (x: number, y: number, fill: string) => base.push({ x, y, fill });

  // outline and shared head shape
  const outline = "#1b1b23";
  [
    [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],
    [4, 2], [5, 2], [14, 2], [15, 2],
    [3, 3], [16, 3],
    [2, 4], [17, 4],
    [2, 5], [17, 5],
    [2, 6], [17, 6],
    [3, 7], [16, 7],
    [4, 8], [15, 8],
    [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9],
  ].forEach(([x, y]) => add(x, y, outline));

  // fill head
  for (let y = 2; y <= 8; y += 1) {
    for (let x = 3; x <= 16; x += 1) {
      const isOutside =
        (y === 2 && (x < 5 || x > 14)) ||
        (y === 3 && (x < 4 || x > 15)) ||
        (y === 4 && (x < 3 || x > 16)) ||
        (y === 7 && (x < 4 || x > 15)) ||
        (y === 8 && (x < 5 || x > 14));

      if (!isOutside) add(x, y, colors.fur);
    }
  }

  // shared muzzle / face structure
  [
    [7, 6, colors.shade],
    [8, 6, colors.shade],
    [11, 6, colors.shade],
    [12, 6, colors.shade],
    [8, 7, colors.patch],
    [9, 7, colors.patch],
    [10, 7, colors.patch],
    [11, 7, colors.patch],
    [8, 5, outline],
    [11, 5, outline],
    [9, 7, "#d59688"],
    [10, 7, outline],
  ].forEach(([x, y, fill]) => add(x as number, y as number, fill as string));

  if (variant === "white") {
    // fluffy upright ears, same family as main white dog
    [
      [4, 0, outline], [5, 0, outline], [14, 0, outline], [15, 0, outline],
      [4, 1, colors.ear], [5, 1, colors.ear], [14, 1, colors.ear], [15, 1, colors.ear],
      [6, 3, colors.shade], [13, 3, colors.shade],
      [6, 4, colors.accent], [13, 4, colors.accent],
    ].forEach(([x, y, fill]) => add(x as number, y as number, fill as string));
  }

  if (variant === "pink") {
    // spaniel-like rounder ears and softer cheeks
    [
      [3, 1, outline], [4, 1, colors.ear], [15, 1, colors.ear], [16, 1, outline],
      [2, 2, outline], [3, 2, colors.ear], [16, 2, colors.ear], [17, 2, outline],
      [3, 4, colors.ear], [16, 4, colors.ear],
      [4, 5, colors.shade], [15, 5, colors.shade],
      [6, 3, colors.patch], [13, 3, colors.patch],
      [7, 4, colors.patch], [12, 4, colors.patch],
    ].forEach(([x, y, fill]) => add(x as number, y as number, fill as string));
  }

  if (variant === "blue") {
    // pointier breed with side patch
    [
      [4, 0, outline], [5, 0, outline], [14, 0, outline], [15, 0, outline],
      [3, 1, outline], [4, 1, colors.ear], [15, 1, colors.ear], [16, 1, outline],
      [5, 3, colors.accent], [6, 3, colors.accent], [7, 3, colors.patch],
      [5, 4, colors.accent], [6, 4, colors.accent],
      [12, 3, colors.shade], [13, 4, colors.shade],
      [6, 6, colors.accent], [13, 6, colors.shade],
    ].forEach(([x, y, fill]) => add(x as number, y as number, fill as string));
  }

  return base;
}

function createBodyPixels(variant: PixelPupProps["variant"] = "white") {
  const colors = palette[variant];
  const base = createHeadPixels(variant);
  const outline = "#1b1b23";
  const add = (x: number, y: number, fill: string) => base.push({ x, y, fill });

  [
    [7, 10, outline], [8, 10, outline], [9, 10, outline], [10, 10, outline], [11, 10, outline], [12, 10, outline],
    [6, 11, outline], [13, 11, outline],
    [5, 12, outline], [14, 12, outline],
    [5, 13, outline], [14, 13, outline],
    [5, 14, outline], [8, 14, outline], [11, 14, outline], [14, 14, outline],
    [5, 15, outline], [8, 15, outline], [11, 15, outline], [14, 15, outline],
    [6, 16, outline], [7, 16, outline], [12, 16, outline], [13, 16, outline],
  ].forEach(([x, y]) => add(x, y, outline));

  for (let y = 11; y <= 15; y += 1) {
    for (let x = 6; x <= 13; x += 1) {
      const legGap = (y >= 14 && (x === 8 || x === 11));
      const edgeCut = (y === 11 && (x < 7 || x > 12));
      if (!legGap && !edgeCut) add(x, y, colors.fur);
    }
  }

  [
    [8, 12, colors.shade],
    [9, 12, colors.patch],
    [10, 12, colors.patch],
    [11, 12, colors.shade],
    [7, 13, colors.shade],
    [12, 13, colors.shade],
  ].forEach(([x, y, fill]) => add(x as number, y as number, fill as string));

  return base;
}

export function PixelPup({
  size = 10,
  className = "",
  variant = "white",
  headOnly = false,
}: PixelPupProps) {
  const pixels = headOnly ? createHeadPixels(variant) : createBodyPixels(variant);
  const width = 20 * size;
  const height = (headOnly ? 10 : 17) * size;

  return (
    <svg
      width={width}
      height={height}
      viewBox={headOnly ? "0 0 20 10" : "0 0 20 17"}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pixel puppy"
      className={className}
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      {pixels.map((pixel, index) => (
        <Pixel key={index} {...pixel} />
      ))}
    </svg>
  );
}
