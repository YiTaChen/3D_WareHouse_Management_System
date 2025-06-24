import { usePlane } from '@react-three/cannon'

export default function Ground() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }))

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 50]} />

      {/* <planeGeometry args={[10, 10]} /> */}

      {/* <meshStandardMaterial color="#999" /> */}
   
      <meshStandardMaterial color="#E6F0FF" />
   
    </mesh>
  )
}
