import test from 'node:test';
import { setImmediate } from 'node:timers';
import assert from 'node:assert/strict';
import { planBoxLoadCleanup, createBoxDataLoader } from './boxLoadCleanup.js';
const box = (id, position) => ({ id, position, content: { tissue: { quantity: 2 } } });
test('stable survivor across response order; no inventory mutation', () => {
 const a=box('a',[-8,4,-8]),b=box('b',[-8,4,-8]),data={b,a};
 const r=planBoxLoadCleanup(data);assert.deepEqual(r,planBoxLoadCleanup({a,b}));
 assert.deepEqual(r.removed,[{id:'b',keptId:'a'}]);assert.equal(r.boxesData.a,a);assert.equal(data.b,b);
});
test('touching, stacked, separate boxes and contact tolerance survive', () => {
 const a=box('a',[0,2,0]);
 assert.deepEqual(planBoxLoadCleanup({a,b:box('b',[1,2,0]),c:box('c',[0,3,0]),d:box('d',[0,2,1])}).removed,[]);
 assert.deepEqual(planBoxLoadCleanup({a,b:box('b',[0.99,2,0])}).removed,[]);
 assert.deepEqual(planBoxLoadCleanup({a,b:box('b',[0.4,2.2,0.3])}).removed,[{id:'b',keptId:'a'}]);
});
test('chain compares only retained boxes',()=>{
 const r=planBoxLoadCleanup({a:box('a',[0,2,0]),b:box('b',[0.8,2,0]),c:box('c',[1.6,2,0])});
 assert.deepEqual(Object.keys(r.boxesData),['a','c']);
});
test('invalid coordinates are not deletion evidence',()=>{
 assert.deepEqual(planBoxLoadCleanup({a:box('a',[null,0,0]),b:box('b',[null,0,0])}).removed,[]);
 assert.throws(()=>planBoxLoadCleanup([]));
});
test('concurrent loads share requests; no publication before cleanup settles',async()=>{
 let finish,reads=0,deletes=0;const commits=[];
 const load=createBoxDataLoader({fetchMap:async()=>{reads++;return {a:box('a',[0,2,0]),b:box('b',[0,2,0])};},removeBox:()=>{deletes++;return new Promise(r=>{finish=r;});},commit:r=>commits.push(r)});
 const first=load(),second=load();assert.equal(first,second);
 await new Promise(r=>setImmediate(r));assert.equal(commits.length,0);finish();await first;
 assert.equal(reads,1);assert.equal(deletes,1);assert.deepEqual(Object.keys(commits[0].boxesData),['a']);
});
test('failed soft delete keeps duplicate out of scene and retries next load',async()=>{
 let attempts=0;const commits=[];
 const load=createBoxDataLoader({fetchMap:async()=>({a:box('a',[0,2,0]),b:box('b',[0,2,0])}),removeBox:async()=>{if(++attempts===1)throw Error('offline');},commit:r=>commits.push(r)});
 await load();await load();assert.deepEqual(commits[0].failedIds,['b']);assert.deepEqual(Object.keys(commits[0].boxesData),['a']);assert.deepEqual(commits[1].failedIds,[]);assert.equal(attempts,2);
});
test('fetch failure publishes nothing; retry works',async()=>{
 let reads=0;const commits=[];
 const load=createBoxDataLoader({fetchMap:async()=>{if(++reads===1)throw Error('offline');return {};},removeBox:async()=>assert.fail(),commit:r=>commits.push(r)});
 await assert.rejects(load(),/offline/);assert.equal(commits.length,0);await load();assert.equal(commits.length,1);
});
