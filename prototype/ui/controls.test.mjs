import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./controls.jsx',import.meta.url),'utf8');
const begin=source.indexOf(' const next=JSON.stringify(');
const end=source.indexOf('\n for(const {node,host}',begin);
assert(begin>=0&&end>begin);
const compare=source.slice(begin,end);
function refreshSignature(key,signature=''){
  const node={textContent:'Layouts',value:'',checked:false,indeterminate:false,disabled:false,hidden:false,title:'',className:'',getAttribute:()=>null};
  const context={records:new Map([[node,{key}]]),signature,document:{body:{classList:{contains:()=>false}}},updated:false};
  vm.runInNewContext(`(function(){${compare}\nupdated=true;})()`,context);
  return {signature:context.signature,updated:context.updated};
}
test('new controls with identical values still mount when Settings is reopened',()=>{
  const first=refreshSignature(1);
  assert.equal(first.updated,true);
  assert.equal(refreshSignature(1,first.signature).updated,false,'unchanged existing controls need no React redraw');
  assert.equal(refreshSignature(2,first.signature).updated,true,'replacement controls need new portals even with identical content');
});
