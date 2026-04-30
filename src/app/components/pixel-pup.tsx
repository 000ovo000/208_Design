type PixelPupProps = {
  size?: number;
  className?: string;
  variant?: "white" | "pink" | "blue";
  headOnly?: boolean;
};

const palette = {
  white: {
    fur: "#f7f3ea",
    shade: "#dfe5ea",
    ear: "#f4c7b7",
  },
  pink: {
    fur: "#fff0f4",
    shade: "#f3c4d1",
    ear: "#e89db3",
  },
  blue: {
    fur: "#edf5ff",
    shade: "#bfd4ee",
    ear: "#8fb5e8",
  },
} as const;

function Pixel({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <rect x={x} y={y} width="1" height="1" fill={fill} />;
}

export function PixelPup({
  size = 10,
  className = "",
  variant = "white",
  headOnly = false,
}: PixelPupProps) {
  const colors = palette[variant];
  const width = 18 * size;
  const height = (headOnly ? 11 : 18) * size;

  return (
    <svg
      width={width}
      height={height}
      viewBox={headOnly ? "0 0 18 11" : "0 0 18 18"}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pixel puppy"
      className={className}
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      <Pixel x={3} y={0} fill="#1b1b23" />
      <Pixel x={4} y={0} fill="#1b1b23" />
      <Pixel x={13} y={0} fill="#1b1b23" />
      <Pixel x={14} y={0} fill="#1b1b23" />

      <Pixel x={2} y={1} fill="#1b1b23" />
      <Pixel x={3} y={1} fill={colors.ear} />
      <Pixel x={4} y={1} fill={colors.ear} />
      <Pixel x={5} y={1} fill="#1b1b23" />
      <Pixel x={12} y={1} fill="#1b1b23" />
      <Pixel x={13} y={1} fill={colors.ear} />
      <Pixel x={14} y={1} fill={colors.ear} />
      <Pixel x={15} y={1} fill="#1b1b23" />

      {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((x) => (
        <Pixel key={`top-${x}`} x={x} y={2} fill={x === 4 || x === 13 ? "#1b1b23" : colors.fur} />
      ))}

      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((x) => (
        <Pixel
          key={`head1-${x}`}
          x={x}
          y={3}
          fill={x === 2 || x === 15 ? "#1b1b23" : colors.fur}
        />
      ))}

      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((x) => (
        <Pixel
          key={`head2-${x}`}
          x={x}
          y={4}
          fill={x === 1 || x === 16 ? "#1b1b23" : colors.fur}
        />
      ))}

      <Pixel x={1} y={5} fill="#1b1b23" />
      {[2, 3, 4, 5, 6, 7].map((x) => <Pixel key={`row5l-${x}`} x={x} y={5} fill={colors.fur} />)}
      <Pixel x={8} y={5} fill={colors.shade} />
      <Pixel x={9} y={5} fill={colors.shade} />
      {[10, 11, 12, 13, 14, 15].map((x) => <Pixel key={`row5r-${x}`} x={x} y={5} fill={colors.fur} />)}
      <Pixel x={16} y={5} fill="#1b1b23" />

      <Pixel x={1} y={6} fill="#1b1b23" />
      {[2, 3, 4, 5, 6].map((x) => <Pixel key={`row6l-${x}`} x={x} y={6} fill={colors.fur} />)}
      <Pixel x={5} y={6} fill="#1b1b23" />
      <Pixel x={12} y={6} fill="#1b1b23" />
      {[7, 8, 9, 10, 11].map((x) => <Pixel key={`row6m-${x}`} x={x} y={6} fill={colors.fur} />)}
      {[13, 14, 15].map((x) => <Pixel key={`row6r-${x}`} x={x} y={6} fill={colors.fur} />)}
      <Pixel x={16} y={6} fill="#1b1b23" />

      <Pixel x={2} y={7} fill="#1b1b23" />
      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((x) => (
        <Pixel key={`row7-${x}`} x={x} y={7} fill={colors.fur} />
      ))}
      <Pixel x={7} y={7} fill="#1b1b23" />
      <Pixel x={10} y={7} fill="#1b1b23" />
      <Pixel x={8} y={7} fill={colors.shade} />
      <Pixel x={9} y={7} fill="#1b1b23" />
      <Pixel x={15} y={7} fill="#1b1b23" />

      <Pixel x={3} y={8} fill="#1b1b23" />
      {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((x) => (
        <Pixel key={`row8-${x}`} x={x} y={8} fill={colors.fur} />
      ))}
      <Pixel x={7} y={8} fill={colors.shade} />
      <Pixel x={10} y={8} fill={colors.shade} />
      <Pixel x={8} y={8} fill="#2e2e36" />
      <Pixel x={9} y={8} fill="#d38b7e" />
      <Pixel x={11} y={8} fill="#2e2e36" />
      <Pixel x={14} y={8} fill="#1b1b23" />

      <Pixel x={4} y={9} fill="#1b1b23" />
      {[5, 6, 7, 8, 9, 10, 11, 12, 13].map((x) => (
        <Pixel key={`row9-${x}`} x={x} y={9} fill={colors.fur} />
      ))}
      <Pixel x={8} y={9} fill="#1b1b23" />
      <Pixel x={9} y={9} fill="#f2b7aa" />
      <Pixel x={10} y={9} fill="#1b1b23" />
      <Pixel x={13} y={9} fill="#1b1b23" />

      <Pixel x={6} y={10} fill="#1b1b23" />
      <Pixel x={7} y={10} fill="#1b1b23" />
      <Pixel x={8} y={10} fill="#1b1b23" />
      <Pixel x={9} y={10} fill="#1b1b23" />
      <Pixel x={10} y={10} fill="#1b1b23" />
      <Pixel x={11} y={10} fill="#1b1b23" />

      {!headOnly && (
        <>
          {[5, 6, 7, 8, 9, 10, 11, 12].map((x) => (
            <Pixel
              key={`body1-${x}`}
              x={x}
              y={11}
              fill={x === 5 || x === 12 ? "#1b1b23" : colors.fur}
            />
          ))}
          {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((x) => (
            <Pixel
              key={`body2-${x}`}
              x={x}
              y={12}
              fill={x === 4 || x === 13 ? "#1b1b23" : x === 8 || x === 9 ? colors.shade : colors.fur}
            />
          ))}
          {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((x) => (
            <Pixel
              key={`body3-${x}`}
              x={x}
              y={13}
              fill={x === 4 || x === 13 ? "#1b1b23" : colors.fur}
            />
          ))}
          <Pixel x={3} y={14} fill="#1b1b23" />
          <Pixel x={4} y={14} fill={colors.fur} />
          <Pixel x={5} y={14} fill={colors.fur} />
          <Pixel x={6} y={14} fill="#1b1b23" />
          <Pixel x={11} y={14} fill="#1b1b23" />
          <Pixel x={12} y={14} fill={colors.fur} />
          <Pixel x={13} y={14} fill={colors.fur} />
          <Pixel x={14} y={14} fill="#1b1b23" />

          <Pixel x={3} y={15} fill="#1b1b23" />
          <Pixel x={4} y={15} fill={colors.fur} />
          <Pixel x={5} y={15} fill={colors.fur} />
          <Pixel x={6} y={15} fill="#1b1b23" />
          <Pixel x={11} y={15} fill="#1b1b23" />
          <Pixel x={12} y={15} fill={colors.fur} />
          <Pixel x={13} y={15} fill={colors.fur} />
          <Pixel x={14} y={15} fill="#1b1b23" />

          {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((x) => (
            <Pixel key={`floor-${x}`} x={x} y={16} fill="#1b1b23" />
          ))}
          <Pixel x={4} y={17} fill="#d8c8b7" />
          <Pixel x={5} y={17} fill="#d8c8b7" />
          <Pixel x={12} y={17} fill="#d8c8b7" />
          <Pixel x={13} y={17} fill="#d8c8b7" />
        </>
      )}
    </svg>
  );
}
