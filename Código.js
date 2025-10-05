/*
Author: Santiago Abuawad
CoAuthor: Diego Lewensztain
AppScript Google Sheets Simulator x86 Arquitecture
*/

var currentProcessID = 0;
var quantum = 2;
var stepCounter = 0;

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🖥️ Simulador x86')
      .addItem('▶️ Ejecutar Step', 'step')
      .addItem('🔄 Reset Program', 'resetProgram')
      .addSeparator()
      .addItem('👥 Step con Procesos', 'stepWithProcesses')
      .addToUi();
}

function resetProgram() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var regSheet = ss.getSheetByName("Registers");
  var ioSheet = ss.getSheetByName("IO");
  var memSheet = ss.getSheetByName("Memory");
  var pipeSheet = ss.getSheetByName("Pipeline");
  var procSheet = ss.getSheetByName("Processes");
  
  updateRegister(regSheet, "PC", 0);
  updateRegister(regSheet, "EAX", 0);
  updateRegister(regSheet, "EBX", 0);
  updateRegister(regSheet, "ECX", 0);
  updateRegister(regSheet, "EDX", 0);
  updateRegister(regSheet, "ZF", 0);
  
  ioSheet.clear();

  for (var i = 0; i <= 255; i++) {
    writeMemory(memSheet, i, 0);
  }
  ioSheet.appendRow(["Operación", "Valor"]);
  
  pipeSheet.getRange("A2:E10").clearContent();
  
  if (procSheet) {
    procSheet.getRange(2, 2).setValue("READY");
    procSheet.getRange(3, 2).setValue("READY");
    procSheet.getRange(4, 2).setValue("READY");
    
    for (var p = 0; p < 3; p++) {
      var row = p + 2;
      var inicioPC = procSheet.getRange(row, 9).getValue();
      procSheet.getRange(row, 3).setValue(inicioPC);
      procSheet.getRange(row, 4).setValue(0);
      procSheet.getRange(row, 5).setValue(0);
      procSheet.getRange(row, 6).setValue(0);
      procSheet.getRange(row, 7).setValue(0);
      procSheet.getRange(row, 8).setValue(0);
    }
  }
  
  stepCounter = 0;
  currentProcessID = 0;
  
  SpreadsheetApp.getUi().alert("✅ Programa reseteado.");
}

function step()
{
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var regSheet = ss.getSheetByName("Registers");
    var progSheet = ss.getSheetByName("Program");
    var ioSheet = ss.getSheetByName("IO");
    var memSheet = ss.getSheetByName("Memory");
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
    
    var shouldIncrementPC = true;
    
    if (opcode == "MOV") {
      var dest = args[0].trim();
      var value = parseInt(args[1].trim());
      updateRegister(regSheet, dest, value);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + value);
    }
    
    else if (opcode == "ADD") {
      var dest = args[0].trim();
      var addValue = parseInt(args[1].trim());
      var current = getRegisterValue(regSheet, dest);
      updateRegister(regSheet, dest, current + addValue);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + (current + addValue));
    }
    
    else if (opcode == "SUB") {
      var dest = args[0].trim();
      var subValue = parseInt(args[1].trim());
      var current = getRegisterValue(regSheet, dest);
      updateRegister(regSheet, dest, current - subValue);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + (current - subValue));
    }
    
    else if (opcode == "CMP") {
      var reg = args[0].trim();
      var val = parseInt(args[1].trim());
      var regVal = getRegisterValue(regSheet, reg);
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
      var value = readMemory(memSheet, address);
      updateRegister(regSheet, dest, value);
      pipeSheet.getRange(2, 4).setValue("Memory: leer dirección " + address);
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + value);
    }

    else if (opcode == "STORE") {
      var address = args[0].trim().replace("[", "").replace("]", "");
      address = parseInt(address);
      var source = args[1].trim();
      var value = getRegisterValue(regSheet, source);
      writeMemory(memSheet, address, value);
      pipeSheet.getRange(2, 4).setValue("Memory: escribir dirección " + address);
      pipeSheet.getRange(2, 5).setValue("WriteBack: [" + address + "] = " + value);
    }
    
    if (shouldIncrementPC) {
      updateRegister(regSheet, "PC", pc + 1);
    }
}

