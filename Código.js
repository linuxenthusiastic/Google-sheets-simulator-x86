/*
Author: Santiago Abuawad
CoAuthor: Diego Lewensztain

AppScript Google Sheets Simulator x86 Arquitecture
*/

/* Ejecutar */
function step()
{
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var regSheet = ss.getSheetByName("Registers");
    var progSheet = ss.getSheetByName("Program");
    var ioSheet = ss.getSheetByName("IO");
    var pc = regSheet.getRange("B5").getValue();
    var instruction = progSheet.getRange(pc + 2, 1).getValue();
    var parts = instruction.split(" ");
    var opcode = parts[0];
    var args = parts.slice(1).join(" ").split(",");

    /*pipeline*/
    var pipeSheet = ss.getSheetByName("Pipeline");
    pipeSheet.getRange("A2:E10").clearContent();
    pipeSheet.getRange(2, 1).setValue("Instrucción " + (pc + 1) + ": Fetch");
    pipeSheet.getRange(2, 2).setValue("Instrucción " + (pc) + ": Decode");
    pipeSheet.getRange(2, 3).setValue("Instrucción " + (pc - 1) + ": Execute");

    if (opcode == "MOV") {
    var dest = args[0].trim();
    var value = parseInt(args[1].trim());
    updateRegister(regSheet, dest, value);
  }

  if (opcode == "ADD") {
    var dest = args[0].trim();
    var addValue = parseInt(args[1].trim());
    var current = getRegisterValue(regSheet, dest);
    updateRegister(regSheet, dest, current + addValue);
  }
  
  if (opcode == "PRINT") {
    var reg = args[0].trim();
    var val = getRegisterValue(regSheet, reg);
    ioSheet.appendRow(["PRINT", val]);
  }
  
  if (opcode == "HALT") {
    SpreadsheetApp.getUi().alert("Programa terminado.");
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