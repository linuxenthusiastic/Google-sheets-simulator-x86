/*
Author: Santiago Abuawad
CoAuthor: Diego Lewensztain
AppScript Google Sheets Simulator x86 Arquitecture
*/

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🖥️ Simulador x86')
      .addItem('▶️ Ejecutar Step', 'step')
      .addItem('🔄 Reset Program', 'resetProgram')
      .addSeparator()
      .addItem('📥 Simular Entrada de Teclado', 'simulateKeyboard')
      .addItem('🖱️ Simular Entrada de Ratón', 'simulateMouse')
      .addItem('📄 Simular Entrada de Escáner', 'simulateScanner')
      .addItem('🕹️ Simular Entrada de Joystick', 'simulateJoystick')
      .addToUi();
}

function resetProgram() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var regSheet = ss.getSheetByName("Registers");
  var ioSheet = ss.getSheetByName("IO");
  var memSheet = ss.getSheetByName("Memory");
  var pipeSheet = ss.getSheetByName("Pipeline");
  var cacheSheet = ss.getSheetByName("Cache");
  var cuSheet = ss.getSheetByName("ControlUnit");
  var aluSheet = ss.getSheetByName("ALU");
  var vmSheet = ss.getSheetByName("VirtualMemory");
  
  updateRegister(regSheet, "PC", 0);
  updateRegister(regSheet, "EAX", 0);
  updateRegister(regSheet, "EBX", 0);
  updateRegister(regSheet, "ECX", 0);
  updateRegister(regSheet, "EDX", 0);
  updateRegister(regSheet, "ZF", 0);
  
  ioSheet.clear();
  ioSheet.appendRow(["Operación", "Valor"]);

  for (var i = 0; i <= 255; i++) {
    memSheet.getRange(i + 2, 2).setValue(0);
  }
  
  pipeSheet.getRange("A2:E10").clearContent();
  
  if (cacheSheet) {
    for (var i = 0; i < 8; i++) {
      cacheSheet.getRange(i + 2, 1).setValue(0);
      cacheSheet.getRange(i + 2, 2).setValue("");
      cacheSheet.getRange(i + 2, 3).setValue("");
      cacheSheet.getRange(i + 2, 4).setValue(0);
    }
  }
  
  if (cuSheet) {
    cuSheet.getRange("A2:B10").clearContent();
  }
  
  if (aluSheet) {
    aluSheet.getRange("A2:C10").clearContent();
  }

  if (vmSheet) {
    for (var i = 0; i < 16; i++) {
      vmSheet.getRange(i + 2, 2).setValue(-1);
      vmSheet.getRange(i + 2, 3).setValue(0);
      vmSheet.getRange(i + 2, 4).setValue(0);
      vmSheet.getRange(i + 2, 5).setValue(0);
    }
  }
  
  // Reset Input Devices
  var inputSheet = ss.getSheetByName("InputDevices");
  if (inputSheet) {
    var inputDevices = ["Teclado", "Ratón", "Escáner", "Joystick"];
    for (var i = 0; i < inputDevices.length; i++) {
      inputSheet.getRange(i + 2, 2).setValue("Inactivo"); // Estado
      inputSheet.getRange(i + 2, 3).setValue(""); // Buffer vacío
    }
  }
  
  // Reset Output Devices
  var outputSheet = ss.getSheetByName("OutputDevices");
  if (outputSheet) {
    var outputDevices = ["Monitor", "Impresora", "Altavoz", "Auriculares"];
    for (var i = 0; i < outputDevices.length; i++) {
      outputSheet.getRange(i + 2, 2).setValue("Inactivo"); // Estado
      outputSheet.getRange(i + 2, 3).setValue(""); // Último dato vacío
    }
  }
  
  // Reset IO Interfaces
  var interfaceSheet = ss.getSheetByName("IOInterfaces");
  if (interfaceSheet) {
    interfaceSheet.getRange("A2:E100").clearContent();
  }
  
  // Reset Data Bus
  var busSheet = ss.getSheetByName("DataBus");
  if (busSheet) {
    busSheet.getRange("A2:E100").clearContent();
  }
  
  var inputSheet = ss.getSheetByName("InputDevices");
