import { useBox } from '@react-three/cannon'

export default function Box({ position }) {
 const boxSize = [1, 1, 1]

  const [ref] = useBox(() => ({
    mass: 1,
    position,
    args: boxSize,
    material: 'box',
  }))

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={boxSize} />
      <meshStandardMaterial color="skyblue" />
    </mesh>
  )
}
