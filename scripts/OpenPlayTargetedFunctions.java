import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;

/** Explicit-address local analysis. Run with -noanalysis on a private copy.
 * Pseudocode is private evidence, never redistributable implementation source.
 */
public class OpenPlayTargetedFunctions extends GhidraScript {
    @Override public void run() throws Exception {
        String[] args=getScriptArgs();
        if(args.length!=2)throw new IllegalArgumentException("Expected comma-separated addresses and a new private output directory");
        Path directory=Path.of(args[1]);Files.createDirectories(directory);
        DecompInterface decompiler=new DecompInterface();
        if(!decompiler.openProgram(currentProgram))throw new IllegalStateException("Decompiler could not open imported program");
        try {
            for(String raw:args[0].split(",")){
                monitor.checkCancelled();Address address=toAddr(raw);
                if(!currentProgram.getMemory().contains(address))throw new IllegalArgumentException("Address outside imported memory");
                boolean decoded=disassemble(address);Function function=getFunctionAt(address);
                if(function==null)function=createFunction(address,null);
                if(function==null){println("TARGET "+address+" no function created; disassembly="+decoded);continue;}
                DecompileResults result=decompiler.decompileFunction(function,15,monitor);
                if(!result.decompileCompleted()||result.getDecompiledFunction()==null){println("TARGET "+address+" decompile unavailable: "+result.getErrorMessage());continue;}
                Path output=directory.resolve(address.toString()+".c");
                Files.writeString(output,result.getDecompiledFunction().getC(),StandardCharsets.UTF_8,java.nio.file.StandardOpenOption.CREATE_NEW);
                println("TARGET "+address+" body="+function.getBody().getNumAddresses()+" pseudocode="+Files.size(output)+" bytes");
            }
        }finally{decompiler.dispose();}
    }
}
