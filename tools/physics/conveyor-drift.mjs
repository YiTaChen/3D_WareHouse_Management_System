import fs from 'node:fs';
import * as THREE from 'three';
import * as C from 'cannon-es';
import { STOPPED_ROLLER_CONTACT, RUNNING_ROLLER_CONTACT } from '../../src/components/rollerContact.js';

// Read the shipped GLTF hierarchy and geometry bounds, not approximate rollers.
const gltf = JSON.parse(fs.readFileSync(new URL('../../public/plateform_conveyor_ver5.gltf', import.meta.url)));
const objects = gltf.nodes.map(n => {
  const object = new THREE.Object3D();
  object.position.fromArray(n.translation || [0, 0, 0]);
  object.quaternion.fromArray(n.rotation || [0, 0, 0, 1]);
  object.scale.fromArray(n.scale || [1, 1, 1]);
  return object;
});
gltf.nodes.forEach((n, i) => (n.children || []).forEach(j => objects[i].add(objects[j])));
objects.filter(o => !o.parent).forEach(o => o.updateMatrixWorld(true));

export function createConveyorFixture({ contact = STOPPED_ROLLER_CONTACT, x = 0, yaw = 0 } = {}) {
  const world = new C.World({ gravity: new C.Vec3(0, -9.81, 0), allowSleep: true });
  world.broadphase = new C.SAPBroadphase(world);
  world.solver.iterations = 5;
  world.solver.tolerance = .001;
  const stopped = new C.Material('stoppedRoller');
  const running = new C.Material('roller');
  const boxMaterial = new C.Material('box');
  world.addContactMaterial(new C.ContactMaterial(stopped, boxMaterial, contact));
  world.addContactMaterial(new C.ContactMaterial(running, boxMaterial, RUNNING_ROLLER_CONTACT));
  const rollers = [];
  gltf.nodes.forEach((n, i) => {
    if (!n.name?.startsWith('Roller_')) return;
    const bounds = gltf.accessors[gltf.meshes[n.mesh].primitives[0].attributes.POSITION];
    const size = new THREE.Vector3().fromArray(bounds.max).sub(new THREE.Vector3().fromArray(bounds.min)).multiply(objects[i].scale);
    const position = objects[i].getWorldPosition(new THREE.Vector3());
    const quaternion = objects[i].getWorldQuaternion(new THREE.Quaternion());
    const body = new C.Body({ mass: 0, type: C.Body.STATIC, material: stopped,
      shape: new C.Cylinder((size.x + size.z) / 4, (size.x + size.z) / 4, size.y, 16),
      position: new C.Vec3(...position), quaternion: new C.Quaternion(...quaternion) });
    rollers.push(body);
    world.addBody(body);
  });
  const box = new C.Body({ mass: 1, shape: new C.Box(new C.Vec3(.5, .5, .5)),
    position: new C.Vec3(x, 4, 0), material: boxMaterial,
    allowSleep: true, sleepSpeedLimit: .1, sleepTimeLimit: 1 });
  box.quaternion.setFromEuler(0, yaw, 0);
  world.addBody(box);
  return { world, box, rollers,
    step(seconds) { for (let i = 0; i < seconds * 30; i++) world.step(1 / 30); },
    start() {
      // Match production's stopped -> running replacement and explicit mission wake.
      rollers.forEach(old => {
        world.removeBody(old);
        const body = new C.Body({ mass: 0, type: C.Body.KINEMATIC, material: running,
          shape: old.shapes[0], position: old.position.clone(), quaternion: old.quaternion.clone(),
          angularVelocity: new C.Vec3(0, 0, -20) });
        world.addBody(body);
      });
      box.wakeUp();
    },
  };
}
