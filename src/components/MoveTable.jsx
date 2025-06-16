import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useCraneStore } from '../stores/craneStore';
import { useFrame } from '@react-three/fiber';


function getWorldProperties(mesh) {
    if (!mesh) return null;

    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    mesh.updateWorldMatrix(true, false);
    mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    const localSize = mesh.geometry && mesh.geometry.boundingBox ?
        new THREE.Vector3().subVectors(mesh.geometry.boundingBox.max, mesh.geometry.boundingBox.min) :
        new THREE.Vector3(1, 1, 1);
    const finalSize = localSize.multiply(worldScale).toArray();

    const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);
    const rotationArray = [euler.x, euler.y, euler.z];

    return {
        position: worldPosition.toArray(),
        rotation: rotationArray,
        args: finalSize,
    };
}



export default function MoveTable({ id, craneWorldPosition, craneWorldRotation, modelPath }) {
  
}



