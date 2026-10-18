// Compare the complete binary-string encoded WASM emitted by Emscripten4.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
function decode(source){
 const match=source.match(/function findWasmBinary\(\)\{return binaryDecode\(("(?:\\.|[^"\\])*")\)\}/s);
 assert(match,'Expected the observed generated binaryDecode literal');
 const text=vm.runInNewContext(match[1],Object.create(null),{timeout:1000});
 assert.equal(typeof text,'string');
 const bytes=Buffer.alloc(text.length);for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);bytes[i]=~c>>8&c;}
 assert.deepEqual([...bytes.subarray(0,8)],[0,97,115,109,1,0,0,0]);return bytes;
}
const variants=[];
for(const variant of ['stock','candidate']){
 const beforePath=`local-evidence/reference-policy-155/build-initial/${variant}-dsp.mjs`,afterPath=`local-evidence/reference-policy-155/build-worklet/${variant}-dsp.mjs`;
 const before=readFileSync(new URL(beforePath,root)),after=readFileSync(new URL(afterPath,root));
 const a=decode(before.toString()),b=decode(after.toString());assert.deepEqual(a,b);
 variants.push({variant,beforeModuleSHA256:sha(before),afterModuleSHA256:sha(after),wasmBytes:a.length,wasmSHA256:sha(a),initialAndWorkletWasmBitIdentical:true});
}
const result={checkpoint:155,scope:'AudioWorklet loader correction only; complete decoded WASM bytes compared for both builds. Not browser readiness.',variants,scriptSHA256:sha(readFileSync(new URL(import.meta.url))),fullParityAcceptance:false};
writeFileSync(new URL('docs/prototype/reference-policy-155-loader-results.json',root),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(variants,null,2));