if (inputSheet) {
  var inputDevices = ["Teclado", "Ratón", "Escáner", "Joystick"];
  for (var i = 0; i < inputDevices.length; i++) {
    inputSheet.getRange(i + 2, 2).setValue("Inactivo"); // Estado
    inputSheet.getRange(i + 2, 3).setValue(""); // Buffer vacío
    inputSheet.getRange(i + 2, 4).setValue(""); // NUEVO: Limpiar dirección de memoria
  }
}

// Reset Output Devices
var outputSheet = ss.getSheetByName("OutputDevices");
if (outputSheet) {
  var outputDevices = ["Monitor", "Impresora", "Altavoz", "Auriculares"];
  for (var i = 0; i < outputDevices.length; i++) {
    outputSheet.getRange(i + 2, 2).setValue("Inactivo"); // Estado
    outputSheet.getRange(i + 2, 3).setValue(""); // Último dato vacío
    outputSheet.getRange(i + 2, 4).setValue(""); // NUEVO: Limpiar dirección de memoria
  }
  // NUEVO: Limpiar interpretación ASCII en B7
  outputSheet.getRange(7, 2).setValue("");
}

  SpreadsheetApp.getUi().alert("✅ Programa reseteado.");
}

function step() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var regSheet = ss.getSheetByName("Registers");
    var progSheet = ss.getSheetByName("Program");
    var ioSheet = ss.getSheetByName("IO");
    var memSheet = ss.getSheetByName("Memory");
    var cacheSheet = ss.getSheetByName("Cache");
    var cuSheet = ss.getSheetByName("ControlUnit");
    var aluSheet = ss.getSheetByName("ALU");
    var pc = getRegisterValue(regSheet, "PC");
    
    if (!progSheet.getRange(pc + 2, 1).getValue()) {
      SpreadsheetApp.getUi().alert("❌ Error: No hay más instrucciones.");
      return;
    }
    
    var instruction = progSheet.getRange(pc + 2, 1).getValue().trim();
    var parts = instruction.split(/\s+/);
    var opcode = parts[0];
    var args = parts.slice(1).join(" ").split(",");
    
    var pipeSheet = ss.getSheetByName("Pipeline");
    pipeSheet.getRange("A2:E10").clearContent();
    pipeSheet.getRange(2, 1).setValue("Fetch: " + instruction);
    pipeSheet.getRange(2, 2).setValue("Decode: " + opcode);
    pipeSheet.getRange(2, 3).setValue("Execute: procesando...");

    var hazards = detectHazards(pc, opcode, args, progSheet);

