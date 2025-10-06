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
  return sheet.getRange(address + 2, 2).getValue();
}

function writeMemory(sheet, address, value) {
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
