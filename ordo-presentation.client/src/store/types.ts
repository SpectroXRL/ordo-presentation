export interface BaseShape {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export interface RectShape extends BaseShape {
  type: 'rect'
  fill: string
}

export interface TextShape extends BaseShape {
  type: 'text'
  text: string
  fontSize: number
  fill: string
}

export type Shape = RectShape | TextShape

export interface Slide {
  id: string
  shapes: Shape[]
}