if (hazards.length > 0) {
  var hazardText = "";
  for (var i = 0; i < hazards.length; i++) {
    hazardText += hazards[i].type + ": " + hazards[i].description;
    if (i < hazards.length - 1) hazardText += " | ";
  }
  pipeSheet.getRange(3, 1, 1, 5).merge();
  pipeSheet.getRange(3, 1).setValue("⚠️ HAZARDS: " + hazardText);
  pipeSheet.getRange(3, 1).setBackground("#ffcccc");
} else {
  pipeSheet.getRange(3, 1, 1, 5).merge();
  pipeSheet.getRange(3, 1).setValue("✓ Sin hazards");
  pipeSheet.getRange(3, 1).setBackground("#ccffcc");
}
    
    if (cuSheet) {
      cuSheet.getRange("A2:B10").clearContent();
      cuSheet.getRange(2, 1).setValue("Instrucción actual:");
      cuSheet.getRange(2, 2).setValue(instruction);
      cuSheet.getRange(3, 1).setValue("Opcode:");
      cuSheet.getRange(3, 2).setValue(opcode);
      cuSheet.getRange(4, 1).setValue("PC:");
      cuSheet.getRange(4, 2).setValue(pc);
    }
    
    var shouldIncrementPC = true;
    
    if (opcode == "MOV") {
      var dest = args[0].trim();
      var value = parseInt(args[1].trim());
      
      if (aluSheet) {
        aluSheet.getRange("A2:C10").clearContent();
        aluSheet.getRange(2, 1).setValue("Operación: MOV (transferencia)");
        aluSheet.getRange(3, 1).setValue("Destino: " + dest);
        aluSheet.getRange(3, 2).setValue("Valor: " + value);
      }
      
      updateRegister(regSheet, dest, value);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + value);
    }
    
    else if (opcode == "ADD") {
      var dest = args[0].trim();
      var addValue = parseInt(args[1].trim());
      var current = getRegisterValue(regSheet, dest);
      
      if (aluSheet) {
        aluSheet.getRange("A2:C10").clearContent();
        aluSheet.getRange(2, 1).setValue("Operación: ADD");
        aluSheet.getRange(3, 1).setValue("Operando A:");
        aluSheet.getRange(3, 2).setValue(current);
        aluSheet.getRange(4, 1).setValue("Operando B:");
        aluSheet.getRange(4, 2).setValue(addValue);
        aluSheet.getRange(5, 1).setValue("Resultado:");
        aluSheet.getRange(5, 2).setValue(current + addValue);
      }
      
      updateRegister(regSheet, dest, current + addValue);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + (current + addValue));
    }
    
    else if (opcode == "SUB") {
      var dest = args[0].trim();
      var subValue = parseInt(args[1].trim());
      var current = getRegisterValue(regSheet, dest);
      
      if (aluSheet) {
        aluSheet.getRange("A2:C10").clearContent();
        aluSheet.getRange(2, 1).setValue("Operación: SUB");
        aluSheet.getRange(3, 1).setValue("Operando A:");
        aluSheet.getRange(3, 2).setValue(current);
        aluSheet.getRange(4, 1).setValue("Operando B:");
        aluSheet.getRange(4, 2).setValue(subValue);
        aluSheet.getRange(5, 1).setValue("Resultado:");
        aluSheet.getRange(5, 2).setValue(current - subValue);
      }
      
      updateRegister(regSheet, dest, current - subValue);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + (current - subValue));
    }
    
    else if (opcode == "CMP") {
      var reg = args[0].trim();
      var val = parseInt(args[1].trim());
      var regVal = getRegisterValue(regSheet, reg);
      
      if (aluSheet) {
        aluSheet.getRange("A2:C10").clearContent();
        aluSheet.getRange(2, 1).setValue("Operación: CMP (comparar)");
        aluSheet.getRange(3, 1).setValue("Valor A:");
        aluSheet.getRange(3, 2).setValue(regVal);
        aluSheet.getRange(4, 1).setValue("Valor B:");
        aluSheet.getRange(4, 2).setValue(val);
        aluSheet.getRange(5, 1).setValue("ZF (iguales?):");
        aluSheet.getRange(5, 2).setValue(regVal == val ? 1 : 0);
      }
      
      if (regVal == val) {
        updateRegister(regSheet, "ZF", 1);
      } else {
        updateRegister(regSheet, "ZF", 0);
      }
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: ZF actualizado");
    }
    
    else if (opcode == "JMP") {
      var target = parseInt(args[0].trim());
      updateRegister(regSheet, "PC", target);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: PC = " + target);
      shouldIncrementPC = false;
    }
    
    else if (opcode == "JE") {
      var target = parseInt(args[0].trim());
      var zf = getRegisterValue(regSheet, "ZF");
      if (zf == 1) {
        updateRegister(regSheet, "PC", target);
        pipeSheet.getRange(2, 4).setValue("Memory: —");
        pipeSheet.getRange(2, 5).setValue("WriteBack: Salto a " + target);
        shouldIncrementPC = false;
      } else {
        pipeSheet.getRange(2, 4).setValue("Memory: —");
        pipeSheet.getRange(2, 5).setValue("WriteBack: No saltar");
      }
    }
    
    else if (opcode == "PRINT") {
      var reg = args[0].trim();
      var val = getRegisterValue(regSheet, reg);
      ioSheet.appendRow(["PRINT", val]);
      pipeSheet.getRange(2, 4).setValue("Memory: salida IO");
      pipeSheet.getRange(2, 5).setValue("WriteBack: impreso " + val);
    }
    
    else if (opcode == "HALT") {
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: DETENIDO");
      SpreadsheetApp.getUi().alert("⏹️ Programa terminado.");
      shouldIncrementPC = false;
    }
    
    else if (opcode == "LOAD") {
      var dest = args[0].trim();
      var address = args[1].trim().replace("[", "").replace("]", "");
      address = parseInt(address);
      
      var cacheHit = checkCache(cacheSheet, address);
      var value = readMemory(memSheet, address);
      
      updateRegister(regSheet, dest, value);
      pipeSheet.getRange(2, 4).setValue("Memory: " + (cacheHit ? "Cache HIT" : "Cache MISS") + " [" + address + "]");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + value);
    }

    else if (opcode == "STORE") {
      var address = args[0].trim().replace("[", "").replace("]", "");
      address = parseInt(address);
      var source = args[1].trim();
      var value = getRegisterValue(regSheet, source);
      
      var cacheHit = checkCache(cacheSheet, address);
      writeMemory(memSheet, address, value);
      
      pipeSheet.getRange(2, 4).setValue("Memory: " + (cacheHit ? "Cache HIT" : "Cache MISS") + " [" + address + "]");
      pipeSheet.getRange(2, 5).setValue("WriteBack: [" + address + "] = " + value);
    }
    

