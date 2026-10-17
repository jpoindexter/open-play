const encodings=['7-bit absolute','14-bit absolute','Relative two’s complement','Relative offset'];
/** Session-only assignment lifecycle. UI captures suppress normal actions;
 * receive() consumes messages throughout assign mode, including between targets. */
export function createMIDIAssignment({state,targetSpec,persist=()=>{},notify=()=>{},onChange=()=>{}}) {
  let active=false,target=null,encoding=encodings[0],captured=false,reason='Assignment is off.';
  const snapshot=()=>({active,target,encoding,captured,reason,assigned:target?state.mappings.filter(m=>m.target===target).length:0});
  const changed=message=>{reason=message;onChange(snapshot());};
  function commit(next){const old=state.mappings;state.mappings=next;try{persist();}catch(error){state.mappings=old;throw error;}}
  function start(){active=true;target=null;captured=false;changed('Choose a visible Video control. Normal actions are suppressed while assigning.');}
  function cancel(message='Assignment cancelled.'){active=false;target=null;captured=false;changed(message);}
  function choose(next) {
    if(!active)throw new Error('Enable MIDI assignment first.');
    const spec=targetSpec(next);if(!spec)throw new RangeError('This control has no supported MIDI target.');
    target=next;captured=false;if(spec.kind==='command')encoding=encodings[0];
    changed(`Selected ${target}. Move or press an input; Enter removes ${snapshot().assigned} mapping(s).`);
  }
  function setEncoding(next) {
    if(!encodings.includes(next))throw new RangeError('Choose a supported MIDI encoding.');
    if(targetSpec(target)?.kind==='command'&&next!==encodings[0])throw new Error('Commands require 7-bit absolute CC/Note press and release.');
    encoding=next;captured=false;changed(target?`Waiting for ${target} input.`:'Choose a visible Video control.');
  }
  function receive(message) {
    if(!active)return false;
    if(!target||captured)return true;
    if(!message||!['CC','Note','Pitch bend'].includes(message.type)||!Number.isInteger(message.channel)||message.channel<1||message.channel>16||!Number.isInteger(message.number)||message.number<0||message.number>127||!Number.isInteger(message.value)||message.value<0||message.value>(message.type==='Pitch bend'?16383:127))
      throw new TypeError('Invalid assignment MIDI message.');
    if(message.type==='Note'&&!message.pressed)return true;
    if(targetSpec(target)?.kind==='command'&&(encoding!==encodings[0]||message.type==='Pitch bend'))throw new Error('Commands require 7-bit CC or Note buttons.');
    if(encoding.startsWith('Relative')&&message.type!=='CC')throw new Error('Relative assignment requires CC messages.');
    if(encoding==='14-bit absolute'&&message.type==='CC'&&message.number>=64)throw new Error('A 14-bit CC pair uses controller0–63 only.');
    const mapping={target,type:message.type,channel:message.channel,number:message.type==='Pitch bend'?0:message.type==='CC'&&encoding==='14-bit absolute'?message.number%32:message.number,encoding:message.type==='Pitch bend'?'14-bit absolute':encoding};
    if(typeof message.deviceId==='string'&&message.deviceId)mapping.deviceId=message.deviceId;
    const same=m=>m.target===mapping.target&&m.type===mapping.type&&m.channel===mapping.channel&&m.number===mapping.number&&m.encoding===mapping.encoding&&m.deviceId===mapping.deviceId;
    if(!state.mappings.some(same))commit([...state.mappings,mapping]);
    captured=true;changed(`Assigned ${target}: ${mapping.type} ch${mapping.channel}/${mapping.number}${mapping.deviceId?' · device scoped':''}. Enter unassigns; choose another control or exit.`);notify(reason);return true;
  }
  function unassign() {
    if(!active||!target)return 0;
    const next=state.mappings.filter(m=>m.target!==target),removed=state.mappings.length-next.length;
    if(removed)commit(next);captured=false;changed(`Removed ${removed} mapping(s) for ${target}. Move an input to reassign.`);return removed;
  }
  return {start,cancel,choose,setEncoding,receive,unassign,snapshot};
}
