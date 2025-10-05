 /*
Author: Santiago Abuawad
CoAuthor: Diego Lewensztain

AppScript Google Sheets Simulator x86 Arquitecture
*/

/* Menu */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🖥️ Simulador x86')
      .addItem('▶️ Ejecutar Step', 'step')
      .addItem('🔄 Reset Program', 'resetProgram')
      .addToUi();
}

/* Reset */

function resetProgram() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var regSheet = ss.getSheetByName("Registers");
  var ioSheet = ss.getSheetByName("IO");
  var pipeSheet = ss.getSheetByName("Pipeline");
  
  updateRegister(regSheet, "PC", 0);
  updateRegister(regSheet, "EAX", 0);
  updateRegister(regSheet, "EBX", 0);
  updateRegister(regSheet, "ECX", 0);
  updateRegister(regSheet, "EDX", 0);
  updateRegister(regSheet, "ZF", 0);
  
  ioSheet.clear();
  ioSheet.appendRow(["Operación", "Valor"]);
  
  pipeSheet.getRange("A2:E10").clearContent();
  
  SpreadsheetApp.getUi().alert("✅ Programa reseteado.");
}

/* Ejecutar */
function step()
{
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var regSheet = ss.getSheetByName("Registers");
    var progSheet = ss.getSheetByName("Program");
    var ioSheet = ss.getSheetByName("IO");
    var pc = regSheet.getRange("B5").getValue();
    
    // Verificar si el PC está fuera de rango
    if (!progSheet.getRange(pc + 2, 1).getValue()) {
      SpreadsheetApp.getUi().alert("❌ Error: No hay más instrucciones.");
      return;
    }
    
    var instruction = progSheet.getRange(pc + 2, 1).getValue();
    var parts = instruction.split(" ");
    var opcode = parts[0];
    var args = parts.slice(1).join(" ").split(",");
    
    /* Pipeline */
    var pipeSheet = ss.getSheetByName("Pipeline");
    pipeSheet.getRange("A2:E10").clearContent();
    pipeSheet.getRange(2, 1).setValue("Fetch: " + instruction);
    pipeSheet.getRange(2, 2).setValue("Decode: " + opcode);
    pipeSheet.getRange(2, 3).setValue("Execute: procesando...");
    
    if (opcode == "MOV") {
      var dest = args[0].trim();
      var value = parseInt(args[1].trim());
      updateRegister(regSheet, dest, value);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + value);
    }
    
    if (opcode == "ADD") {
      var dest = args[0].trim();
      var addValue = parseInt(args[1].trim());
      var current = getRegisterValue(regSheet, dest);
      updateRegister(regSheet, dest, current + addValue);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + (current + addValue));
    }
    
    if (opcode == "SUB") {
      var dest = args[0].trim();
      var subValue = parseInt(args[1].trim());
      var current = getRegisterValue(regSheet, dest);
      updateRegister(regSheet, dest, current - subValue);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: " + dest + " = " + (current - subValue));
    }
    
    if (opcode == "CMP") {
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
    
    if (opcode == "JMP") {
      var target = parseInt(args[0].trim());
      updateRegister(regSheet, "PC", target);
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: PC = " + target);
      return;
    }
    
    if (opcode == "JE") {
      var target = parseInt(args[0].trim());
      var zf = getRegisterValue(regSheet, "ZF");
      if (zf == 1) {
        updateRegister(regSheet, "PC", target);
        pipeSheet.getRange(2, 4).setValue("Memory: —");
        pipeSheet.getRange(2, 5).setValue("WriteBack: Salto a " + target);
        return;
      }
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: No saltar");
    }
    
    if (opcode == "PRINT") {
      var reg = args[0].trim();
      var val = getRegisterValue(regSheet, reg);
      ioSheet.appendRow(["PRINT", val]);
      pipeSheet.getRange(2, 4).setValue("Memory: salida IO");
      pipeSheet.getRange(2, 5).setValue("WriteBack: impreso " + val);
    }
    
    if (opcode == "HALT") {
      pipeSheet.getRange(2, 4).setValue("Memory: —");
      pipeSheet.getRange(2, 5).setValue("WriteBack: DETENIDO");
      SpreadsheetApp.getUi().alert("⏹️ Programa terminado.");
      return;
    }
    
    updateRegister(regSheet, "PC", pc + 1);
}

/* Lee el valor actual del registro */
function getRegisterValue(sheet, name) {
  var range = sheet.getRange("A2:A10").getValues(); 
  for (var i = 0; i < range.length; i++) {
    if (range[i][0] == name) {
      return sheet.getRange(i + 2, 2).getValue();
    }
  }
  return null;
}
/* Escribir un nuevo valor en registro busca,encuentra y escribe*/
function updateRegister(sheet, name, value) {
  var range = sheet.getRange("A2:A10").getValues();
  for (var i = 0; i < range.length; i++) {
    if (range[i][0] == name) {
      sheet.getRange(i + 2, 2).setValue(value);
      return;
    }
  }
}