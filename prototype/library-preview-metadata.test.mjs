import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./library-waveform-preview.js',import.meta.url),'utf8');
const paint=source.slice(source.indexOf('  function paintCell('),source.indexOf('  function rows()'));
test('retained preview image and Retry name follow a renamed track without replacing either control',()=>{
 const image={alt:'Full-track waveform: Old'},retry={label:'Retry waveform preview for Old',getAttribute(){return this.label;},setAttribute(name,value){this.label=value;}};
 const cell={dataset:{previewState:'ready',previewKey:'audio-hash'},querySelector:selector=>selector==='img'?image:retry};
 const scope={keyFor:track=>track.contentHash};vm.createContext(scope);vm.runInContext(paint,scope);
 scope.paintCell(cell,{title:'Renamed',contentHash:'audio-hash'},{phase:'ready'});
 assert.equal(image.alt,'Full-track waveform: Renamed');assert.equal(retry.label,'Retry waveform preview for Renamed');
});
test('unchanged retained preview metadata performs no accessible-attribute writes',()=>{
 let writes=0;const image={get alt(){return 'Full-track waveform: Same';},set alt(value){writes++;}},retry={getAttribute:()=> 'Retry waveform preview for Same',setAttribute(){writes++;}};
 const cell={dataset:{previewState:'ready',previewKey:'same'},querySelector:selector=>selector==='img'?image:retry},scope={keyFor:()=> 'same'};
 vm.createContext(scope);vm.runInContext(paint,scope);scope.paintCell(cell,{title:'Same'},{phase:'ready'});assert.equal(writes,0);
});
