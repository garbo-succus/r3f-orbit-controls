// @ts-nocheck
// TODO: Make this pass TS
import { MathUtils, Vector2 } from 'three'
import { actions, CameraState } from 'r3f-orbit-camera'

// Keep angle between 0-2π rads
const clampAngle = (angle: number) =>
  MathUtils.euclideanModulo(angle, Math.PI * 2)

const handleMoveVector = new Vector2() // Reusable vector (to save on GC)
const vector00 = new Vector2(0, 0)

export const handleMove = ({ deltaXY }: GesturestreamEventGesture) =>
  actions.updatePosition(
    ({ origin: [oldX, y, oldZ], coords: [r, , phi] }: CameraState) => {
      const screenXY = handleMoveVector
        .set(...deltaXY)
        .rotateAround(vector00, -phi) // Rotate screen X/Y coords to match camera rotation
        .toArray()
        .map((v: number) => (v * r) / 1000) // Move faster as we move out further
      const z = oldZ + screenXY[0]
      const x = oldX - screenXY[1]
      return { origin: [x, y, z] }
    }
  )

export const handleRotate = ({
  deltaXY,
  targetSize
}: GesturestreamEventGesture) =>
  actions.updatePosition(
    ({
      minTheta,
      maxTheta,
      rotationScale,
      coords: [r, oldTheta, oldPhi]
    }: CameraState) => {
      const theta = MathUtils.clamp(
        oldTheta + (deltaXY[1] / targetSize[1]) * rotationScale[1],
        minTheta,
        maxTheta
      )
      const phi = clampAngle(
        oldPhi - (deltaXY[0] / targetSize[0]) * rotationScale[0]
      )
      return { coords: [r, theta, phi] }
    }
  )

export const handleWheel = (event: PointerEvent) => {
  const { deltaX, altKey, ctrlKey } = event
  // Move camera
  if (altKey) return handleMove({ deltaXY: [-deltaX, -event.deltaY] })
  // Rotate camera
  return actions.updatePosition(
    ({
      minR,
      maxR,
      minTheta,
      maxTheta,
      coords: [oldR, oldTheta, oldPhi]
    }: CameraState) => {
      // Swap deltaY/deltaZ if ctrl key pressed (or user is pinch-zooming on trackpad)
      const deltaY = ctrlKey ? event.deltaZ : event.deltaY
      const deltaZ = ctrlKey ? event.deltaY : event.deltaZ
      const r = MathUtils.clamp(oldR + deltaY / (500 / oldR), minR, maxR) // Dolly in-out (faster as we move out further)
      const theta = MathUtils.clamp(oldTheta - deltaZ / 250, minTheta, maxTheta) // Tilt up-down
      const phi = clampAngle(oldPhi + deltaX / 250) // Pan left-right
      return { coords: [r, theta, phi] }
    }
  )
}

export const handlePinch = ({
  deltaXY,
  deltaAngle,
  deltaDistance
}: GesturestreamEventGesture) =>
  actions.updatePosition((state: CameraState) => {
    const {
      minR,
      maxR,
      coords: [oldR, theta, oldPhi]
    } = state
    const { origin } = handleMove({ deltaXY })(state)
    const r = MathUtils.clamp(oldR + deltaDistance / (500 / oldR), minR, maxR)
    const phi = clampAngle(oldPhi + deltaAngle)
    return { origin, coords: [r, theta, phi] }
  })
