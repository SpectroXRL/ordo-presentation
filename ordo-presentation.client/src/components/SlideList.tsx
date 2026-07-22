import type { Slide } from "../store/types";
import { SlideSvg } from "./SlideSvg";

interface SlideListProps {
  slides: Slide[];
  activeSlideId: string;
  onSelect: (slideId: string) => void;
}

export function SlideList({ slides, activeSlideId, onSelect }: SlideListProps) {
  return (
    <nav className="slide-list" aria-label="Slides">
      <ol>
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;
          return (
            <li key={slide.id}>
              <button
                type="button"
                className={
                  isActive ? "slide-thumb slide-thumb--active" : "slide-thumb"
                }
                aria-current={isActive}
                onClick={() => onSelect(slide.id)}
              >
                <span className="slide-thumb-number">{index + 1}</span>
                <SlideSvg
                  slide={slide}
                  className="slide-svg slide-svg--thumb"
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