else if (opcode == "IN") {
  var dest = args[0].trim();
  var port = parseInt(args[1].trim());
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inputSheet = ss.getSheetByName("InputDevices");
  var busSheet = ss.getSheetByName("DataBus");
  
  // Determinar dispositivo según puerto
  var deviceName = "";
  var deviceRow = 0;
  if (port == 0x60 || port == 96) { deviceName = "Teclado"; deviceRow = 2; }
  else if (port == 0x61 || port == 97) { deviceName = "Ratón"; deviceRow = 3; }
  else if (port == 0x62 || port == 98) { deviceName = "Escáner"; deviceRow = 4; }
  else if (port == 0x63 || port == 99) { deviceName = "Joystick"; deviceRow = 5; }
  
  var value = inputSheet.getRange(deviceRow, 3).getValue();
  if (value === "") value = 0;
  
  updateRegister(regSheet, dest, value);
  
  // Actualizar dirección de memoria en InputDevices (ANTES de limpiar)
  inputSheet.getRange(deviceRow, 4).setValue("0x" + port.toString(16).toUpperCase()); // ← NUEVA LÍNEA
  
  logDataBus(busSheet, value, port, "READ", deviceName + " → " + dest);
  
  pipeSheet.getRange(2, 4).setValue("Memory: I/O READ puerto 0x" + port.toString(16));
  pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + value + " (desde " + deviceName + ")");
  
  // Limpiar buffer después de leer
  inputSheet.getRange(deviceRow, 3).setValue("");
  inputSheet.getRange(deviceRow, 2).setValue("Inactivo");
}
    