function stepWithProcesses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var procSheet = ss.getSheetByName("Processes");
  var regSheet = ss.getSheetByName("Registers");
  var progSheet = ss.getSheetByName("Program");
  
  if (stepCounter == 0) {
    currentProcessID = 0;
    var inicioPC = procSheet.getRange(2, 9).getValue();
    updateRegister(regSheet, "PC", inicioPC);
    procSheet.getRange(2, 2).setValue("RUNNING");
    procSheet.getRange(3, 2).setValue("READY");
    procSheet.getRange(4, 2).setValue("READY");
  }
  
  var pc = regSheet.getRange("B5").getValue();
  var instruction = progSheet.getRange(pc + 2, 1).getValue();
  
  if (instruction && instruction.trim() == "HALT") {
    procSheet.getRange(currentProcessID + 2, 2).setValue("TERMINATED");
    saveProcessState(procSheet, currentProcessID);
    SpreadsheetApp.getUi().alert("✅ Proceso " + currentProcessID + " terminado.");
    if (!switchProcess()) {
      return;
    }
    return;
  }
  
  step();
  stepCounter++;
  
  if (stepCounter % quantum == 0) {
    saveProcessState(procSheet, currentProcessID);
    switchProcess();
  }
}

function saveProcessState(procSheet, pid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var regSheet = ss.getSheetByName("Registers");
  var row = pid + 2;
  
  procSheet.getRange(row, 3).setValue(getRegisterValue(regSheet, "PC"));
  procSheet.getRange(row, 4).setValue(getRegisterValue(regSheet, "EAX"));
  procSheet.getRange(row, 5).setValue(getRegisterValue(regSheet, "EBX"));
  procSheet.getRange(row, 6).setValue(getRegisterValue(regSheet, "ECX"));
  procSheet.getRange(row, 7).setValue(getRegisterValue(regSheet, "EDX"));
  procSheet.getRange(row, 8).setValue(getRegisterValue(regSheet, "ZF"));
}

function loadProcessState(procSheet, pid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var regSheet = ss.getSheetByName("Registers");
  var row = pid + 2;
  
  var pc = procSheet.getRange(row, 3).getValue();
  var eax = procSheet.getRange(row, 4).getValue();
  var ebx = procSheet.getRange(row, 5).getValue();
  var ecx = procSheet.getRange(row, 6).getValue();
  var edx = procSheet.getRange(row, 7).getValue();
  var zf = procSheet.getRange(row, 8).getValue();
  
  updateRegister(regSheet, "PC", pc);
  updateRegister(regSheet, "EAX", eax);
  updateRegister(regSheet, "EBX", ebx);
  updateRegister(regSheet, "ECX", ecx);
  updateRegister(regSheet, "EDX", edx);
  updateRegister(regSheet, "ZF", zf);
}

function switchProcess() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var procSheet = ss.getSheetByName("Processes");
  
  var currentRow = currentProcessID + 2;
  var currentEstado = procSheet.getRange(currentRow, 2).getValue();
  
  if (currentEstado == "RUNNING") {
    procSheet.getRange(currentRow, 2).setValue("READY");
  }
  
  var found = false;
  for (var i = 1; i <= 3; i++) {
    var nextPID = (currentProcessID + i) % 3;
    var nextRow = nextPID + 2;
    var estado = procSheet.getRange(nextRow, 2).getValue();
    
    if (estado == "READY") {
      currentProcessID = nextPID;
      found = true;
      break;
    }
  }
  
  if (!found) {
    SpreadsheetApp.getUi().alert("✅ Todos los procesos terminados.");
    return false;
  }
  
  loadProcessState(procSheet, currentProcessID);
  procSheet.getRange(currentProcessID + 2, 2).setValue("RUNNING");
  
  return true;
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