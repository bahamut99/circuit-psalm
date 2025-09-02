import * as React from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Keyboard + mouse bindings used by Player.jsx and Level.jsx.
 * - WASD = movement vector (move)
 * - Arrow keys = fire direction (fireDir) & starts firing (fire)
 * - Mouse move = aim point in world coords (aim)
 * - Space or mouse down = fire
 */
export function useInputBindings() {
  const { size, camera } = useThree()
  const [input, setInput] = React.useState({
    move: { x: 0, y: 0 },
    fire: false,
    fireDir: { x: 0, y: 0 },
    aim: null, // {x,y} in world space (z=0 plane)
  })

  const keys = React.useRef(new Set())
  const raycaster = React.useMemo(() => new THREE.Raycaster(), [])
  const plane = React.useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const pt = React.useMemo(() => new THREE.Vector3(), [])

  const recomputeAxes = React.useCallback(() => {
    const k = keys.current
    const moveX = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0)
    const moveY = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0)

    // Arrow keys also act as fire direction
    const fireX = (k.has('ArrowRight') ? 1 : 0) - (k.has('ArrowLeft') ? 1 : 0)
    const fireY = (k.has('ArrowUp') ? 1 : 0) - (k.has('ArrowDown') ? 1 : 0)

    setInput((prev) => ({
      ...prev,
      move: { x: moveX, y: moveY },
      fireDir: { x: fireX, y: fireY },
      fire: prev.fire || fireX !== 0 || fireY !== 0,
    }))
  }, [])

  React.useEffect(() => {
    function onKeyDown(e) {
      keys.current.add(e.code)
      if (e.code === 'Space') {
        setInput((p) => ({ ...p, fire: true }))
      }
      // prevent page scroll with arrows/space
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault()
      recomputeAxes()
    }
    function onKeyUp(e) {
      keys.current.delete(e.code)
      if (e.code === 'Space') {
        setInput((p) => ({ ...p, fire: false }))
      }
      recomputeAxes()
    }
    function onMouseDown() {
      setInput((p) => ({ ...p, fire: true }))
    }
    function onMouseUp() {
      setInput((p) => ({ ...p, fire: false }))
    }
    function onMouseMove(e) {
      const ndc = {
        x: (e.clientX / size.width) * 2 - 1,
        y: -(e.clientY / size.height) * 2 + 1,
      }
      raycaster.setFromCamera(ndc, camera)
      raycaster.ray.intersectPlane(plane, pt)
      setInput((p) => ({ ...p, aim: { x: pt.x, y: pt.y } }))
    }

    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [camera, plane, raycaster, recomputeAxes, size.width, size.height])

  return input
}
