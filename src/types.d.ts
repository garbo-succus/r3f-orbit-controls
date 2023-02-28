declare module 'flyd-dom-events'

type Vec2 = [number, number]
type Vec3 = [number, number, number]

interface GesturestreamEventGesture {
  touches: PointerEvent[]
  center: Vec2
  buttons: boolean[]
  deltaXY: Vec2
  targetSize?: Vec2
  angle?: number
  distance?: number
  deltaAngle?: number
  deltaDistance?: number
  wasTap?: boolean
}

interface GesturestreamEvent {
  event: PointerEvent
  gesture: GesturestreamEventGesture
}
