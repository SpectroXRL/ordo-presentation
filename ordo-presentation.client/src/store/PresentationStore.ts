import type { Slide } from './types'

// Fixed logical slide dimensions (16:9). Shape coordinates are always in
// these units regardless of how large the canvas or a thumbnail is drawn on
// screen — the SVG viewBox handles scaling, not the stored data.
export const SLIDE_WIDTH = 1280
export const SLIDE_HEIGHT = 720

function createInitialSlide(): Slide {
  return {
    id: crypto.randomUUID(),
    shapes: [
      {
        id: crypto.randomUUID(),
        type: 'text',
        x: 120,
        y: 320,
        w: 1040,
        h: 120,
        text: 'Untitled slide',
        fontSize: 64,
        fill: '#1f2028',
      },
    ],
  }
}

/**
 * Owns the presentation's slide data and notifies subscribers on change.
 * This is the single mutation surface for the presentation: UI event
 * handlers and (eventually) the AI agent's tool calls both go through these
 * same methods — there's no separate back door for either caller.
 */
export class PresentationStore {
  private slides: Slide[]
  private activeSlideId: string
  private listeners = new Set<() => void>()

  constructor() {
    const initialSlide = createInitialSlide()
    this.slides = [initialSlide]
    this.activeSlideId = initialSlide.id
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSlides = (): Slide[] => this.slides

  getActiveSlideId = (): string => this.activeSlideId

  setActiveSlide = (slideId: string): void => {
    if (slideId === this.activeSlideId) return
    if (!this.slides.some((slide) => slide.id === slideId)) return
    this.activeSlideId = slideId
    this.notify()
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener())
  }
}

export const presentationStore = new PresentationStore()
