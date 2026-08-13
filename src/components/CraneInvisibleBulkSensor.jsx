import React, { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../stores/craneStore';
import { useBoxEquipStore } from '../stores/boxEquipStore';

const SENSOR_CENTER_ABOVE_FORK = 0.5;

export default function CraneInvisibleBulkSensor({
  id,
  craneWorldPosition,
  craneWorldRotation,
  sensorSize = [0.92, 1, 0.92],
}) {
  const currentMoveTableLocalOffset = useCraneStore(
    (state) => state.getCraneState(id).currentMoveTableLocalOffset
  );
  const setCraneSensorDetected = useCraneStore((state) => state.setCraneSensorDetected);
  const setBoxCollidingWithEquipment = useBoxEquipStore(
    (state) => state.setBoxCollidingWithEquipment
  );
  const clearBoxCollision = useBoxEquipStore((state) => state.clearBoxCollision);

  const initialQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(...craneWorldRotation)
  );
  const initialOffset = currentMoveTableLocalOffset
    .clone()
    .add(new THREE.Vector3(0, SENSOR_CENTER_ABOVE_FORK, 0))
    .applyQuaternion(initialQuaternion);

  const [, bulkSensorApi] = useBox(() => ({
    mass: 0,
    isTrigger: true,
    type: 'Kinematic',
    position: new THREE.Vector3(...craneWorldPosition).add(initialOffset).toArray(),
    rotation: craneWorldRotation,
    args: sensorSize,
    onCollideBegin: (event) => {
      const boxId = event.body.userData?.appId;
      if (!boxId) return;
      setCraneSensorDetected(id, 'BulkSensorDetected', true);
      clearBoxCollision(boxId);
      setBoxCollidingWithEquipment(boxId, id);
    },
    onCollideEnd: (event) => {
      if (event.body.userData?.appId) {
        setCraneSensorDetected(id, 'BulkSensorDetected', false);
      }
    },
  }));

  const lastPhysicsInputs = useRef(null);

  useFrame(() => {
    const nextInputs = [
      ...craneWorldPosition,
      ...craneWorldRotation,
      ...currentMoveTableLocalOffset.toArray(),
    ];
    const inputsChanged = !lastPhysicsInputs.current || nextInputs.some(
      (value, index) => value !== lastPhysicsInputs.current[index]
    );
    if (!inputsChanged) return;

    const cranePosition = new THREE.Vector3(...craneWorldPosition);
    const craneQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...craneWorldRotation)
    );
    const sensorOffset = currentMoveTableLocalOffset
      .clone()
      .add(new THREE.Vector3(0, SENSOR_CENTER_ABOVE_FORK, 0))
      .applyQuaternion(craneQuaternion);
    const sensorWorldPosition = cranePosition.add(sensorOffset);

    bulkSensorApi.position.set(
      sensorWorldPosition.x,
      sensorWorldPosition.y,
      sensorWorldPosition.z
    );
    bulkSensorApi.quaternion.set(
      craneQuaternion.x,
      craneQuaternion.y,
      craneQuaternion.z,
      craneQuaternion.w
    );
    lastPhysicsInputs.current = nextInputs;
  });

  return null;
}
