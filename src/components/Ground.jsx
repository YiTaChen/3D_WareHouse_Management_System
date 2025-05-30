import { usePlane } from '@react-three/cannon'

export default function Ground() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }))

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#999" />
    </mesh>
  )
}
