import test from 'node:test';
import assert from 'node:assert/strict';
import { createGroundBoxMonitor, isAboveGround } from './groundBoxCleanup.js';
function setup({ eligible = () => true, disable } = {}) {
 let time=0, next=0, calls=0; const tasks=new Map();
 const monitor=createGroundBoxMonitor({isEligible:eligible,disable:async()=>{calls++;await disable?.();},onError:()=>{},
 schedule:(fn,ms)=>{const id=++next;tasks.set(id,{at:time+ms,fn});return id;},cancel:id=>tasks.delete(id)});
 return {monitor,calls:()=>calls,advance:async ms=>{time+=ms;for(const [id,t] of [...tasks])if(t.at<=time){tasks.delete(id);await t.fn();}}};
}
test('no ground contact does not delete; continuous ground contact requires six seconds',async()=>{
 const t=setup();await t.advance(10000);assert.equal(t.calls(),0);t.monitor.enter();await t.advance(5999);assert.equal(t.calls(),0);await t.advance(1);assert.equal(t.calls(),1);
});
test('leaving ground cancels countdown; landing again starts a fresh six seconds',async()=>{
 const t=setup();t.monitor.enter();await t.advance(5000);t.monitor.leave();await t.advance(10000);assert.equal(t.calls(),0);t.monitor.enter();await t.advance(5999);assert.equal(t.calls(),0);await t.advance(1);assert.equal(t.calls(),1);
});
test('repeated contact notifications do not reset deadline; dispose cancels cleanup',async()=>{
 const t=setup();t.monitor.enter();await t.advance(3000);t.monitor.enter();await t.advance(3000);assert.equal(t.calls(),1);
 const u=setup();u.monitor.enter();u.monitor.dispose();await u.advance(6000);assert.equal(u.calls(),0);
});
test('crane-bound box is protected; failed persistence retries without duplicate requests',async()=>{
 const bound=setup({eligible:()=>false});bound.monitor.enter();await bound.advance(6000);assert.equal(bound.calls(),0);
 let attempts=0;const t=setup({disable:()=>{if(++attempts===1)throw Error('offline');}});t.monitor.enter();await t.advance(6000);assert.equal(t.calls(),1);await t.advance(6000);assert.equal(t.calls(),2);
});

test('ground separation accounts for rotation and resting solver jitter', () => {
 assert.equal(isAboveGround([0, 0.51, 0], [0, 0, 0, 1]), false);
 assert.equal(isAboveGround([0, 0.6, 0], [0, 0, 0, 1]), true);
 const q = [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)];
 assert.equal(isAboveGround([0, Math.SQRT1_2, 0], q), false);
 assert.equal(isAboveGround([0, Math.SQRT1_2 + 0.1, 0], q), true);
});
