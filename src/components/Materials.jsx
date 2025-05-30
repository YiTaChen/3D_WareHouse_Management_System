import {Physics, Debug, useContactMaterial } from '@react-three/cannon'

export default function Materials() {
  useContactMaterial('roller', 'box', {
    friction: 0.001,
    restitution: 0,
  })

  return null
}