else if (opcode == "OUT") {
  var port = parseInt(args[0].trim());
  var source = args[1].trim();
  var value = getRegisterValue(regSheet, source);
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var outputSheet = ss.getSheetByName("OutputDevices");
  var busSheet = ss.getSheetByName("DataBus");
  var interfaceSheet = ss.getSheetByName("IOInterfaces");
  
  // Determinar dispositivo según puerto
  var deviceName = "";
  var deviceRow = 0;
  if (port == 0x70 || port == 112) { deviceName = "Monitor"; deviceRow = 2; }
  else if (port == 0x71 || port == 113) { deviceName = "Impresora"; deviceRow = 3; }
  else if (port == 0x72 || port == 114) { deviceName = "Altavoz"; deviceRow = 4; }
  else if (port == 0x73 || port == 115) { deviceName = "Auriculares"; deviceRow = 5; }
  
  // Actualizar dispositivo de salida
  outputSheet.getRange(deviceRow, 2).setValue("Activo");
  outputSheet.getRange(deviceRow, 3).setValue(value);
  outputSheet.getRange(deviceRow, 4).setValue("0x" + port.toString(16).toUpperCase());
  
  // ========== NUEVO: Interpretación ASCII en B7 (solo para Monitor) ==========
if (deviceName == "Monitor") {
  var textoActual = outputSheet.getRange(7, 2).getValue(); // Leer lo que ya hay
  if (!textoActual) textoActual = ""; // Si está vacío, inicializar
  
  var nuevoCaracter = "";
  
  if (value >= 32 && value <= 126) {
    // Caracteres imprimibles ASCII
    nuevoCaracter = String.fromCharCode(value);
  } else if (value == 10) {
    // Enter = nueva línea
    nuevoCaracter = "\n";
  } else if (value == 32) {
    // Espacio
    nuevoCaracter = " ";
  } else if (value == 8) {
    // Backspace = borrar último carácter
    textoActual = textoActual.slice(0, -1);
    nuevoCaracter = "";
  } else {
    // Otros códigos (mostrar entre corchetes)
    nuevoCaracter = "[" + value + "]";
  }
  
  // ACUMULAR: agregar nuevo carácter al texto existente
  textoActual += nuevoCaracter;
  
  outputSheet.getRange(7, 2).setValue(textoActual); // Guardar texto acumulado
}
  
  // Registrar en interfaces
  var lastRow = interfaceSheet.getLastRow() + 1;
  interfaceSheet.getRange(lastRow, 1).setValue("Output");
  interfaceSheet.getRange(lastRow, 2).setValue(deviceName);
  interfaceSheet.getRange(lastRow, 3).setValue("Controller_" + deviceName);
  interfaceSheet.getRange(lastRow, 4).setValue("0x" + port.toString(16).toUpperCase());
  interfaceSheet.getRange(lastRow, 5).setValue("SENT (valor: " + value + ")");
  
  logDataBus(busSheet, value, port, "WRITE", source + " → " + deviceName);
  
  pipeSheet.getRange(2, 4).setValue("Memory: I/O WRITE puerto 0x" + port.toString(16));
  pipeSheet.getRange(2, 5).setValue("WriteBack: " + value + " enviado a " + deviceName);
}


    if (shouldIncrementPC) {
      updateRegister(regSheet, "PC", pc + 1);
    }


}

function checkCache(cacheSheet, address) {
  if (!cacheSheet) return false;
  
  var cacheData = cacheSheet.getRange("A2:D9").getValues();
  var hit = false;
  var hitIndex = -1;
  
  for (var i = 0; i < cacheData.length; i++) {
    if (cacheData[i][1] == address && cacheData[i][0] == 1) {
      hit = true;
      hitIndex = i;
      break;
    }
  }
  
  if (hit) {
    cacheSheet.getRange(hitIndex + 2, 4).setValue(new Date().getTime());
    return true;
  } else {
    var lruIndex = 0;
    var oldestTime = new Date().getTime();
    var hasEmpty = false;
    
    for (var i = 0; i < cacheData.length; i++) {
      if (cacheData[i][0] == 0) {
        lruIndex = i;
        hasEmpty = true;
        break;
      }
      if (cacheData[i][3] > 0 && cacheData[i][3] < oldestTime) {
        oldestTime = cacheData[i][3];
        lruIndex = i;
      }
    }
    
    cacheSheet.getRange(lruIndex + 2, 1).setValue(1);
    cacheSheet.getRange(lruIndex + 2, 2).setValue(address);
    cacheSheet.getRange(lruIndex + 2, 3).setValue("Datos en RAM[" + address + "]");
    cacheSheet.getRange(lruIndex + 2, 4).setValue(new Date().getTime());
    
    return false;
  }
}

