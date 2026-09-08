export function createCapture(gl, {id,title,subtitle,chapter,duration=12}) {
 const output=document.createElement('canvas');output.width=1920;output.height=1080;
 const ctx=output.getContext('2d',{alpha:false});const chunks=[];const stream=output.captureStream(30);
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4;codecs=avc1'].find(x=>MediaRecorder.isTypeSupported(x));
 const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:16000000});let start=0,frames=0,stopped=false;
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 const report={id,mime,width:gl.domElement.width,height:gl.domElement.height,duration,frames:0};
 recorder.onstop=async()=>{report.frames=frames;report.elapsed=(performance.now()-start)/1000;await fetch('/__film/save/'+id+'.webm',{method:'POST',body:new Blob(chunks,{type:mime})});await fetch('/__film/save/'+id+'.json',{method:'POST',body:JSON.stringify(report)});document.title='SAVED '+id;stream.getTracks().forEach(t=>t.stop());};
 return {draw(){if(stopped)return; if(!start){start=performance.now();recorder.start(1000)}const t=(performance.now()-start)/1000;
 ctx.fillStyle='#10151b';ctx.fillRect(0,0,1920,1080);
 ctx.drawImage(gl.domElement,0,0,1920,1080);
 let g=ctx.createLinearGradient(0,0,0,330);g.addColorStop(0,'rgba(9,16,25,0.96)');g.addColorStop(1,'rgba(9,16,25,0)');ctx.fillStyle=g;ctx.fillRect(0,0,1920,330);
 g=ctx.createLinearGradient(0,825,0,1080);g.addColorStop(0,'rgba(9,16,25,0)');g.addColorStop(1,'rgba(9,16,25,.96)');ctx.fillStyle=g;ctx.fillRect(0,825,1920,255);
 ctx.fillStyle='#64dfcc';ctx.fillRect(76,69,48,5);ctx.font='600 23px Arial';ctx.fillText(chapter,144,81);
 ctx.fillStyle='#ffffff';ctx.font='600 60px Arial';ctx.fillText(title,76,163);ctx.fillStyle='#c7d1df';ctx.font='29px Arial';ctx.fillText(subtitle,78,216);
 ctx.font='22px Arial';ctx.fillStyle='#e2e8f0';ctx.fillText('YI-TA CHEN  /  3D WAREHOUSE MANAGEMENT SYSTEM',78,1000);
 ctx.fillStyle='#68dfc8';ctx.fillRect(78,1035,1764*Math.min(t/duration,1),3);
 frames++;if(frames===2||Math.abs(t-duration/2)<.03){const tag=frames===2?'start':'mid';output.toBlob(blob=>fetch('/__film/save/'+id+'-'+tag+'.png',{method:'POST',body:blob}));}
 if(t>=duration){stopped=true;recorder.stop();}
 },report};
}
