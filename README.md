# x86 Simulator for Google Sheets

A visual x86 architecture simulator implemented in Google Apps Script for educational purposes.

## 🚀 Quick Start

### Installation

1. Create a new Google Sheets document
2. Open **Extensions → Apps Script**
3. Copy the entire code from `simulator.gs`
4. Save and reload the spreadsheet
5. Use the **🖥️ Simulador x86** menu to run

### Required Sheets

Create the following sheets in your spreadsheet:

```
Program     // Assembly code
Registers   // CPU registers (PC, EAX, EBX, ECX, EDX, ZF)
Memory      // 256 bytes RAM
Pipeline    // 5-stage pipeline visualization
Cache       // 8-line LRU cache
VirtualMemory // Page table (16 pages)
ALU         // Arithmetic operations display
ControlUnit // Instruction decoder status
IO          // Output operations
```

## 💻 Core Functions

### Main Execution

```javascript
function step()
```
Executes one instruction cycle:
- Fetches instruction at PC
- Decodes opcode and arguments
- Executes through 5-stage pipeline
- Updates all visualizations
- Detects and displays hazards

### Memory Management

```javascript
function translateAddress(vmSheet, virtualAddr)
```
Virtual to physical address translation:
- **Input**: Virtual address (0-255)
- **Output**: `{hit: boolean, physical: address, page: number}`
- Page size: 16 bytes
- Max frames: 4 (LRU replacement)

```javascript
function checkCache(cacheSheet, address)
```
Cache lookup with LRU:
- **Returns**: `true` (hit) or `false` (miss)
- Updates timestamps on hit
- Evicts LRU entry when full

### Hazard Detection

```javascript
function detectHazards(currentPC, opcode, args, progSheet)
```
Identifies pipeline hazards:
- **RAW hazards**: Read-after-write dependencies
- **Control hazards**: Branch instructions
- Returns array of `{type, description}`

```javascript
function analyzeInstruction(opcode, args)
```
Dependency analysis:
- **Returns**: `{reads: [], writes: []}`
- Used for RAW hazard detection

## 📋 Instruction Set

| Opcode | Format | Description |
|--------|--------|-------------|
| `MOV` | `MOV reg, value` | Load immediate |
| `ADD` | `ADD reg, value` | Addition |
| `SUB` | `SUB reg, value` | Subtraction |
| `CMP` | `CMP reg, value` | Compare (sets ZF) |
| `JMP` | `JMP address` | Unconditional jump |
| `JE` | `JE address` | Jump if equal (ZF=1) |
| `LOAD` | `LOAD reg, [addr]` | Load from memory |
| `STORE` | `STORE [addr], reg` | Store to memory |
| `PRINT` | `PRINT reg` | Output register value |
| `HALT` | `HALT` | Stop execution |

## 🔧 Code Structure

```javascript
// UI Functions
onOpen()              // Creates menu
resetProgram()        // Resets all components
step()               // Main execution loop

// Register Operations  
getRegisterValue(sheet, name)
updateRegister(sheet, name, value)

// Memory Operations
readMemory(sheet, address)      // With VM translation
writeMemory(sheet, address, value)
translateAddress(vmSheet, virtualAddr)
checkCache(cacheSheet, address)

// Pipeline Analysis
analyzeInstruction(opcode, args)
detectHazards(currentPC, opcode, args, progSheet)
```

## 🎮 Usage Example

### Sample Program
```assembly
MOV EAX, 10      ; Load 10 into EAX
ADD EAX, 5       ; Add 5 to EAX  
STORE [100], EAX ; Store result in memory
LOAD EBX, [100]  ; Load from memory
PRINT EBX        ; Output: 15
HALT             ; Stop
```

### Writing to Program Sheet
```
Row 2: MOV EAX, 10
Row 3: ADD EAX, 5
Row 4: STORE [100], EAX
Row 5: LOAD EBX, [100]
Row 6: PRINT EBX
Row 7: HALT
```

## 🏗️ Architecture Details

