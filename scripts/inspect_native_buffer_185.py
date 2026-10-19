"""Recorded buffer-rate coordinates at native context frames; no fitted offset."""
import numpy as np

def native_buffer_reference(data,frames,start_frame,offset_seconds,buffer_rate,context_rate,loop=None):
    frames=np.asarray(frames);active=frames>=start_frame
    position=np.floor(offset_seconds*buffer_rate+.5)+np.maximum(0,frames-start_frame)*(buffer_rate/context_rate)
    if loop:
        first,last=np.asarray(loop)*buffer_rate;span=last-first
        position=np.where(position>=last,first+np.mod(position-first,span),position)
    i=np.floor(position).astype(int);fraction=position-i;j=i+1
    if loop:j=np.where((i<last)&(j>=last),np.floor(np.maximum(0,position+1-span)).astype(int),j)
    assert np.all(i>=0)and np.all(i<len(data))
    j=np.minimum(j,len(data)-1)
    return np.where(active,data[i]*(1-fraction)+data[j]*fraction,0)
