// Experimental local worker. Links the installed Rubber Band C API; no app integration.
// Wire format: 40-byte LE request (OPR3OFF1,sr:u32,ch:u32,frames:u64,timeRatio:f64,pitch:f64),
// then interleaved f32. Response: 32-byte LE header (OPR3OUT1,sr,ch,frames,engine:u32,0:u32), PCM.
#include <rubberband/rubberband-c.h>
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <limits>
#include <memory>
#include <stdexcept>
#include <vector>

namespace {
constexpr std::uint64_t maxSamples = 80000000; // 320 MB input/output payload budget each.
constexpr unsigned blockSize = 2048;
void require(bool ok, const char* text) { if (!ok) throw std::runtime_error(text); }
void readExact(void* dst, std::size_t bytes) { require(std::fread(dst,1,bytes,stdin)==bytes,"truncated input"); }
std::uint64_t le(const unsigned char* p,unsigned bytes) { std::uint64_t v=0;for(unsigned n=0;n<bytes;++n)v|=std::uint64_t(p[n])<<(8*n);return v; }
double real(const unsigned char* p) { auto bits=le(p,8);double v;std::memcpy(&v,&bits,8);return v; }
void put(unsigned char* p,std::uint64_t value,unsigned bytes) { for(unsigned n=0;n<bytes;++n)p[n]=static_cast<unsigned char>((value>>(8*n))&255); }
void writeExact(const void* p,std::size_t size) { require(std::fwrite(p,1,size,stdout)==size,"output pipe closed"); }
}
int main() {
 try {
  static_assert(sizeof(float)==4&&sizeof(double)==8,"wire format requires IEEE float32/float64");
  const std::uint16_t endian=1;require(*reinterpret_cast<const unsigned char*>(&endian)==1,"little endian host required");
  unsigned char h[40];readExact(h,sizeof h);require(std::memcmp(h,"OPR3OFF1",8)==0,"invalid request version");
  unsigned sr=static_cast<unsigned>(le(h+8,4)),channels=static_cast<unsigned>(le(h+12,4));std::uint64_t frames=le(h+16,8);double ratio=real(h+24),pitch=real(h+32);
  require(sr>=8000&&sr<=192000&&channels>=1&&channels<=40&&frames>=1&&frames<=10000000,"invalid input geometry");
  require(std::isfinite(ratio)&&ratio>=.25&&ratio<=4&&std::isfinite(pitch)&&pitch>=.25&&pitch<=4,"invalid transform");
  require(frames<=maxSamples/channels,"input budget exceeded");const auto outputFrames=static_cast<std::uint64_t>(std::llround(double(frames)*ratio));require(outputFrames>=1&&outputFrames<=maxSamples/channels,"output budget exceeded");
  std::vector<std::vector<float>> input(channels,std::vector<float>(frames));std::vector<float> interleaved(blockSize*channels);std::vector<const float*> in(channels);
  for(std::uint64_t at=0;at<frames;at+=blockSize) { auto count=static_cast<unsigned>(std::min<std::uint64_t>(blockSize,frames-at));readExact(interleaved.data(),count*channels*sizeof(float));for(unsigned n=0;n<count;++n)for(unsigned c=0;c<channels;++c){float v=interleaved[n*channels+c];require(std::isfinite(v),"nonfinite input PCM");input[c][at+n]=v;} }
  require(std::fgetc(stdin)==EOF&&!std::ferror(stdin),"unexpected input suffix");
  const int options=RubberBandOptionProcessOffline|RubberBandOptionEngineFiner|RubberBandOptionChannelsTogether|RubberBandOptionPitchHighQuality|RubberBandOptionThreadingNever;
  auto raw=rubberband_new(sr,channels,options,ratio,pitch);require(raw!=nullptr,"DSP creation failed");
  std::unique_ptr<std::remove_pointer<RubberBandState>::type,decltype(&rubberband_delete)> state(raw,&rubberband_delete);
  require(rubberband_get_engine_version(raw)==3,"R3 engine unavailable");rubberband_set_expected_input_duration(raw,static_cast<unsigned>(frames));rubberband_set_max_process_size(raw,blockSize);
  for(std::uint64_t at=0;at<frames;at+=blockSize){auto count=static_cast<unsigned>(std::min<std::uint64_t>(blockSize,frames-at));for(unsigned c=0;c<channels;++c)in[c]=input[c].data()+at;rubberband_study(raw,in.data(),count,at+count==frames);}
  std::fprintf(stderr,"{\"phase\":\"processing\",\"engine\":3}\n");std::fflush(stderr);
  unsigned char outHeader[32]{};std::memcpy(outHeader,"OPR3OUT1",8);put(outHeader+8,sr,4);put(outHeader+12,channels,4);put(outHeader+16,outputFrames,8);put(outHeader+24,3,4);writeExact(outHeader,sizeof outHeader);
  std::uint64_t written=0;std::vector<std::vector<float>> outputs(channels);std::vector<float*> out(channels);
  auto drain=[&]() {
   for(;;){int count=rubberband_available(raw);if(count<=0)return count;require(static_cast<std::uint64_t>(count)<=outputFrames-written,"DSP output exceeds declared duration");
    for(unsigned c=0;c<channels;++c){outputs[c].resize(count);out[c]=outputs[c].data();}auto got=rubberband_retrieve(raw,out.data(),count);require(got==static_cast<unsigned>(count),"incomplete DSP retrieve");
    interleaved.resize(std::size_t(count)*channels);for(int n=0;n<count;++n)for(unsigned c=0;c<channels;++c){float v=outputs[c][n];require(std::isfinite(v),"nonfinite output PCM");interleaved[std::size_t(n)*channels+c]=v;}writeExact(interleaved.data(),interleaved.size()*sizeof(float));written+=got;
   }
  };
  for(std::uint64_t at=0;at<frames;at+=blockSize){auto count=static_cast<unsigned>(std::min<std::uint64_t>(blockSize,frames-at));for(unsigned c=0;c<channels;++c)in[c]=input[c].data()+at;rubberband_process(raw,in.data(),count,at+count==frames);drain();}
  require(drain()==-1&&written==outputFrames,"DSP duration mismatch");require(std::fflush(stdout)==0,"output flush failed");
  std::fprintf(stderr,"{\"phase\":\"complete\",\"inputFrames\":%llu,\"outputFrames\":%llu,\"channels\":%u}\n",static_cast<unsigned long long>(frames),static_cast<unsigned long long>(written),channels);return 0;
 } catch(const std::exception& e) { std::fprintf(stderr,"Open Play R3 worker: %s\n",e.what());return 1; }
}
