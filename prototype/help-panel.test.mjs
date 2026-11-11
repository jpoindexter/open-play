import test from 'node:test';
import assert from 'node:assert/strict';
import {showHelp} from './help-panel.js';

test('Help opens our manual and encoded search while retaining local controls',()=>{
  const prior=globalThis.window,opened=[],local=[],nodes=new Map();
  const $=id=>{
    if(!nodes.has(id))nodes.set(id,{value:'',click(){this.onclick();},addEventListener(type,handler,capture){this[type]=handler;this.capture=capture;}});
    return nodes.get(id);
  };
  let markup;
  globalThis.window={open:(...args)=>opened.push(args)};
  try{
    showHelp({dialog:(_,html,setup)=>{markup=html;setup();},$,helpKeys:[['Left Play','W']],
      coverage:()=>local.push('coverage'),stems:()=>local.push('stems'),system:()=>local.push('system')});
    assert.match(markup,/Left Play/);assert.match(markup,/Temporary deck Cue/);
    assert.match(markup,/headphone CUE/);assert.match(markup,/available offline/);
    $('#help-manual').click();
    $('#help-search').value='  cue & sync/tempo  ';
    let prevented=false;
    assert.equal($('#help-search-controls').capture,true);
    $('#help-search-controls').keydown({key:'Enter',target:{tagName:'INPUT'},preventDefault(){prevented=true;}});
    assert.equal(prevented,true);
    assert.deepEqual(opened,[
      ['https://open-play-help.vercel.app/','_blank','noopener,noreferrer'],
      ['https://open-play-help.vercel.app/?q=cue%20%26%20sync%2Ftempo','_blank','noopener,noreferrer']
    ]);
    for(const id of ['#help-coverage','#help-stems','#help-system'])$(id).click();
    assert.deepEqual(local,['coverage','stems','system']);
    for(const extra of [{key:'Escape'},{key:'Enter',isComposing:true},{key:'Enter',ctrlKey:true},{key:'Enter',target:{tagName:'BUTTON'}}])
      $('#help-search-controls').keydown({target:{tagName:'INPUT'},...extra});
    assert.equal(opened.length,2);
  }finally{globalThis.window=prior;}
});
