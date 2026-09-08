import test from 'node:test';
import assert from 'node:assert/strict';
import { boxesAtInboundPort, clearInboundPort } from './inboundPortCleanup.js';
const box = position => ({ position });
test('only selected inlet including its drop corridor is cleared', () => {
  const boxes = { rest:box([-8,1.7,-8]), falling:box([-8,4,-8]), adjacent:box([-6,1.7,-8]), other:box([-8,1.7,2]), floor:box([-8,.5,-8]), shelf:box([2,2.5,-8]), malformed:box([NaN,2,-8]) };
  assert.deepEqual(boxesAtInboundPort('Port1',boxes,()=>null),['rest','falling']);
  assert.deepEqual(boxesAtInboundPort('Port3',boxes,()=>null),['other']);
  assert.deepEqual(boxesAtInboundPort('Port4',{third:box([-8,1.7,8])},()=>null),['third']);
});
test('live coordinates override stale stored inlet positions; bound loads are protected', () => {
  const boxes={moved:box([-8,4,-8]), bound:box([-8,2,-8]), arrived:box([2,2,-8])};
  assert.deepEqual(boxesAtInboundPort('Port1',boxes,id=>id==='moved'?[2,2,-8]:id==='arrived'?[-8,1.7,-8]:null,id=>id==='bound'),['arrived']);
});
test('fresh remote boxes and local boxes are disabled before cleanup resolves', async () => {
  const calls=[];
  const ids=await clearInboundPort({portId:'Port1',load:async()=>{calls.push('load');return {remote:box([-8,4,-8])};},localBoxes:()=>({local:box([-8,1.7,-8])}),getLivePosition:()=>null,disable:async id=>{await Promise.resolve();calls.push(id);}});
  calls.push('create');
  assert.deepEqual(ids,['remote','local']);assert.deepEqual(calls,['load','remote','local','create']);
});
test('failed persistence prevents the caller from creating a new box', async () => {
  let created=false;
  await assert.rejects(async()=>{await clearInboundPort({portId:'Port1',load:async()=>({old:box([-8,2,-8])}),localBoxes:()=>({}),getLivePosition:()=>null,disable:async()=>{throw Error('offline');}});created=true;},/offline/);
  assert.equal(created,false);
});
