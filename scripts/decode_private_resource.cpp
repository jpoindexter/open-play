// Independent standard XXTEA data decoder for explicit local analysis inputs.
// No vendor constants or application code. Keys and output remain private.
#include <cstdint>
#include <algorithm>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>
#include <fcntl.h>
#include <unistd.h>

static std::vector<uint8_t> read(const char* path,size_t maximum){
    if(std::filesystem::is_symlink(path)||!std::filesystem::is_regular_file(path))throw std::runtime_error("Use regular explicit input files");
    const auto size=std::filesystem::file_size(path);
    if(size>maximum)throw std::runtime_error("Input exceeds limit");
    std::vector<uint8_t> out(size);std::ifstream stream(path,std::ios::binary);
    if(!stream.read(reinterpret_cast<char*>(out.data()),out.size()))throw std::runtime_error("Incomplete input read");
    return out;
}
static uint32_t word(const std::vector<uint8_t>& v,size_t offset){
    return uint32_t(v[offset])|uint32_t(v[offset+1])<<8|uint32_t(v[offset+2])<<16|uint32_t(v[offset+3])<<24;
}
int main(int argc,char** argv){try{
    if(argc!=5)throw std::runtime_error("Expected source, private16byte key file, NEW output and expected magic hex");
    auto data=read(argv[1],128*1024*1024),key=read(argv[2],16);
    if(key.size()!=16||data.size()<8||data.size()%4)throw std::runtime_error("Invalid key/data alignment");
    std::string hex=argv[4];if(hex.empty()||hex.size()%2||hex.size()>32)throw std::runtime_error("Expected magic must be1..16bytes");
    std::vector<uint8_t> magic;for(size_t i=0;i<hex.size();i+=2){size_t used=0;auto value=std::stoul(hex.substr(i,2),&used,16);if(used!=2)throw std::runtime_error("Invalid magic hex");magic.push_back(uint8_t(value));}
    std::vector<uint32_t> v(data.size()/4);for(size_t i=0;i<v.size();++i)v[i]=word(data,i*4);
    uint32_t k[4];for(int i=0;i<4;++i)k[i]=word(key,i*4);
    const uint32_t delta=0x9e3779b9;uint32_t sum=uint32_t(6+52/v.size())*delta,y=v[0];
    while(sum){uint32_t e=(sum>>2)&3;
        for(size_t p=v.size();p-->0;){uint32_t z=v[p?p-1:v.size()-1];uint32_t mx=((z>>5^y<<2)+(z<<4^y>>3))^((k[(p&3)^e]^z)+(y^sum));y=v[p]-=mx;}
        sum-=delta;
    }
    for(size_t i=0;i<v.size();++i)for(int j=0;j<4;++j)data[i*4+j]=uint8_t(v[i]>>(j*8));
    const size_t padding=data.back();if(padding){if(padding>data.size())throw std::runtime_error("Invalid decoded padding");for(size_t p=data.size()-padding;p<data.size();++p)if(data[p]!=padding)throw std::runtime_error("Invalid decoded padding");data.resize(data.size()-padding);}
    if(data.size()<magic.size()||!std::equal(magic.begin(),magic.end(),data.begin()))throw std::runtime_error("Decoded magic mismatch; no output written");
    int fd=open(argv[3],O_WRONLY|O_CREAT|O_EXCL,0600);if(fd<0)throw std::runtime_error("Cannot create NEW private output");
    size_t offset=0;while(offset<data.size()){ssize_t n=write(fd,data.data()+offset,data.size()-offset);if(n<=0){close(fd);throw std::runtime_error("Incomplete output write; partial private file retained");}offset+=size_t(n);}if(close(fd))throw std::runtime_error("Output close failed");
    std::cout<<"{\"decodedBytes\":"<<data.size()<<",\"expectedMagicMatched\":true,\"scope\":\"Private data decode/padding/magic only; no map or runtime acceptance\"}\n";
    return 0;
}catch(const std::exception& error){std::cerr<<error.what()<<'\n';return 1;}}
