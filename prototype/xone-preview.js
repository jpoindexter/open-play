// Rotary position is communicated by the existing white pointer and neutral index.
// Deliberately no dense graduation ring around compact controls.
export function refineXoneScales(){
 for(const scale of document.querySelectorAll('.xone-scale'))scale.remove();
}
