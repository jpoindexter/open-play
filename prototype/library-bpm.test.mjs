import test from 'node:test';
import assert from 'node:assert/strict';
import {formatLibraryBPM} from './library-rows.js';
test('library BPM is readable without changing stored precision',()=>{
 const track={bpm:124.98471158160582};
 assert.equal(formatLibraryBPM(track.bpm),'124.98');
 assert.equal(track.bpm,124.98471158160582);
 assert.equal(formatLibraryBPM(132),'132.00');
 for(const bpm of [null,undefined,0,NaN,Infinity])assert.equal(formatLibraryBPM(bpm),'—');
});