### Pipeline Stages
1. **Fetch (IF)** - Read instruction at PC
2. **Decode (ID)** - Parse opcode and operands
3. **Execute (EX)** - ALU operations
4. **Memory (MEM)** - Cache/RAM access
5. **Write Back (WB)** - Update registers

### Memory Hierarchy
```
Registers (1 cycle)
    ↓
L1 Cache (2 cycles) - 8 lines, LRU
    ↓  
Virtual Memory (3 cycles) - 16 pages
    ↓
Physical RAM (5 cycles) - 256 bytes
```

### Virtual Memory Configuration
```javascript
const PAGE_SIZE = 16;        // bytes per page
const NUM_PAGES = 16;        // virtual pages
const MAX_FRAMES = 4;        // physical frames
const MEMORY_SIZE = 256;     // total addressable
```

## 📊 Key Algorithms

### LRU Cache Replacement
```javascript
// Find least recently used entry
var lruIndex = 0;
var oldestTime = new Date().getTime();

for (var i = 0; i < cacheData.length; i++) {
    if (cacheData[i][3] < oldestTime) {
        oldestTime = cacheData[i][3];
        lruIndex = i;
    }
}
```

### Page Fault Handling
```javascript
if (usedFrames < MAX_FRAMES) {
    // Free frame available
    frameToUse = usedFrames++;
} else {
    // Need replacement - find LRU page
    victimPage = findLRUPage();
    frameToUse = pageTable[victimPage].frame;
    pageTable[victimPage].present = 0;
}
```

### Hazard Detection Pattern
```javascript
// Check for RAW dependencies
for (read of currentReads) {
    for (write of previousWrites) {
        if (read == write) {
            // RAW hazard detected
        }
    }
}
```

## 🐛 Debug Tips

### Common Issues

| Issue | Solution |
|-------|----------|
| Menu not appearing | Save script and reload sheet |
| PC not incrementing | Check for HALT or infinite JMP |
| Wrong values | Verify instruction syntax |
| Page faults on every access | Check page table initialization |

### Logging
Add debug output:
```javascript
console.log("PC:", pc, "Instruction:", instruction);
console.log("Hazards:", hazards);
```

## 🔄 Extending the Simulator

### Adding New Instructions

1. Add to instruction decoder in `step()`:
```javascript
else if (opcode == "MUL") {
    var dest = args[0].trim();
    var value = parseInt(args[1].trim());
    var current = getRegisterValue(regSheet, dest);
    updateRegister(regSheet, dest, current * value);
}
```

2. Update hazard detection in `analyzeInstruction()`:
```javascript
case "MUL":
    reads.push(args[0]);
    writes.push(args[0]);
    break;
```

### Modifying Cache Size
```javascript
// Change in checkCache()
const CACHE_SIZE = 16;  // Instead of 8
var cacheData = cacheSheet.getRange("A2:D17").getValues();
```

### Adding Pipeline Forwarding
```javascript
function canForward(sourceStage, destStage) {
    // EX/MEM forward to EX
    if (sourceStage >= 3 && destStage == 3) {
        return true;
    }
    return false;
}
```

## 📈 Performance Metrics

The simulator tracks:
- **Cache hit rate**: Displayed in Pipeline sheet
- **Page fault rate**: Shown during memory operations  
- **Hazards per instruction**: Counted and displayed
- **CPI (Cycles Per Instruction)**: Can be calculated from hazard penalties

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with sample programs
4. Submit pull request with:
   - Description of changes
   - Test cases
   - Updated documentation

## 📝 License

Educational project - Open source

## 👥 Authors

- **Santiago Abuawad**
- **Diego Lewensztain**

## 🔗 Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [x86 Assembly Reference](https://www.felixcloutier.com/x86/)
- [Computer Architecture: A Quantitative Approach](https://www.elsevier.com/books/computer-architecture/hennessy/978-0-12-811905-1)

---

**Note**: This is a simplified educational simulator. It does not implement the full x86 instruction set or all hardware optimizations found in real processors.