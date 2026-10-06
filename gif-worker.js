/* Self-contained GIF89a encoder, fixed 9-bit LZW segments. */
'use strict';
function encodeGIF(width,height,frames,delay){
const chunks=[];function bytes(a){chunks.push(a instanceof Uint8Array?a:Uint8Array.from(a));}function word(n){return [n&255,n>>8&255];}function str(s){return [...s].map(c=>c.charCodeAt(0));}
bytes(str('GIF89a'));bytes([...word(width),...word(height),0xf7,0,0]);
let palette=new Uint8Array(768);for(let i=0;i<256;i++){palette[i*3]=Math.round((i>>5)*255/7);palette[i*3+1]=Math.round(((i>>2)&7)*255/7);palette[i*3+2]=Math.round((i&3)*255/3);}bytes(palette);
bytes([0x21,0xff,11,...str('NETSCAPE2.0'),3,1,0,0,0]);
const dither=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
for(let frame=0;frame<frames.length;frame++){
 let rgba=new Uint8ClampedArray(frames[frame]),indices=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){let i=y*width+x,j=i*4,t=(dither[(y%4)*4+x%4]-7.5)/16;let r=Math.max(0,Math.min(7,Math.round(rgba[j]*7/255+t*.7))),g=Math.max(0,Math.min(7,Math.round(rgba[j+1]*7/255+t*.7))),b=Math.max(0,Math.min(3,Math.round(rgba[j+2]*3/255+t*.7)));indices[i]=(r<<5)|(g<<2)|b;}
 bytes([0x21,0xf9,4,4,...word(delay),0,0]);bytes([0x2c,0,0,0,0,...word(width),...word(height),0]);bytes([8]);
 let output=[],bits=0,count=0;function emit(code){bits|=code<<count;count+=9;while(count>=8){output.push(bits&255);bits>>>=8;count-=8;}}
 let map=new Map(),next=258,prefix=indices[0];emit(256);
 for(let i=1;i<indices.length;i++){let symbol=indices[i],key=prefix*256+symbol,value=map.get(key);if(value!==undefined)prefix=value;else{emit(prefix);map.set(key,next++);prefix=symbol;if(next>=500){emit(256);map.clear();next=258;}}}
 emit(prefix);emit(257);if(count)output.push(bits&255);
 let compressed=Uint8Array.from(output);for(let i=0;i<compressed.length;i+=255){let block=compressed.subarray(i,i+255);bytes([block.length]);bytes(block);}bytes([0]);
 if(typeof self!=='undefined'&&self.postMessage)self.postMessage({progress:Math.round((frame+1)/frames.length*100)});
}bytes([0x3b]);let length=chunks.reduce((n,a)=>n+a.length,0),result=new Uint8Array(length),offset=0;for(let a of chunks){result.set(a,offset);offset+=a.length;}return result;
}
if(typeof self!=='undefined')self.onmessage=e=>{try{let {width,height,frames,delay}=e.data,result=encodeGIF(width,height,frames,delay);self.postMessage({done:true,buffer:result.buffer},[result.buffer]);}catch(err){self.postMessage({error:err.message});}};
if(typeof module!=='undefined')module.exports={encodeGIF};