function getRegisterValue(sheet, name) {
  var range = sheet.getRange("A2:A10").getValues(); 
  for (var i = 0; i < range.length; i++) {
    if (range[i][0] == name) {
      return sheet.getRange(i + 2, 2).getValue();
    }
  }
  return null;
}

function updateRegister(sheet, name, value) {
  var range = sheet.getRange("A2:A10").getValues();
  for (var i = 0; i < range.length; i++) {
    if (range[i][0] == name) {
      sheet.getRange(i + 2, 2).setValue(value);
      return;
    }
  }
}

function readMemory(sheet, address) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vmSheet = ss.getSheetByName("VirtualMemory");
  
  if (vmSheet) {
    var result = translateAddress(vmSheet, address);
    address = result.physical;
    
    var pipeSheet = ss.getSheetByName("Pipeline");
    var currentMem = pipeSheet.getRange(2, 4).getValue();
    if (!result.hit) {
      pipeSheet.getRange(2, 4).setValue(currentMem + " | Page FAULT");
    } else {
      pipeSheet.getRange(2, 4).setValue(currentMem + " | Page HIT");
    }
  }
  
  return sheet.getRange(address + 2, 2).getValue();
}

function writeMemory(sheet, address, value) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vmSheet = ss.getSheetByName("VirtualMemory");
  
  if (vmSheet) {
    var result = translateAddress(vmSheet, address);
    address = result.physical;
    
    var pipeSheet = ss.getSheetByName("Pipeline");
    var currentMem = pipeSheet.getRange(2, 4).getValue();
    if (!result.hit) {
      pipeSheet.getRange(2, 4).setValue(currentMem + " | Page FAULT");
    } else {
      pipeSheet.getRange(2, 4).setValue(currentMem + " | Page HIT");
    }
  }
  
  sheet.getRange(address + 2, 2).setValue(value);
}

function analyzeInstruction(opcode, args) {
  var reads = [];
  var writes = [];
  
  if (opcode == "MOV") {
    writes.push(args[0].trim());
  }
  else if (opcode == "ADD" || opcode == "SUB") {
    var reg = args[0].trim();
    reads.push(reg);
    writes.push(reg);
  }
  else if (opcode == "CMP") {
    reads.push(args[0].trim());
  }
  else if (opcode == "LOAD") {
    writes.push(args[0].trim());
  }
  else if (opcode == "STORE") {
    reads.push(args[1].trim());
  }
  else if (opcode == "PRINT") {
    reads.push(args[0].trim());
  }
  
  return {reads: reads, writes: writes};
}

function detectHazards(currentPC, opcode, args, progSheet) {
  var hazards = [];
  
  if (opcode == "JMP" || opcode == "JE") {
    hazards.push({
      type: "CONTROL",
      description: "Salto detectado - pipeline debe pausarse"
    });
  }
  
  if (currentPC > 0) {
    var prevInstruction = progSheet.getRange(currentPC + 1, 1).getValue();
    if (prevInstruction) {
      var prevParts = prevInstruction.trim().split(/\s+/);
      var prevOpcode = prevParts[0];
      var prevArgs = prevParts.slice(1).join(" ").split(",");
      
      var current = analyzeInstruction(opcode, args);
      var previous = analyzeInstruction(prevOpcode, prevArgs);
      
      for (var i = 0; i < current.reads.length; i++) {
        for (var j = 0; j < previous.writes.length; j++) {
          if (current.reads[i] == previous.writes[j]) {
            hazards.push({
              type: "DATA (RAW)",
              description: "Instrucción anterior escribe " + previous.writes[j] + ", actual lo lee"
            });
          }
        }
      }
    }
  }
  
  return hazards;
}


