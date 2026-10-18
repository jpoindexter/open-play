"""Local-only pinned libebur128 reference, not a production dependency."""
import ctypes,json,math,sys
lib=ctypes.CDLL(sys.argv[1]);channels=int(sys.argv[4]);rate=int(sys.argv[3]);payload=open(sys.argv[2],'rb').read();data=(ctypes.c_float*(len(payload)//4)).from_buffer_copy(payload)
lib.ebur128_init.argtypes=[ctypes.c_uint,ctypes.c_ulong,ctypes.c_int];lib.ebur128_init.restype=ctypes.c_void_p
lib.ebur128_add_frames_float.argtypes=[ctypes.c_void_p,ctypes.POINTER(ctypes.c_float),ctypes.c_size_t];lib.ebur128_loudness_global.argtypes=[ctypes.c_void_p,ctypes.POINTER(ctypes.c_double)];lib.ebur128_destroy.argtypes=[ctypes.POINTER(ctypes.c_void_p)]
state=ctypes.c_void_p(lib.ebur128_init(channels,rate,5));assert state.value
try:
 assert lib.ebur128_add_frames_float(state,data,len(data)//channels)==0
 value=ctypes.c_double();assert lib.ebur128_loudness_global(state,ctypes.byref(value))==0
 print(json.dumps({'integratedLUFS':value.value if math.isfinite(value.value) else None,'channels':channels,'sampleRate':rate,'frames':len(data)//channels}))
finally:lib.ebur128_destroy(ctypes.byref(state))
