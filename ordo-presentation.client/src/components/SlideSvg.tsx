import type { Shape, Slide } from "../store/types";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "../store/PresentationStore";

function renderShape(shape: Shape) {
  switch (shape.type) {
    case "rect":
      return (
        <rect
          key={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          fill={shape.fill}
        />
      );
    case "text":
      return (
        <text
          key={shape.id}
          x={shape.x}
          y={shape.y}
          fontSize={shape.fontSize}
          fill={shape.fill}
          fontFamily="system-ui, sans-serif"
        >
          {shape.text}
        </text>
      );
    default:
      return null;
  }
}

interface SlideSvgProps {
  slide: Slide;
  className?: string;
}

/**
 * Renders a slide's shape data as SVG using a fixed logical viewBox. Reused
 * as-is at any display size (main canvas or slide-list thumbnail) — the
 * shape coordinates never change based on where this is rendered.
 */
export function SlideSvg({ slide, className }: SlideSvgProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}`}
      role="img"
      aria-label="Slide content"
    >
      <rect
        className="slide-bg"
        x={0}
        y={0}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
      />
      {slide.shapes.map(renderShape)}
    </svg>
  );
}
