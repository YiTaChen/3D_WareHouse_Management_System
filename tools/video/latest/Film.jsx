import {useEffect,useRef} from 'react';
import {useThree,useFrame} from '@react-three/fiber';
import {createCapture} from './capture.js';
import {useBoxStore} from './stores/boxStore';
import {useCraneStore} from './stores/craneStore';
import {useMissionStore} from './stores/missionStore';
import {useBoxEquipStore} from './stores/boxEquipStore';
import {buildInboundMission,buildOutboundMission} from './missions/builders/missionBuilder';
import {getInboundPortForShelfZ,getOutboundPortForShelfZ,getPortSpawnPosition} from './missions/config/portConfigs';
import ShelfData from './data/ShelfData';
import {useShelfStore} from './stores/shelfStore';
const params=new URLSearchParams(location.search), mode=params.get('film');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const save=(name,data)=>fetch('/__film/save/'+name+'.json',{method:'POST',body:JSON.stringify(data)});
const state={active:null,results:[],started:false,samples:[],created:[],violations:[]};
async function missions(){
 if(state.started)return;state.started=true;await sleep(7000);
 await useBoxStore.getState().fetchBoxesData();
 const initialIds=Object.keys(useBoxStore.getState().boxesData);
 await save('main-demo-initial',{initialIds});
 if(initialIds.length)throw new Error('Clean capture requires an empty database');
 const ids=mode==='qa'?['shelf001','shelf002','shelf090','shelf270','shelf450']:['shelf056'];
 for(const shelfId of ids){const shelf=ShelfData.shelves.find(s=>s.id===shelfId);const boxId='film-'+Date.now();
 for(const direction of ['inbound','outbound']){
 const portId=direction==='inbound'?getInboundPortForShelfZ(shelf.position[2]):getOutboundPortForShelfZ(shelf.position[2]);
 state.active={shelfId,boxId,direction,portId,start:performance.now()};
 if(direction==='inbound'){state.created.push(boxId);await useBoxStore.getState().addBox(boxId,{id:boxId,position:getPortSpawnPosition(portId,'inbound'),content:{demoItem:{id:'00001',name:'Demo Item',quantity:12}}});await sleep(1500);}
 const builder=direction==='inbound'?buildInboundMission:buildOutboundMission;
 useMissionStore.getState().setMission(builder({portId,boxId,shelfPosition:useShelfStore.getState().getShelfPosition(shelfId)}));
 const result=await useMissionStore.getState().runMission();
 await sleep(1500);
 state.results.push({...state.active,elapsed:(performance.now()-state.active.start)/1000,status:result?.status,equipment:useBoxEquipStore.getState().boxCollisionStatus[boxId],position:useBoxStore.getState().getBoxWorldPosition(boxId)});
 await save((mode==='latest'?'main-demo':mode)+'-missions',state.results);
 if(result?.status!=='done'){await save((mode==='latest'?'main-demo':mode)+'-failure',result);return;}
 }
 }
 state.active=null;await save((mode==='latest'?'main-demo':mode)+'-complete',{results:state.results,samples:state.samples,created:state.created,violations:state.violations});document.title='QA COMPLETE';
}
export default function Film(){
 const {gl,scene,camera,controls}=useThree();const rec=useRef(null),began=useRef(performance.now()),last=useRef(0);
 useEffect(()=>{gl.setPixelRatio(1);gl.setSize(1920,1080);camera.aspect=16/9;camera.updateProjectionMatrix();if(mode==='latest')missions().catch(e=>{save('main-demo-failure',{error:String(e)});document.title='CAPTURE FAILED';}); if(mode==='hero'){setTimeout(async()=>{for(const shelf of ShelfData.shelves.filter((s,i)=>i%11===0)){const id='hero-'+shelf.id;await useBoxStore.getState().addBox(id,{id,position:[shelf.position[0],shelf.position[1]+2.6,shelf.position[2]],content:{demoItem:{id:'00001',name:'Demo Item',quantity:12}}});}},1000)}},[gl,camera]);
 useFrame(()=>{let t=(performance.now()-began.current)/1000;const active=state.active;const craneId=active?.portId==='Port3'?'crane002':(['Port4','Port5'].includes(active?.portId)?'crane003':'crane001');const c=useCraneStore.getState().getCraneState(craneId);const p=c.currentCranePosition;
 let target=[13,4,-1],position=[-27+Math.sin(t*.04)*4,25,36];
 if(active){target=[p.x+1,5.5,p.z];position=[p.x-18,15,p.z-26];}
 camera.position.lerp({x:position[0],y:position[1],z:position[2]},.045);if(controls){controls.enabled=false;controls.target.lerp({x:target[0],y:target[1],z:target[2]},.045);camera.lookAt(controls.target);}else camera.lookAt(...target);
 gl.render(scene,camera);
 if(t-last.current>1){last.current=t;const boxes=Object.keys(useBoxStore.getState().boxesData).map(id=>({id,position:useBoxStore.getState().getBoxWorldPosition(id)}));if(mode==='latest'&&boxes.length>1)state.violations.push({t,boxes});const sample={t,active,boxes,mission:useMissionStore.getState().mission?.status,crane:p.toArray(),render:gl.info.render};state.samples.push(sample);save((mode==='latest'?'main-demo':mode)+'-status',sample);}
 if(mode==='test'&&t>6){rec.current??=createCapture(gl,{id:'test',title:'From prototype to automation',subtitle:'A real-time 3D warehouse, built step by step.',chapter:'CAPTURE TEST',duration:3});rec.current.draw();}
 if(mode==='latest'&&t>7){rec.current??=createCapture(gl,{id:'main-demo',title:'450 locations. Precision in motion.',subtitle:'AS/RS crane · automated storage and retrieval · real-time physics',chapter:'LATEST MAIN / PRODUCT DEMO',duration:62});rec.current.draw();}
 if(mode==='hero'&&t>10){rec.current??=createCapture(gl,{id:'hero',title:'Built to grow.',subtitle:'From a simple conveyor to a 450-location automated warehouse.',chapter:'THE NEXT GENERATION',duration:10});rec.current.draw();}
 },1);return null;
}
