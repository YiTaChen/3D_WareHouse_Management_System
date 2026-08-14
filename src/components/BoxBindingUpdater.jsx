import { useCraneStore } from '../stores/craneStore';
import { useBoxStore } from '../stores/boxStore';
import { useFrame } from '@react-three/fiber';
import {
  applyBoxBindingTransform,
  getBoxBindingTransform,
} from './boxBinding.js';

export default function BoxBindingUpdater  () {
  const getCraneState = useCraneStore((state) => state.getCraneState);
  const getBoxRef = useBoxStore((state) => state.getBoxRef);
  const boxesData = useBoxStore((state) => state.boxesData);
  const getBoxBoundMoveplate = useBoxStore((state) => state.getBoxBoundMoveplate); // ✅ 正確來源

  useFrame(() => {
    if (!boxesData) return;

    Object.keys(boxesData).forEach((boxId) => {
      const boundCraneId = getBoxBoundMoveplate(boxId); // ✅ 改用此處
      if (!boundCraneId) return;

      const craneState = getCraneState(boundCraneId);
      const boxRef = getBoxRef(boxId);

      if (!boxRef?.api) return;

      try {
        const transform = getBoxBindingTransform(craneState);
        applyBoxBindingTransform(boxRef.api, transform);
      } catch (err) {
        console.warn(`[BoxBindingUpdater] Failed to bind ${boxId}:`, err);
      }
    });
  });

  return null;
};
