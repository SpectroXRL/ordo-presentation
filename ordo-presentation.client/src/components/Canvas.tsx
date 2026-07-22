import type { Slide } from "../store/types";
import { SlideSvg } from "./SlideSvg";

export function Canvas({ slide }: { slide: Slide }) {
  return (
    <main className="canvas-pane">
      <SlideSvg slide={slide} className="slide-svg slide-svg--main" />
    </main>
  );
}