var MAX_FRAMES = 4;

function translateAddress(vmSheet, virtualAddr) {
  var pageSize = 16;
  var pageNumber = Math.floor(virtualAddr / pageSize);
  var offset = virtualAddr % pageSize;
  
  if (pageNumber >= 16) pageNumber = 15;
  
  var pageTable = vmSheet.getRange(2, 1, 16, 5).getValues();
  
  if (pageTable[pageNumber][2] == 1) {
    var frameNumber = pageTable[pageNumber][1];
    var physicalAddr = frameNumber * pageSize + offset;
    
    vmSheet.getRange(pageNumber + 2, 4).setValue(pageTable[pageNumber][3] + 1);
    vmSheet.getRange(pageNumber + 2, 5).setValue(new Date().getTime());
    
    return {hit: true, physical: physicalAddr, page: pageNumber};
  }
  
  var usedFrames = [];
  for (var i = 0; i < 16; i++) {
    if (pageTable[i][2] == 1) {
      usedFrames.push({
        page: i,
        frame: pageTable[i][1],
        timestamp: pageTable[i][4]
      });
    }
  }
  
  var frameToUse;
  var victimPage = -1;
  
  if (usedFrames.length < MAX_FRAMES) {
    frameToUse = usedFrames.length;
  } else {
    var oldestTime = new Date().getTime();
    for (var i = 0; i < usedFrames.length; i++) {
      if (usedFrames[i].timestamp < oldestTime) {
        oldestTime = usedFrames[i].timestamp;
        victimPage = usedFrames[i].page;
        frameToUse = usedFrames[i].frame;
      }
    }
    
    if (victimPage != -1) {
      vmSheet.getRange(victimPage + 2, 3).setValue(0);
    }
  }
  
  vmSheet.getRange(pageNumber + 2, 2).setValue(frameToUse);
  vmSheet.getRange(pageNumber + 2, 3).setValue(1);
  vmSheet.getRange(pageNumber + 2, 4).setValue(1);
  vmSheet.getRange(pageNumber + 2, 5).setValue(new Date().getTime());
  
  var physicalAddr = frameToUse * pageSize + offset;
  return {hit: false, physical: physicalAddr, page: pageNumber};
}


function simulateKeyboard() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('⌨️ Teclado Virtual', 
                           'Ingresa un valor numérico (0-255):', 
                           ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() == ui.Button.OK) {
    var value = parseInt(response.getResponseText());
    if (isNaN(value) || value < 0 || value > 255) {
      ui.alert('❌ Error: Ingresa un número entre 0 y 255');
      return;
    }
    
    writeToInputDevice("Teclado", value, 0x60);
    ui.alert('✅ Dato ' + value + ' capturado del teclado en puerto 0x60');
  }
}

function simulateMouse() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('🖱️ Ratón Virtual', 
                           'Simular click (1) o movimiento (coordenada 0-255):', 
                           ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() == ui.Button.OK) {
    var value = parseInt(response.getResponseText());
    if (isNaN(value) || value < 0 || value > 255) {
      ui.alert('❌ Error: Ingresa un número entre 0 y 255');
      return;
    }
    
    writeToInputDevice("Ratón", value, 0x61);
    ui.alert('✅ Dato ' + value + ' capturado del ratón en puerto 0x61');
  }
}

function simulateScanner() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('📄 Escáner Virtual', 
                           'Simular dato escaneado (0-255):', 
                           ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() == ui.Button.OK) {
    var value = parseInt(response.getResponseText());
    if (isNaN(value) || value < 0 || value > 255) {
      ui.alert('❌ Error: Ingresa un número entre 0 y 255');
      return;
    }
    
    writeToInputDevice("Escáner", value, 0x62);
    ui.alert('✅ Dato ' + value + ' capturado del escáner en puerto 0x62');
  }
}

