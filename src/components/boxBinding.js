import * as THREE from 'three';

export const BOX_BINDING_CONFIG = {
  verticalOffset: 0.6,
  confirmationTolerance: 0.02,
  confirmationTimeoutMs: 2000,
};

const toEuler = (rotation) => {
  if (rotation?.isEuler) return rotation;
  if (Array.isArray(rotation)) return new THREE.Euler(...rotation);
  return new THREE.Euler();
};

export const getBoxBindingTransform = (
  craneState,
  verticalOffset = BOX_BINDING_CONFIG.verticalOffset,
) => {
  if (!craneState?.currentCranePosition || !craneState?.currentMoveTableLocalOffset) {
    return null;
  }

  const quaternion = new THREE.Quaternion().setFromEuler(toEuler(craneState.rotation));
  const position = craneState.currentCranePosition.clone().add(
    craneState.currentMoveTableLocalOffset.clone().applyQuaternion(quaternion),
  );
  position.y += verticalOffset;

  return { position, quaternion };
};

export const applyBoxBindingTransform = (boxApi, transform) => {
  if (!boxApi?.position?.set || !transform?.position) return false;

  boxApi.position.set(...transform.position.toArray());
  boxApi.quaternion?.set(...transform.quaternion.toArray());
  boxApi.velocity?.set(0, 0, 0);
  boxApi.angularVelocity?.set(0, 0, 0);
  return true;
};

export const isPositionWithinTolerance = (
  position,
  expectedPosition,
  tolerance = BOX_BINDING_CONFIG.confirmationTolerance,
) => {
  if (!position || typeof position.length !== 'number' || position.length < 3 || !expectedPosition) {
    return false;
  }
  const expected = expectedPosition.isVector3
    ? expectedPosition
    : new THREE.Vector3(...expectedPosition);

  return expected.distanceToSquared(new THREE.Vector3(position[0], position[1], position[2]))
    <= tolerance * tolerance;
};

export const waitForBoxPosition = ({
  subscribe,
  expectedPosition,
  tolerance = BOX_BINDING_CONFIG.confirmationTolerance,
  timeoutMs = BOX_BINDING_CONFIG.confirmationTimeoutMs,
}) => new Promise((resolve) => {
  if (typeof subscribe !== 'function' || !expectedPosition) {
    resolve(false);
    return;
  }

  let settled = false;
  let unsubscribe = () => {};

  const finish = (result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutId);
    unsubscribe();
    resolve(result);
  };

  const timeoutId = setTimeout(() => finish(false), timeoutMs);

  try {
    const nextUnsubscribe = subscribe((position) => {
      if (isPositionWithinTolerance(position, expectedPosition, tolerance)) {
        finish(true);
      }
    });
    unsubscribe = typeof nextUnsubscribe === 'function' ? nextUnsubscribe : () => {};
    if (settled) unsubscribe();
  } catch {
    finish(false);
  }
});
