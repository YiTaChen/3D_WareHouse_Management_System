import { useBox } from '@react-three/cannon';

export default function ConveyorSurface({ position, rotation, size }) {
  useBox(() => ({
    args: size,
    mass: 0,
    position,
    rotation,
    type: 'Static',
  }));

  return null;
}