function writeToInputDevice(deviceName, value, port) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inputSheet = ss.getSheetByName("InputDevices");
  var interfaceSheet = ss.getSheetByName("IOInterfaces");
  var busSheet = ss.getSheetByName("DataBus");
  
  if (!inputSheet) {
    SpreadsheetApp.getUi().alert("❌ Error: No existe la hoja InputDevices");
    return;
  }
  
  // Mapeo directo de dispositivo a fila
  var deviceRow = {
    "Teclado": 2,
    "Ratón": 3,
    "Escáner": 4,
    "Joystick": 5
  };
  
  var row = deviceRow[deviceName];
  
  if (!row) {
    SpreadsheetApp.getUi().alert("❌ Error: Dispositivo '" + deviceName + "' no reconocido");
    return;
  }
  
  // Actualizar dispositivo de entrada directamente
  inputSheet.getRange(row, 2).setValue("Activo");                              // Columna B: Estado
  inputSheet.getRange(row, 3).setValue(value);                                 // Columna C: Buffer
  inputSheet.getRange(row, 4).setValue("0x" + port.toString(16).toUpperCase()); // Columna D: Dirección ← NUEVA LÍNEA
  
  // Registrar en interfaces
  if (interfaceSheet) {
    var lastRow = interfaceSheet.getLastRow();
    if (lastRow == 0) lastRow = 1;
    interfaceSheet.getRange(lastRow + 1, 1).setValue("Input");
    interfaceSheet.getRange(lastRow + 1, 2).setValue(deviceName);
    interfaceSheet.getRange(lastRow + 1, 3).setValue("Controller_" + deviceName);
    interfaceSheet.getRange(lastRow + 1, 4).setValue("0x" + port.toString(16).toUpperCase());
    interfaceSheet.getRange(lastRow + 1, 5).setValue("READY (valor: " + value + ")");
  }
  
  // Registrar en bus de datos
  logDataBus(busSheet, value, port, "READ", deviceName + " → CPU");
}


function logDataBus(busSheet, data, address, control, description) {
  if (!busSheet) return;
  
  var lastRow = busSheet.getLastRow();
  if (lastRow == 0) lastRow = 1;
  
  var cycle = lastRow;
  busSheet.getRange(lastRow + 1, 1).setValue(cycle);
  busSheet.getRange(lastRow + 1, 2).setValue(data);
  busSheet.getRange(lastRow + 1, 3).setValue("0x" + address.toString(16).toUpperCase());
  busSheet.getRange(lastRow + 1, 4).setValue(control);
  busSheet.getRange(lastRow + 1, 5).setValue(description);
}

function diagnosticarHojas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = ss.getSheets();
  var nombres = [];
  
  for (var i = 0; i < hojas.length; i++) {
    nombres.push(hojas[i].getName());
  }
  
  SpreadsheetApp.getUi().alert("Hojas encontradas:\n" + nombres.join("\n"));
}

function diagnosticarInputDevices() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inputSheet = ss.getSheetByName("InputDevices");
  
  var devices = inputSheet.getRange("A2:A5").getValues();
  var mensaje = "Dispositivos encontrados:\n";
  
  for (var i = 0; i < devices.length; i++) {
    mensaje += "Fila " + (i+2) + ": [" + devices[i][0] + "]\n";
  }
  
  SpreadsheetApp.getUi().alert(mensaje);
}


function simulateJoystick() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('🕹️ Joystick Virtual', 
                           'Simular dirección: 0=Centro, 1=Arriba, 2=Derecha, 3=Abajo, 4=Izquierda:', 
                           ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() == ui.Button.OK) {
    var value = parseInt(response.getResponseText());
    if (isNaN(value) || value < 0 || value > 4) {
      ui.alert('❌ Error: Ingresa un número entre 0 y 4');
      return;
    }
    
    var direccion = ["Centro", "Arriba", "Derecha", "Abajo", "Izquierda"][value];
    writeToInputDevice("Joystick", value, 0x63);
    ui.alert('✅ Joystick: ' + direccion + ' (valor ' + value + ') en puerto 0x63');
  }
}
