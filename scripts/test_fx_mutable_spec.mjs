import assert from 'node:assert/strict';
import {createEffect} from '../prototype/effects.js';
const gain=()=>({gain:{value:0,cancelScheduledValues(){},setTargetAtTime(){}},connect(){},disconnect(){}}),ctx={currentTime:0,createGain:gain};
const spec={name:'LPF',on:false,depth:50,params:{}};const effect=createEffect(ctx,spec);spec.on=true;assert.equal(effect.update(spec),false,'App mutation of bypass must request reconstruction');spec.name='Delay';assert.equal(effect.update(spec),false,'App mutation of effect name must request reconstruction');effect.dispose();
console.log(JSON.stringify({passed:true,scope:'Actual factory baseline isolation regression with minimal audio-node collaborators; browser audio proves rendering separately',checks:['in-place bypass mutation cannot alias construction baseline','in-place processor-name mutation cannot alias construction baseline']}));
